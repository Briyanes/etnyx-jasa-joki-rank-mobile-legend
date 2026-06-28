import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase-server";

// ============================================
// DompetX Payment Recovery Endpoint
// Reconstructs/refreshes a payment link for an existing order.
// Handles cases where:
//   1. Checkout was created (email received) but URL wasn't captured
//   2. User lost the payment page link
//   3. Original link expired and needs regeneration
// ============================================

async function getDompetxSettings(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  try {
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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID wajib diisi" }, { status: 400 });
    }

    // Look up the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, total_price, status, payment_token, payment_url, midtrans_order_id, payment_type, username, customer_email, package_title")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({
        error: `Order sudah ${order.status === "paid" || order.status === "completed" ? "dibayar/selesai" : order.status}`,
      }, { status: 400 });
    }

    // CASE A: Already have a payment URL — return it directly
    if (order.payment_url) {
      return NextResponse.json({
        success: true,
        redirect_url: order.payment_url,
        transaction_id: order.payment_token || "",
        source: "cached",
      });
    }

    // CASE B: Have transaction ID (payment_token) — construct checkout URL
    // DompetX confirmed checkout URL pattern from production
    if (order.payment_token) {
      const constructedLink = `https://checkout.dompetx.com/checkoutV2?refId=${order.payment_token}`;
      console.log("[Recovery] Constructed link from existing payment_token:", constructedLink);

      // Save it for future use
      await supabase
        .from("orders")
        .update({ payment_url: constructedLink })
        .eq("id", order.id);

      return NextResponse.json({
        success: true,
        redirect_url: constructedLink,
        transaction_id: order.payment_token,
        source: "constructed_from_token",
      });
    }

    // CASE C: Have midtrans_order_id (DompetX reference) but no transaction ID
    // The reference IS the DompetX reference ID — try to look it up or construct
    if (order.midtrans_order_id) {
      const refId = order.midtrans_order_id;
      console.log("[Recovery] Have DompetX reference but no payment_token:", refId);

      // Try to get payment link from DompetX by reference
      const dompetx = await getDompetxSettings(supabase);
      if (dompetx.apiKey) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          // Try DompetX GET payment status by reference
          let statusRes: Response;
          try {
            statusRes = await fetch(
              `${dompetx.baseUrl}/payments/reference/${encodeURIComponent(refId)}`,
              {
                method: "GET",
                headers: buildAuthHeaders(dompetx.apiKey, ""),
                signal: controller.signal,
              }
            );
          } finally {
            clearTimeout(timeoutId);
          }

          if (statusRes.ok) {
            const rawText = await statusRes.text();
            let statusData: Record<string, unknown>;
            try {
              statusData = JSON.parse(rawText);
            } catch {
              statusData = { _raw: rawText };
            }

            const checkoutData =
              statusData.data && typeof statusData.data === "object"
                ? (statusData.data as Record<string, unknown>)
                : statusData;

            // Extract payment link from status response
            const link = String(
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
              ""
            );

            const trxId = String(
              checkoutData.id ||
              checkoutData.checkout_id ||
              checkoutData.checkoutId ||
              checkoutData.payment_id ||
              checkoutData.paymentId ||
              ""
            );

            const finalLink = link || (trxId ? `https://checkout.dompetx.com/checkoutV2?refId=${trxId}` : "");

            if (finalLink) {
              // Save for future use
              await supabase
                .from("orders")
                .update({
                  payment_url: finalLink,
                  payment_token: trxId || null,
                })
                .eq("id", order.id);

              return NextResponse.json({
                success: true,
                redirect_url: finalLink,
                transaction_id: trxId,
                source: "recovered_from_dompetx",
              });
            }
          }
        } catch {
          // Status lookup failed — fall through to regeneration
        }
      }

      // Last resort: create a new checkout for the same order
      console.log("[Recovery] Creating new DompetX checkout for order:", orderId);
    }

    // CASE D: No payment info at all — create a fresh checkout
    const dompetx = await getDompetxSettings(supabase);
    if (!dompetx.apiKey) {
      return NextResponse.json({
        error: "DompetX belum dikonfigurasi. Silakan transfer manual.",
      }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";
    const refId = `ETN-${orderId}-${Date.now()}`;
    const checkoutBody = {
      amount: order.total_price,
      currency: "IDR",
      reference: refId,
      redirectUrl: `${siteUrl}/payment/success?order_id=${orderId}`,
      metadata: {
        order_name: `Joki ML ${orderId}`,
        product_name: `Joki ML: ${order.package_title || "Service"}`,
        customer_name: order.username || "",
        customer_email: order.customer_email || "",
        notes: "Recovery checkout — regenerated for existing order.",
        items: [
          {
            name: order.package_title || `Joki ML ${orderId}`,
            quantity: 1,
            price: order.total_price,
          },
        ],
      },
    };

    const bodyString = JSON.stringify(checkoutBody);
    const authHeaders = buildAuthHeaders(dompetx.apiKey, bodyString);

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

    const rawText = await dompetxRes.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { _raw: rawText };
    }

    if (!dompetxRes.ok) {
      console.error("[Recovery] DompetX error:", dompetxRes.status, rawText.slice(0, 500));
      return NextResponse.json({
        error: "Gagal membuat link pembayaran baru. Silakan transfer manual.",
        dompetx_error: (data.message || data.error) || "Unknown DompetX error",
      }, { status: 502 });
    }

    const checkoutData =
      data.data && typeof data.data === "object"
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
      checkoutData.payment_checkout_id ||
      checkoutData.paymentCheckoutId ||
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

    // Construct link from checkout ID if no direct URL
    let constructedLink = "";
    if (!paymentLink && transactionId) {
      constructedLink = `https://checkout.dompetx.com/checkoutV2?refId=${transactionId}`;
    }

    // Also try using the reference as refId (confirmed pattern from email)
    if (!paymentLink && !constructedLink && refId) {
      constructedLink = `https://checkout.dompetx.com/checkoutV2?refId=${refId}`;
    }

    const finalLink = paymentLink || constructedLink;

    if (!finalLink) {
      console.error("[Recovery] No payment link or ID found:", rawText.slice(0, 500));
      return NextResponse.json({
        error: "Checkout dibuat tapi link tidak tersedia. Cek email Anda atau transfer manual.",
        checkout_created: true,
      }, { status: 502 });
    }

    // Save payment info
    await supabase
      .from("orders")
      .update({
        payment_token: transactionId || null,
        payment_url: finalLink,
        midtrans_order_id: refId,
        payment_type: "dompetx_checkout_recovery",
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      redirect_url: finalLink,
      transaction_id: transactionId,
      source: "regenerated",
    });
  } catch (error) {
    console.error("[Recovery] Error:", error);
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({
      error: isTimeout
        ? "Koneksi ke DompetX timeout. Silakan coba lagi."
        : "Gagal memproses. Silakan coba lagi atau transfer manual.",
    }, { status: 500 });
  }
}