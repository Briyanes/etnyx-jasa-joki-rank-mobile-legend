import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { sanitizeInput, isValidRank } from "@/lib/validation";
import { sendNewOrderNotifications, sendOrderConfirmedNotifications, sendOrderCompletedNotifications, sendOrderStartedWA, sendOrderCancelledWA } from "@/lib/notifications";
import { logAdminAction } from "@/lib/audit-log";

export async function GET(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createAdminClient();

    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Orders query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data, total: count });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.username || !body.current_rank || !body.target_rank) {
      return NextResponse.json({ error: "Missing required fields: username, current_rank, target_rank" }, { status: 400 });
    }

    if (!isValidRank(body.current_rank) || !isValidRank(body.target_rank)) {
      return NextResponse.json({ error: "Invalid rank value" }, { status: 400 });
    }

    // Validate price if provided
    if (body.total_price !== undefined) {
      const price = Number(body.total_price);
      if (isNaN(price) || price < 0 || price > 100000000) {
        return NextResponse.json({ error: "Invalid price value" }, { status: 400 });
      }
    }

    // Validate username length
    if (body.username.length > 255) {
      return NextResponse.json({ error: "Username too long" }, { status: 400 });
    }

    // Sanitize string inputs
    const sanitizedBody = {
      ...body,
      username: sanitizeInput(body.username),
      game_id: body.game_id ? sanitizeInput(body.game_id) : undefined,
    };

    const supabase = await createAdminClient();

    // Generate order ID
    const orderId = `ETX-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        ...sanitizedBody,
      })
      .select()
      .single();

    if (error) throw error;

    logAdminAction({
      admin_email: auth.user!.email,
      action: "create",
      resource_type: "order",
      resource_id: data.order_id,
      details: `Created order ${data.order_id}`,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// Whitelist of fields admin is allowed to update
const ALLOWED_UPDATE_FIELDS = [
  "status",
  "progress",
  "current_progress_rank",
  "notes",
  "assigned_booster",
  "is_express",
  "is_premium",
] as const;

export async function PATCH(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    // Only pick allowed fields — prevents mass assignment
    const updates: Record<string, unknown> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Get current order state before update
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    const previousStatus = currentOrder?.status;

    // Auto-set timestamps on status transitions
    if (updates.status === "confirmed" && previousStatus !== "confirmed") {
      updates.confirmed_at = new Date().toISOString();
      updates.payment_status = "paid";
      if (!updates.paid_at) updates.paid_at = new Date().toISOString();
    }
    if (updates.status === "completed" && previousStatus !== "completed") {
      updates.completed_at = new Date().toISOString();
      updates.progress = 100;
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    logAdminAction({
      admin_email: auth.user!.email,
      action: "update",
      resource_type: "order",
      resource_id: data.order_id,
      details: `Updated order: ${Object.keys(updates).join(", ")}`,
      old_value: previousStatus ? JSON.stringify({ status: previousStatus }) : undefined,
      new_value: JSON.stringify(updates),
    });

    // Log status change to order_logs (for timeline tracking)
    if (updates.status && updates.status !== previousStatus) {
      await supabase.from("order_logs").insert({
        order_id: id,
        action: `status_${updates.status}`,
        new_value: updates.status as string,
        notes: `Status changed by admin (${auth.user!.email})`,
        created_by: auth.user!.email,
      });
    }

    // Log worker assignment to order_logs
    if (updates.assigned_worker_id && updates.assigned_worker_id !== currentOrder?.assigned_worker_id) {
      const { data: worker } = await supabase
        .from("staff_users")
        .select("name")
        .eq("id", updates.assigned_worker_id as string)
        .single();
      await supabase.from("order_logs").insert({
        order_id: id,
        action: "assigned",
        new_value: `Assigned to ${worker?.name || "Unknown"}`,
        notes: `Assigned by admin (${auth.user!.email})`,
        created_by: auth.user!.email,
      });
    }

    // Send notifications based on status change
    if (updates.status && updates.status !== previousStatus) {
      const orderData = {
        order_id: data.order_id,
        username: data.username,
        current_rank: data.current_rank,
        target_rank: data.target_rank,
        current_star: data.current_star,
        target_star: data.target_star,
        package: data.package,
        package_title: data.package_title,
        price: data.total_price,
        whatsapp: data.whatsapp,
        email: data.customer_email,
        status: data.status,
        is_express: data.is_express,
        is_premium: data.is_premium,
        notes: data.notes,
        db_id: data.id,
      };

      // Status: confirmed -> WA "Pembayaran Dikonfirmasi" + Telegram worker
      if (updates.status === "confirmed") {
        sendOrderConfirmedNotifications(orderData).catch(console.error);
      }

      // Status: in_progress -> WA "Sedang Dikerjakan"
      if (updates.status === "in_progress") {
        sendOrderStartedWA(orderData).catch(console.error);
      }

      // Status: cancelled -> WA "Order Dibatalkan"
      if (updates.status === "cancelled") {
        sendOrderCancelledWA(orderData).catch(console.error);
      }
      
      // Status: completed -> notify customer + award reward points
      if (updates.status === "completed") {
        sendOrderCompletedNotifications(orderData)
          .then(() => console.log(`[completed] Notifications sent for ${data.order_id}, WA: ${data.whatsapp}`))
          .catch((err) => console.error(`[completed] Notification failed for ${data.order_id}:`, err));

        // Award reward points to linked customer
        try {
          if (data.whatsapp) {
            const { data: customer } = await supabase
              .from("customers")
              .select("id")
              .eq("whatsapp", data.whatsapp)
              .single();

            if (customer) {
              await supabase.rpc("award_reward_points", {
                p_customer_id: customer.id,
                p_order_id: data.id,
                p_order_amount: data.total_price,
                p_description: "Poin dari order selesai",
              });
            }
          }

          // Award referrer bonus points if this order used a referral
          const { data: referral } = await supabase
            .from("referrals")
            .select("id, referrer_id, reward_given")
            .eq("referred_order_id", data.id)
            .eq("reward_given", false)
            .single();

          if (referral) {
            const referrerBonus = Math.max(1, Math.floor(data.total_price / 10000));
            await supabase.rpc("award_reward_points", {
              p_customer_id: referral.referrer_id,
              p_order_id: data.id,
              p_order_amount: data.total_price,
              p_description: "Bonus referral - teman kamu menyelesaikan order",
            });
            await supabase.from("referrals").update({ reward_given: true }).eq("id", referral.id);
          }

          // Auto-generate commission for assigned worker
          if (data.assigned_worker_id) {
            const { data: settings } = await supabase
              .from("payroll_settings")
              .select("value")
              .eq("key", "commission")
              .single();

            const commissionRate = settings?.value?.worker_rate ?? 0.60;
            const commissionAmount = Math.round(data.total_price * commissionRate);

            // Get current bi-weekly period
            const day = new Date().getDate();
            const now = new Date();
            const periodStart = day <= 15
              ? new Date(now.getFullYear(), now.getMonth(), 1)
              : new Date(now.getFullYear(), now.getMonth(), 16);
            const periodEnd = day <= 15
              ? new Date(now.getFullYear(), now.getMonth(), 15)
              : new Date(now.getFullYear(), now.getMonth() + 1, 0);

            await supabase.from("commissions").upsert({
              order_id: data.id,
              order_code: data.order_id,
              worker_id: data.assigned_worker_id,
              order_total: data.total_price,
              commission_rate: commissionRate,
              commission_amount: commissionAmount,
              bonus_amount: 0,
              total_amount: commissionAmount,
              status: "pending",
              period_start: periodStart.toISOString().split("T")[0],
              period_end: periodEnd.toISOString().split("T")[0],
            }, { onConflict: "order_id,worker_id" });
          }
        } catch {
          // Non-blocking
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
