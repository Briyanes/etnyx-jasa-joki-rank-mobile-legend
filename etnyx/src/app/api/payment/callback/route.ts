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
import { getDuitkuConfig, verifyDuitkuCallback } from "@/lib/payments/duitku";
import { notifyOrderPaid } from "@/lib/payments/confirm-paid";

// ============================================
// Duitku Callback Handler (Webhook)
// ============================================
// Unlike DompetX, Duitku signs every callback:
//   signature = md5(merchantCode + amount + merchantOrderId + apiKey)
// Verification is single-layer & cryptographic — the old 3-layer
// workaround (secret header + API re-fetch + amount check) is retired.
// We STILL cross-check the amount against our DB as defense-in-depth.
//
// Duitku callback payload:
// {
//   "merchantCode": "D0001",
//   "amount": "150000",            // string!
//   "merchantOrderId": "ETN-...",
//   "resultCode": "00",            // "00" = success
//   "paymentCode": "VC",           // payment method used
//   "reference": "D0001xxxx",
//   "signature": "md5hex"
// }
//
// Register in Duitku Dashboard:
//   Callback URL: https://etnyx.com/api/payment/callback
// ============================================

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "duitku-payment-callback" });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    const merchantCode = String(body.merchantCode || "");
    const merchantOrderId = String(body.merchantOrderId || "");
    const amount = Number(body.amount || 0); // Duitku sends amount as string
    const resultCode = String(body.resultCode || "");
    const paymentCode = String(body.paymentCode || "");
    const reference = String(body.reference || "");
    const signature = String(body.signature || "");

    if (!merchantOrderId || !signature) {
      console.error("[Duitku Callback] Missing merchantOrderId or signature");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const config = await getDuitkuConfig(supabase);

    // ===== SECURITY: Cryptographic signature verification =====
    const validSignature = verifyDuitkuCallback(config, {
      merchantCode,
      merchantOrderId,
      amount,
      signature,
    });

    if (!validSignature) {
      console.error(
        `[Duitku Callback] INVALID SIGNATURE for order ref=${merchantOrderId}. ` +
          `Possible forgery attempt — rejecting.`
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Find order by merchantOrderId (stored in midtrans_order_id column)
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("midtrans_order_id", merchantOrderId)
      .single();

    if (error || !order) {
      console.error("[Duitku Callback] Order not found for ref:", merchantOrderId);
      // 200 to stop retries for unknown refs
      return NextResponse.json({ success: true, message: "Order not found" });
    }

    // Idempotency: skip if already paid (stale/duplicate callbacks)
    if (order.payment_status === "paid") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // ===== Defense-in-depth: amount cross-check against DB =====
    // resultCode "00" = payment success per Duitku docs
    let paymentStatus: string;
    let orderStatus: string = order.status;

    if (resultCode === "00") {
      if (amount === 0) {
        console.error(`[Duitku Callback] Amount missing for ${merchantOrderId}`);
        paymentStatus = "pending";
      } else if (amount < order.total_price) {
        console.error(
          `[Duitku Callback] Amount mismatch for ${merchantOrderId}: paid ${amount}, expected ${order.total_price}`
        );
        paymentStatus = "underpaid";
      } else {
        paymentStatus = "paid";
        orderStatus = "confirmed";
      }
    } else if (["01", "02"].includes(resultCode)) {
      // 01 = pending, 02 = processing (per Duitku docs)
      paymentStatus = "pending";
    } else {
      // other codes = failed/canceled/expired
      paymentStatus = "failed";
    }

    // Update order — ATOMIC: only when still unpaid/pending (guards against
    // duplicate/concurrent callbacks racing each other)
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        payment_type: `duitku_${paymentCode || "auto"}`,
        status: orderStatus,
        gateway_provider: "duitku",
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
        confirmed_at: paymentStatus === "paid" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .in("payment_status", ["unpaid", "pending", "underpaid", "failed", "expired"])
      .neq("status", "confirmed")
      .select("id")
      .single();

    if (updateError) {
      // PGRST116 = no row matched the guard → already processed by a
      // concurrent callback; treat as success (idempotent).
      if ((updateError as { code?: string }).code === "PGRST116") {
        return NextResponse.json({ success: true, message: "Already processed" });
      }
      console.error(
        `[Duitku Callback] DB UPDATE FAILED for ${order.order_id}:`,
        updateError.message
      );
      // Return 500 so Duitku retries the callback
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // Audit log every gateway callback (best-effort; table created in SQL v33)
    try {
      await supabase.from("payment_callbacks").insert({
        order_id: order.id,
        gateway_provider: "duitku",
        merchant_order_id: merchantOrderId,
        reference,
        result_code: resultCode,
        payment_code: paymentCode,
        amount,
        signature,
        raw_payload: body,
      });
    } catch {
      /* non-blocking: audit log must never break payment processing */
    }

    // Notify customer and admin for underpaid payments
    if (paymentStatus === "underpaid") {
      const missing = order.total_price - amount;
      const manualUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com"}/payment/manual/?order_id=${order.order_id}`;
      const underpaidMsg = `Halo kak!\n\nPembayaran untuk order *${order.order_id}* kurang.\n\n💰 *Jumlah dibayar:* Rp ${amount.toLocaleString("id-ID")}\n💰 *Yang seharusnya:* Rp ${order.total_price.toLocaleString("id-ID")}\n⚠️ *Kurang:* Rp ${missing.toLocaleString("id-ID")}\n\nMohon lunasi kekurangannya dan upload bukti transfer baru di:\n${manualUrl}\n\nAtau hubungi CS kami untuk bantuan.\n\n_ETNYX - Push Rank, Tanpa Main_`;
      const waNumber = order.whatsapp?.startsWith("+") ? order.whatsapp : `+62${order.whatsapp}`;
      Promise.allSettled([
        sendWhatsAppMessage(waNumber, underpaidMsg, manualUrl),
        (async () => {
          const { data: intSettings } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "integrations")
            .single();
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

    // Send notifications when payment is confirmed (shared helper also used
    // by recover & reconciliation cron — fixes silent-confirm audit finding)
    if (paymentStatus === "paid") {
      await notifyOrderPaid(supabase, order, {
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Duitku callback error:", error);
    // Return 200 for malformed payloads (prevents infinite retries),
    // real processing failures already returned 500 above.
    return NextResponse.json({ success: true, error: "processed" });
  }
}