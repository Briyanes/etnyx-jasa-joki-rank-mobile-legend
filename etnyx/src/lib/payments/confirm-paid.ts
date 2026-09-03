import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sendPaymentConfirmedWA,
  notifyWorkerConfirmedOrder,
  notifyAdminPaymentConfirmed,
  sendPaymentConfirmedEmail,
} from "@/lib/notifications";
import { sendMetaCAPI } from "@/lib/meta-capi";

// ============================================
// Shared "order just became PAID" notifications.
// Used by: /api/payment/callback (webhook),
//          /api/payment/recover (missed-callback path),
//          /api/cron (reconciliation).
// Fixes audit finding: recover & cron used to confirm orders
// silently — workers/admins never learned about new paid orders.
// ============================================

export async function notifyOrderPaid(
  supabase: SupabaseClient,
  order: Record<string, unknown>,
  opts?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const orderData = {
    order_id: order.order_id as string,
    username: order.username as string,
    current_rank: (order.current_rank as string) ?? "",
    target_rank: (order.target_rank as string) ?? "",
    current_star: (order.current_star as number) ?? null,
    target_star: (order.target_star as number) ?? null,
    package: (order.package as string) ?? "",
    package_title: (order.package_title as string) ?? null,
    price: order.total_price as number,
    whatsapp: (order.whatsapp as string) ?? "",
    email: (order.customer_email as string) ?? "",
    status: "confirmed",
    is_express: (order.is_express as boolean) ?? false,
    is_premium: (order.is_premium as boolean) ?? false,
    notes: (order.notes as string) ?? null,
    db_id: order.id as string,
  };

  await Promise.allSettled([
    sendPaymentConfirmedWA(orderData),
    notifyWorkerConfirmedOrder(orderData),
    notifyAdminPaymentConfirmed(orderData),
    sendPaymentConfirmedEmail(orderData),
  ]).catch(console.error);

  // Fire Meta Conversions API (server-side; dedup with client pixel via eventId)
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
          value: (order.total_price as number) || 0,
          currency: "IDR",
          email: order.customer_email as string | undefined,
          phone: order.whatsapp as string | undefined,
          orderId: order.order_id as string,
          ipAddress: opts?.ipAddress,
          userAgent: opts?.userAgent,
        },
        pixelSettings.value
      ).catch(console.error);
    }
  } catch {
    /* pixel settings not configured */
  }
}