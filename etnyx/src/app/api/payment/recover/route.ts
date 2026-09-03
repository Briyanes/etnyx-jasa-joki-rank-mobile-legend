import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import {
  getDuitkuConfig,
  createDuitkuCheckout,
  getDuitkuTransactionStatus,
} from "@/lib/payments/duitku";
import { notifyOrderPaid } from "@/lib/payments/confirm-paid";

// ============================================
// Duitku Payment Recovery Endpoint
// Reconstructs/refreshes a payment link for an existing order.
// Handles cases where:
//   1. Checkout was created but URL wasn't captured (duitku_error rows)
//   2. User lost the payment page link
//   3. Original link expired and needs regeneration
//
// Recovery strategy (much simpler than old DompetX flow):
//   A. Cached payment_url still valid → return as-is
//   B. Gateway is Duitku & merchantOrderId exists → query transactionStatus:
//      if still pending, return same paymentUrl; if expired, create new invoice
//   C. Legacy/no data → create a fresh Duitku invoice
// ============================================

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://etnyx.com");

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID wajib diisi" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_id, total_price, status, payment_token, payment_url, midtrans_order_id, payment_type, gateway_provider, username, whatsapp, customer_email, current_rank, target_rank, current_star, target_star, package, package_title, is_express, is_premium, notes"
      )
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Order sudah ${order.status === "paid" || order.status === "completed" ? "dibayar/selesai" : order.status}` },
        { status: 400 }
      );
    }

    const config = await getDuitkuConfig(supabase);
    if (!config.merchantCode || !config.apiKey) {
      return NextResponse.json(
        { error: "Duitku belum dikonfigurasi. Silakan transfer manual." },
        { status: 500 }
      );
    }

    // ===== CASE A: order already has a Duitku payment URL =====
    // Verify it's still alive via transactionStatus before returning.
    if (order.payment_url && order.gateway_provider === "duitku" && order.midtrans_order_id) {
      try {
        const status = await getDuitkuTransactionStatus(config, order.midtrans_order_id);
        if (status && status.statusCode === "01") {
          // 01 = pending — invoice still open, return cached URL
          return NextResponse.json({
            success: true,
            redirect_url: order.payment_url,
            transaction_id: order.payment_token || "",
            source: "cached",
          });
        }
        // Invoice paid/expired/failed — fall through to regeneration,
        // but first check if it was actually PAID (missed callback).
        if (status && status.statusCode === "00") {
          // Defense-in-depth: verify amount matches DB before confirming
          // (status.amount is a STRING from Duitku)
          if (Number(status.amount) !== order.total_price) {
            console.error(
              `[Recovery] Amount mismatch for ${order.order_id}: gateway=${status.amount}, db=${order.total_price} — NOT confirming`
            );
            return NextResponse.json(
              { error: "Nominal tidak cocok. Hubungi CS dengan bukti pembayaran." },
              { status: 409 }
            );
          }

          // Payment succeeded but callback was missed → confirm order now.
          // Atomic guard: only flip while still pending (callback/cron may race).
          const { data: updated } = await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              status: "confirmed",
              paid_at: new Date().toISOString(),
              confirmed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id)
            .eq("status", "pending")
            .select("id")
            .single();

          if (updated) {
            // Fire the same notification suite as the webhook path (audit
            // finding: recovery used to confirm silently)
            await notifyOrderPaid(supabase, order);
          }

          return NextResponse.json({
            success: true,
            already_paid: true,
            message: "Pembayaran sudah diterima. Order Anda dikonfirmasi.",
          });
        }
      } catch (e) {
        console.warn("[Recovery] transactionStatus check failed, regenerating:", e);
      }
    }

    // ===== CASE B/C: regenerate a fresh Duitku invoice =====
    const merchantOrderId = `ETN-${order.order_id}-${Date.now()}`;
    try {
      const checkout = await createDuitkuCheckout(config, {
        amount: order.total_price,
        merchantOrderId,
        productDetails: `Joki ML: ${order.package_title || order.order_id}`,
        email: order.customer_email || `customer+${order.order_id}@etnyx.com`,
        returnUrl: `${SITE_URL}/payment/success?order_id=${order.order_id}`,
        callbackUrl: `${SITE_URL}/api/payment/callback`,
        expiryDuration: 1440, // 24h
        itemDetails: [
          { name: order.package_title || `Joki ML ${order.order_id}`, qty: 1, price: order.total_price },
        ],
      });

      await supabase
        .from("orders")
        .update({
          payment_token: checkout.reference,
          payment_url: checkout.paymentUrl,
          midtrans_order_id: merchantOrderId,
          payment_type: "duitku_checkout_recovery",
          gateway_provider: "duitku",
        })
        .eq("id", order.id);

      return NextResponse.json({
        success: true,
        redirect_url: checkout.paymentUrl,
        transaction_id: checkout.reference,
        source: "regenerated",
      });
    } catch (e) {
      const isTimeout = e instanceof Error && e.name === "AbortError";
      console.error("[Recovery] Duitku checkout error:", isTimeout ? "(timeout)" : "", e);
      return NextResponse.json(
        {
          error: isTimeout
            ? "Koneksi ke Duitku timeout. Silakan coba lagi."
            : "Gagal membuat link pembayaran baru. Silakan transfer manual.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("[Recovery] Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses. Silakan coba lagi atau transfer manual." },
      { status: 500 }
    );
  }
}
