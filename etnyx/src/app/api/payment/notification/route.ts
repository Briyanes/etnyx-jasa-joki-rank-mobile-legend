import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import {
  sendPaymentConfirmedWA,
  notifyWorkerConfirmedOrder,
  notifyAdminPaymentConfirmed,
  sendPaymentConfirmedEmail,
  sendWhatsAppMessage,
  sendTelegramMessage,
} from "@/lib/notifications";
import { sendMetaCAPI } from "@/lib/meta-capi";
import crypto from "crypto";

// ============================================
// DompetX Webhook Handler (SECURITY HARDENED - K2)
// ============================================
// SECURITY FIX: Since DompetX does not send webhook signatures,
// we implement multi-layer verification to prevent fake webhook attacks:
//
// Layer 1: Webhook secret header (if DOMPETX_WEBHOOK_SECRET is configured)
// Layer 2: Server-side payment verification via DompetX API callback
//          (we re-fetch the payment status from DompetX to confirm)
// Layer 3: Amount + reference cross-check against our database
//
// Payload format (per official docs):
// {
//   "data": {
//     "id": "c2489739-...",
//     "amount": 500,
//     "status": "paid",
//     "currency": "IDR",
//     "reference": "order-100-2"
//   },
//   "eventType": "deposit",
//   "paymentId": "c2489739-..."
// }
// ============================================

const DOMPETX_API_KEY = process.env.DOMPETX_API_KEY || "";
const DOMPETX_BASE_URL = process.env.DOMPETX_BASE_URL || "https://api.dompetx.com/v1";
const WEBHOOK_SECRET = process.env.DOMPETX_WEBHOOK_SECRET || "";

/**
 * Verify payment by calling DompetX API back to confirm the transaction.
 * This prevents fake webhook attacks since the attacker would need to
 * also control the DompetX API response.
 */
async function verifyPaymentWithDompetX(
  trxId: string,
  reference: string
): Promise<{ verified: boolean; status?: string; amount?: number }> {
  if (!DOMPETX_API_KEY || !trxId) return { verified: false };

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({ reference, transactionId: trxId });
    const signature = crypto
      .createHmac("sha256", DOMPETX_API_KEY)
      .update(timestamp + body)
      .digest("hex");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let res: Response;
    try {
      res = await fetch(`${DOMPETX_BASE_URL}/payments/verify`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-DOMPAY-API-Key": DOMPETX_API_KEY,
          "X-DOMPAY-Signature": signature,
          "X-DOMPAY-Timestamp": timestamp,
        },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      console.error("[WEBHOOK VERIFY] DompetX verify API returned:", res.status);
      return { verified: false };
    }

    const data = await res.json();
    const paymentData = data.data || data;

    return {
      verified: true,
      status: String(paymentData.status || "").toLowerCase(),
      amount: Number(paymentData.amount || 0),
    };
  } catch (e) {
    console.error("[WEBHOOK VERIFY] Failed to verify payment with DompetX:", e);
    return { verified: false };
  }
}

// GET handler for URL verification (DompetX may ping this)
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "dompetx-payment-notification" });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // ===== SECURITY LAYER 1: Webhook secret (if configured) =====
    // If DOMPETX_WEBHOOK_SECRET is set, requests must include it.
    // This blocks random attackers from hitting the endpoint.
    if (WEBHOOK_SECRET) {
      const providedSecret =
        request.headers.get("x-webhook-secret") ||
        request.headers.get("x-dompetx-webhook-secret") ||
        body.webhookSecret;
      if (providedSecret !== WEBHOOK_SECRET) {
        console.error("[WEBHOOK] Unauthorized: missing or invalid webhook secret");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // DompetX official payload structure
    const dataObj = body.data || {};
    const refId: string = dataObj.reference || body.reference || "";
    const trxId: string = dataObj.id || body.paymentId || body.id || "";
    let dompetxStatus: string = String(dataObj.status || body.status || "").toLowerCase();
    let amount: number = Number(dataObj.amount || body.amount || 0);
    const eventType: string = body.eventType || "";

    if (!refId) {
      console.error("DompetX webhook: missing reference in payload");
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Find order by reference ID (stored in midtrans_order_id column)
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("midtrans_order_id", refId)
      .single();

    if (error || !order) {
      console.error("Order not found for DompetX ref:", refId);
      // Still return 200 to stop retries for unknown refs
      return NextResponse.json({ success: true, message: "Order not found" });
    }

    // Idempotency: skip if order already paid (prevent stale webhooks)
    if (order.payment_status === "paid") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // ===== SECURITY LAYER 2: Server-side payment verification =====
    // For "paid" status, verify with DompetX API that the payment is real.
    // This is the critical security layer against fake webhooks.
    if (
      dompetxStatus === "paid" ||
      dompetxStatus === "success" ||
      dompetxStatus === "settlement" ||
      dompetxStatus === "completed"
    ) {
      const verification = await verifyPaymentWithDompetX(trxId, refId);
      if (!verification.verified) {
        // If verification fails, log and refuse to mark as paid.
        // Fall back to manual confirmation by admin.
        console.error(
          `[WEBHOOK SECURITY] Payment verification FAILED for ref=${refId}, trxId=${trxId}. ` +
            `Webhook claimed status="${dompetxStatus}" but server-side verification could not confirm. ` +
            `Order remains pending — admin must verify manually.`
        );
        dompetxStatus = "pending"; // Downgrade to pending for safety
        amount = 0;
      } else {
        // Use verified data from DompetX API (not from the webhook body)
        if (verification.status) dompetxStatus = verification.status;
        if (verification.amount) amount = verification.amount;
      }
    }

    // ===== SECURITY LAYER 3: Amount + reference cross-check =====
    // Determine payment status
    // DompetX status values: "paid" (confirmed), others (pending/failed/expired)
    let paymentStatus = "pending";
    let orderStatus = order.status;

    if (dompetxStatus === "paid" || dompetxStatus === "success" || dompetxStatus === "settlement" || dompetxStatus === "completed") {
      // Verify payment amount
      if (amount === 0) {
        console.error(`Amount missing from DompetX webhook for ${refId}`);
        paymentStatus = "pending";
      } else if (amount < order.total_price) {
        console.error(`Amount mismatch for ${refId}: paid ${amount}, expected ${order.total_price}`);
        paymentStatus = "underpaid";
      } else {
        paymentStatus = "paid";
        orderStatus = "confirmed";
      }
    } else if (dompetxStatus === "pending" || dompetxStatus === "waiting") {
      paymentStatus = "pending";
    } else {
      // failed | expired | canceled
      paymentStatus = "failed";
    }

    // Update order
    await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        payment_type: `dompetx_${eventType || "deposit"}`,
        status: orderStatus,
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
        confirmed_at: paymentStatus === "paid" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // Notify customer and admin for underpaid payments
    if (paymentStatus === "underpaid") {
      const missing = order.total_price - amount;
      const manualUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com"}/payment/manual/?order_id=${order.order_id}`;
      const underpaidMsg = `Halo kak!\n\nPembayaran untuk order *${order.order_id}* kurang.\n\n💰 *Jumlah dibayar:* Rp ${amount.toLocaleString("id-ID")}\n💰 *Yang seharusnya:* Rp ${order.total_price.toLocaleString("id-ID")}\n⚠️ *Kurang:* Rp ${missing.toLocaleString("id-ID")}\n\nMohon lunasi kekurangannya dan upload bukti transfer baru di:\n${manualUrl}\n\nAtau hubungi CS kami untuk bantuan.\n\n_ETNYX - Push Rank, Tanpa Main_`;
      const waNumber = order.whatsapp?.startsWith("+") ? order.whatsapp : `+62${order.whatsapp}`;
      Promise.allSettled([
        sendWhatsAppMessage(waNumber, underpaidMsg, manualUrl),
        (async () => {
          const { data: intSettings } = await supabase.from("settings").select("value").eq("key", "integrations").single();
          const chatId = intSettings?.value?.telegramAdminGroupId;
          if (chatId) {
            const adminMsg = `⚠️ <b>PEMBAYARAN KURANG</b>\n\n<b>Order ID:</b> ${order.order_id}\n<b>Username:</b> ${order.username}\n<b>Dibayar:</b> Rp ${amount.toLocaleString("id-ID")}\n<b>Seharusnya:</b> Rp ${order.total_price.toLocaleString("id-ID")}\n<b>Kurang:</b> Rp ${missing.toLocaleString("id-ID")}`;
            await sendTelegramMessage(chatId, adminMsg);
          }
        })(),
      ]).catch(console.error);
    }

    // Notify customer when payment expires or fails
    if (paymentStatus === "failed") {
      const waNumber = order.whatsapp?.startsWith("+") ? order.whatsapp : `+62${order.whatsapp}`;
      const manualUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com"}/payment/manual/?order_id=${order.order_id}`;
      const failedMsg = `Halo kak!\n\nSayang sekali, pembayaran untuk order *${order.order_id}* gagal atau sudah kedaluwarsa.\n\nKamu masih bisa melanjutkan dengan transfer manual:\n${manualUrl}\n\nAtau hubungi CS kami untuk bantuan.\n\n_ETNYX - Push Rank, Tanpa Main_`;
      sendWhatsAppMessage(waNumber, failedMsg, manualUrl).catch(console.error);
    }

    // Send notifications when payment is confirmed
    if (paymentStatus === "paid" && order.status !== "confirmed") {
      const orderData = {
        order_id: order.order_id,
        username: order.username,
        current_rank: order.current_rank,
        target_rank: order.target_rank,
        current_star: order.current_star ?? null,
        target_star: order.target_star ?? null,
        package: order.package,
        package_title: order.package_title ?? null,
        price: order.total_price,
        whatsapp: order.whatsapp,
        email: order.customer_email,
        status: orderStatus,
        is_express: order.is_express,
        is_premium: order.is_premium,
        notes: order.notes,
        db_id: order.id,
      };

      // Send payment confirmed notifications (WA + Telegram worker + admin + email)
      Promise.allSettled([
        sendPaymentConfirmedWA(orderData),
        notifyWorkerConfirmedOrder(orderData),
        notifyAdminPaymentConfirmed(orderData),
        sendPaymentConfirmedEmail(orderData),
      ]).catch(console.error);

      // Fire Meta Conversions API (server-side dedup with client pixel)
      try {
        const { data: pixelSettings } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "tracking_pixels")
          .single();

        if (pixelSettings?.value) {
          sendMetaCAPI(
            {
              eventName: "Purchase",
              eventId: `purchase_${order.order_id}`,
              value: order.total_price || 0,
              currency: "IDR",
              email: order.customer_email,
              phone: order.whatsapp,
              orderId: order.order_id,
              ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
              userAgent: request.headers.get("user-agent") || undefined,
            },
            pixelSettings.value
          ).catch(console.error);
        }
      } catch {
        /* pixel settings not configured */
      }
    }

    // Always return 200 to acknowledge receipt (prevents retries)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment notification error:", error);
    // Return 200 even on error to prevent infinite retries from DompetX
    return NextResponse.json({ success: true, error: "processed" });
  }
}