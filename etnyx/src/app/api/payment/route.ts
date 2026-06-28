import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase-server";

// ============================================
// DompetX Basic Merchant - Create Payment Link
// Endpoint: POST /payments/checkout
// Returns payment_link URL for customer redirect
// ============================================

async function getDompetxSettings() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations")
      .single();

    const settings = data?.value || {};
    return {
      apiKey: settings.dompetxApiKey || process.env.DOMPETX_API_KEY || "",
      baseUrl: settings.dompetxBaseUrl || process.env.DOMPETX_BASE_URL || "https://api.dompetx.com/v1",
    };
  } catch {
    return {
      apiKey: process.env.DOMPETX_API_KEY || "",
      baseUrl: process.env.DOMPETX_BASE_URL || "https://api.dompetx.com/v1",
    };
  }
}

// Build DompetX auth headers (3 required headers)
function buildAuthHeaders(apiKey: string, bodyString: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", apiKey)
    .update(timestamp + bodyString)
    .digest("hex");

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-DOMPAY-API-Key": apiKey,
    "X-DOMPAY-Signature": signature,
    "X-DOMPAY-Timestamp": timestamp,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { orderId, customerName, customerEmail, customerPhone, itemName } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order already processed" }, { status: 400 });
    }

    // Get DompetX settings
    const dompetx = await getDompetxSettings();

    if (!dompetx.apiKey) {
      return NextResponse.json({ error: "DompetX belum dikonfigurasi" }, { status: 500 });
    }

    // Use verified price from database
    const verifiedAmount = order.total_price;
    const refId = `ETN-${orderId}-${Date.now()}`;

    // Build DompetX checkout payload (POST /payments/checkout format)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";
    const checkoutBody = {
      amount: verifiedAmount,
      currency: "IDR",
      reference: refId,
      redirectUrl: `${siteUrl}/payment/success?order_id=${orderId}`,
      metadata: {
        order_name: `${itemName || "Joki ML Service"} - ${orderId}`,
        product_name: itemName || "Joki Mobile Legends",
        customer_name: customerName || order.username || "",
        customer_email: customerEmail || order.customer_email || "",
        notes: "Order akan diproses otomatis setelah pembayaran berhasil.",
        items: [
          {
            name: itemName || `Joki ${order.package_title || order.package || ""}`,
            quantity: 1,
            price: verifiedAmount,
          },
        ],
      },
    };

    const bodyString = JSON.stringify(checkoutBody);
    const authHeaders = buildAuthHeaders(dompetx.apiKey, bodyString);

    // 20 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let dompetxRes: Response;
    try {
      dompetxRes = await fetch(`${dompetx.baseUrl}/payments/checkout`, {
        method: "POST",
        headers: authHeaders,
        body: bodyString,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Capture raw text first for debugging
    const rawText = await dompetxRes.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { _raw: rawText };
    }

    if (!dompetxRes.ok) {
      console.error("DompetX error:", dompetxRes.status, rawText.slice(0, 500));
      const errMsg = (data.message || data.error) || "Payment initialization failed";
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    // Response may be flat OR nested in `data`. Check ALL known field variants.
    const checkoutData =
      (data.data && typeof data.data === "object")
        ? (data.data as Record<string, unknown>)
        : data;

    const transactionId = String(
      checkoutData.id ||
      checkoutData.checkout_id ||
      checkoutData.checkoutId ||
      checkoutData.payment_id ||
      checkoutData.paymentId ||
      checkoutData.transaction_id ||
      checkoutData.transactionId ||
      data.id ||
      ""
    );

    const paymentLink = String(
      checkoutData.payment_link ||
      checkoutData.payment_url ||
      checkoutData.paymentLink ||
      checkoutData.paymentUrl ||
      checkoutData.checkout_url ||
      checkoutData.checkoutUrl ||
      checkoutData.redirect_url ||
      checkoutData.redirectUrl ||
      checkoutData.url ||
      checkoutData.link ||
      checkoutData.invoice_url ||
      checkoutData.invoiceUrl ||
      data.payment_link ||
      data.payment_url ||
      data.checkout_url ||
      data.redirect_url ||
      data.url ||
      ""
    );

    // CONFIRMED DompetX checkout URL pattern (from production):
    // https://checkout.dompetx.com/checkoutV2?refId={ID}
    // The {ID} can be: checkout UUID, payment ID, or the reference we sent.
    let constructedLink = "";
    if (!paymentLink) {
      // Try checkout ID first, then fall back to our reference
      const refForLink = transactionId || refId;
      if (refForLink) {
        constructedLink = `https://checkout.dompetx.com/checkoutV2?refId=${refForLink}`;
        console.warn("DompetX: constructed checkout URL from", transactionId ? "ID" : "reference", ":", constructedLink);
      }
    }

    const finalLink = paymentLink || constructedLink;

    if (!finalLink) {
      console.error("DompetX: 2xx but no payment link or ID found in response:", rawText.slice(0, 500));
      return NextResponse.json({ error: "No payment link returned" }, { status: 502 });
    }

    // Save payment info to order
    await supabase
      .from("orders")
      .update({
        payment_token: transactionId || null,
        payment_url: finalLink,
        midtrans_order_id: refId,
        payment_type: "dompetx_checkout",
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      redirect_url: finalLink,
      transaction_id: transactionId,
    });
  } catch (error) {
    console.error("Payment error:", error);
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({
      error: isTimeout ? "Koneksi ke DompetX timeout" : "Payment initialization failed",
    }, { status: 500 });
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("status, payment_status, midtrans_order_id")
      .eq("order_id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: order.status,
      payment_status: order.payment_status,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}