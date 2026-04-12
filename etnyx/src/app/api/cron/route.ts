import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendWhatsAppMessage, sendOrderCancelledWA, sendTelegramMessage, waDisclaimer, getNotificationPreferences } from "@/lib/notifications";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const results: Record<string, unknown> = {};

  // 1. Payment reminder: orders pending > 24h without payment
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("order_id, username, whatsapp, total_price, created_at")
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .is("payment_reminder_sent", null);

    let sent = 0;
    for (const order of pendingOrders || []) {
      if (!order.whatsapp) continue;

      const payLink = `${SITE_URL}/payment/manual/?order_id=${order.order_id}`;
      const message = `
*Reminder Pembayaran*

Halo! Order kamu belum dibayar nih.

*Order ID:* ${order.order_id}
*Username:* ${order.username}
*Total:* Rp ${(order.total_price || 0).toLocaleString("id-ID")}

Segera selesaikan pembayaran sebelum order otomatis dibatalkan:
${payLink}

_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}
`.trim();

      const ok = await sendWhatsAppMessage(order.whatsapp, message, payLink);
      if (ok) {
        await supabase
          .from("orders")
          .update({ payment_reminder_sent: new Date().toISOString() })
          .eq("order_id", order.order_id);
        sent++;
      }
    }
    results.paymentReminders = { total: pendingOrders?.length || 0, sent };
  } catch (error) {
    console.error("Payment reminder cron error:", error);
    results.paymentReminders = { error: String(error) };
  }

  // 2. Review request: completed orders > 24h without a review
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: completedOrders } = await supabase
      .from("orders")
      .select("order_id, username, whatsapp, completed_at")
      .eq("status", "completed")
      .lt("completed_at", cutoff)
      .is("review_request_sent", null);

    let sent = 0;
    for (const order of completedOrders || []) {
      if (!order.whatsapp) continue;

      // Check if review already exists
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("order_id", order.order_id);

      if ((count || 0) > 0) {
        // Mark as sent so we don't re-check
        await supabase
          .from("orders")
          .update({ review_request_sent: new Date().toISOString() })
          .eq("order_id", order.order_id);
        continue;
      }

      // Respect notification preferences (review request = promotional)
      const prefs = await getNotificationPreferences(order.whatsapp);
      if (!prefs.whatsapp_promotions) {
        await supabase
          .from("orders")
          .update({ review_request_sent: new Date().toISOString() })
          .eq("order_id", order.order_id);
        continue;
      }

      const reviewLink = `${SITE_URL}/review/?id=${order.order_id}`;
      const message = `
*Minta Review Dong!*

Halo! Order kamu sudah selesai, gimana hasilnya?

*Order ID:* ${order.order_id}

Bantu kami dengan kasih review yuk, cuma 1 menit:
${reviewLink}

Review kamu sangat berarti buat kami!

_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}
`.trim();

      const ok = await sendWhatsAppMessage(order.whatsapp, message, reviewLink);
      if (ok) {
        await supabase
          .from("orders")
          .update({ review_request_sent: new Date().toISOString() })
          .eq("order_id", order.order_id);
        sent++;
      }
    }
    results.reviewRequests = { total: completedOrders?.length || 0, sent };
  } catch (error) {
    console.error("Review request cron error:", error);
    results.reviewRequests = { error: String(error) };
  }

  // 3. Auto-cancel pending orders > 72h without payment
  try {
    const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data: staleOrders } = await supabase
      .from("orders")
      .select("id, order_id, username, whatsapp, total_price, current_rank, target_rank, current_star, target_star, package, package_title, price:total_price, email, status")
      .eq("status", "pending")
      .lt("created_at", cutoff72h);

    let cancelled = 0;
    for (const order of staleOrders || []) {
      await supabase
        .from("orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", order.id);

      // Notify customer via WA
      if (order.whatsapp) {
        await sendOrderCancelledWA(order);
      }
      cancelled++;
    }
    results.autoCancelPending = { total: staleOrders?.length || 0, cancelled };
  } catch (error) {
    console.error("Auto-cancel pending cron error:", error);
    results.autoCancelPending = { error: String(error) };
  }

  // 4. Auto-expire promo codes past expiry date
  try {
    const now = new Date().toISOString();
    const { data: expiredPromos, count } = await supabase
      .from("promo_codes")
      .update({ is_active: false })
      .eq("is_active", true)
      .lt("expires_at", now)
      .select("code");

    results.expiredPromos = { disabled: expiredPromos?.length || count || 0 };
  } catch (error) {
    console.error("Auto-expire promos cron error:", error);
    results.expiredPromos = { error: String(error) };
  }

  // 5. Alert admin for stale in_progress orders > 14 days
  try {
    const cutoff14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: staleInProgress } = await supabase
      .from("orders")
      .select("order_id, username, assigned_worker_id, updated_at")
      .eq("status", "in_progress")
      .lt("updated_at", cutoff14d);

    if (staleInProgress && staleInProgress.length > 0) {
      const { data: settings } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "integrations")
        .single();

      const adminChatId = settings?.value?.telegramAdminGroupId;
      if (adminChatId) {
        const lines = staleInProgress.map(
          (o) => `• ${o.order_id} — ${o.username} (last update: ${new Date(o.updated_at).toLocaleDateString("id-ID")})`
        );
        const message = `⚠️ *STALE ORDERS ALERT*\n\n${staleInProgress.length} order in_progress lebih dari 14 hari tanpa update:\n\n${lines.join("\n")}\n\nCek & follow up segera!`;
        await sendTelegramMessage(adminChatId, message);
      }
    }
    results.staleInProgress = { count: staleInProgress?.length || 0 };
  } catch (error) {
    console.error("Stale in_progress cron error:", error);
    results.staleInProgress = { error: String(error) };
  }

  return NextResponse.json({ ok: true, results });
}
