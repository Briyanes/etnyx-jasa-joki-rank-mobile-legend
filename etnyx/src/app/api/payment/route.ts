import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getDuitkuConfig, createDuitkuCheckout } from "@/lib/payments/duitku";

// ============================================
// Duitku — Create Payment Link (redirect-style API)
// Returns redirect_url for customer redirect.
// Kept response shape identical to the old DompetX endpoint
// (redirect_url / transaction_id) so existing frontend callers work.
// ============================================

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://etnyx.com");

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { orderId, customerName, customerEmail, customerPhone, itemName } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

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

    const config = await getDuitkuConfig(supabase);
    if (!config.merchantCode || !config.apiKey) {
      return NextResponse.json({ error: "Duitku belum dikonfigurasi" }, { status: 500 });
    }

    // Use verified price from database (never trust client amount)
    const verifiedAmount = order.total_price;
    const merchantOrderId = `ETN-${orderId}-${Date.now()}`;

    const checkout = await createDuitkuCheckout(config, {
      amount: verifiedAmount,
      merchantOrderId,
      productDetails: itemName || `Joki ML ${orderId}`,
      email: customerEmail || order.customer_email || `customer+${orderId}@etnyx.com`,
      phoneNumber: customerPhone || order.whatsapp || undefined,
      returnUrl: `${SITE_URL}/payment/success?order_id=${orderId}`,
      callbackUrl: `${SITE_URL}/api/payment/callback`,
      expiryDuration: 1440, // 24h
      itemDetails: [
        {
          name: itemName || `Joki ${order.package_title || order.package || orderId}`,
          qty: 1,
          price: verifiedAmount,
        },
      ],
    });

    // Save payment info to order
    await supabase
      .from("orders")
      .update({
        payment_token: checkout.reference,
        payment_url: checkout.paymentUrl,
        midtrans_order_id: merchantOrderId,
        payment_type: "duitku_checkout",
        gateway_provider: "duitku",
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      redirect_url: checkout.paymentUrl,
      transaction_id: checkout.reference,
    });
  } catch (error) {
    console.error("Payment error:", error);
    const isTimeout = error instanceof Error && eName(error) === "AbortError";
    return NextResponse.json(
      {
        error: isTimeout ? "Koneksi ke Duitku timeout" : "Payment initialization failed",
      },
      { status: 500 }
    );
  }
}

// Avoid importing crypto just for instanceof check
function eName(e: unknown): string {
  return e instanceof Error ? e.name : "";
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