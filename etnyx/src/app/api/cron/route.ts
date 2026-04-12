import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendWhatsAppMessage, waDisclaimer, getNotificationPreferences } from "@/lib/notifications";

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

  return NextResponse.json({ ok: true, results });
}
