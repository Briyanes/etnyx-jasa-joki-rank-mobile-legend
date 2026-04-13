import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// SLA durations in hours based on package type
const SLA_HOURS: Record<string, number> = {
  express: 24,
  premium: 48,
  default: 72,
};

// POST - Check SLA deadlines and send reminders
// Can be called by Vercel Cron or manually by admin
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or admin auth
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      // Check admin auth as fallback
      const { verifyAdmin } = await import("@/lib/admin-auth");
      const admin = await verifyAdmin();
      if (!admin.authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const supabase = await createAdminClient();
    const now = new Date();

    // 1. Set SLA deadlines for orders that don't have one yet
    const { data: ordersWithoutSla } = await supabase
      .from("orders")
      .select("id, is_express, is_premium, created_at")
      .in("status", ["confirmed", "in_progress"])
      .is("sla_deadline", null);

    if (ordersWithoutSla && ordersWithoutSla.length > 0) {
      for (const order of ordersWithoutSla) {
        const hours = order.is_express
          ? SLA_HOURS.express
          : order.is_premium
            ? SLA_HOURS.premium
            : SLA_HOURS.default;

        const deadline = new Date(order.created_at);
        deadline.setHours(deadline.getHours() + hours);

        await supabase
          .from("orders")
          .update({ sla_deadline: deadline.toISOString() })
          .eq("id", order.id);
      }
    }

    // 2. Find overdue orders that haven't been reminded
    const { data: overdueOrders } = await supabase
      .from("orders")
      .select("id, order_id, username, current_rank, target_rank, sla_deadline, is_express, whatsapp")
      .in("status", ["confirmed", "in_progress"])
      .eq("sla_reminded", false)
      .lt("sla_deadline", now.toISOString());

    const reminders: string[] = [];

    if (overdueOrders && overdueOrders.length > 0) {
      // Import notification service
      let sendTelegram: ((chatId: string, message: string) => Promise<boolean>) | null = null;
      let integrationSettings: { telegramAdminGroupId?: string; telegramWorkerGroupId?: string; telegramAlertGroupId?: string } = {};
      try {
        const notifModule = await import("@/lib/notifications");
        sendTelegram = notifModule.sendTelegramMessage;
        // Get group IDs from settings
        const { data: settingsData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "integrations")
          .single();
        integrationSettings = settingsData?.value || {};
      } catch {
        // notifications module may not be available
      }

      for (const order of overdueOrders) {
        // Mark as reminded
        await supabase
          .from("orders")
          .update({ sla_reminded: true })
          .eq("id", order.id);

        const message = `⚠️ <b>SLA Alert!</b>\n\nOrder <b>${order.order_id}</b> sudah melewati deadline.\nUsername: ${order.username}\nRank: ${order.current_rank} → ${order.target_rank}\nDeadline: ${new Date(order.sla_deadline!).toLocaleString("id-ID")}\n\nSegera selesaikan!`;

        // Send Telegram notification to alert/admin & worker group
        if (sendTelegram) {
          try {
            const alertChatId = integrationSettings.telegramAlertGroupId || integrationSettings.telegramAdminGroupId;
            if (alertChatId) {
              await sendTelegram(alertChatId, message);
            }
            if (integrationSettings.telegramWorkerGroupId) {
              await sendTelegram(integrationSettings.telegramWorkerGroupId, message);
            }
          } catch {
            // Continue even if notification fails
          }
        }

        reminders.push(order.order_id);
      }
    }

    return NextResponse.json({
      success: true,
      sla_set: ordersWithoutSla?.length || 0,
      reminders_sent: reminders.length,
      reminded_orders: reminders,
      checked_at: now.toISOString(),
    });
  } catch (err) {
    console.error("SLA check error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET - View SLA status of active orders (admin only)
export async function GET() {
  try {
    const { verifyAdmin } = await import("@/lib/admin-auth");
    const admin = await verifyAdmin();
    if (!admin.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const now = new Date();

    const { data: orders } = await supabase
      .from("orders")
      .select("order_id, username, current_rank, target_rank, status, is_express, is_premium, sla_deadline, sla_reminded, created_at")
      .in("status", ["confirmed", "in_progress"])
      .order("sla_deadline", { ascending: true });

    const result = (orders || []).map((o) => ({
      ...o,
      is_overdue: o.sla_deadline ? new Date(o.sla_deadline) < now : false,
      hours_remaining: o.sla_deadline
        ? Math.round((new Date(o.sla_deadline).getTime() - now.getTime()) / (1000 * 60 * 60) * 10) / 10
        : null,
    }));

    return NextResponse.json({ orders: result });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
