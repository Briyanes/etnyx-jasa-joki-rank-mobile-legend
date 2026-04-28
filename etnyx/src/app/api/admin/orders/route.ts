import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { sanitizeInput, isValidRank } from "@/lib/validation";
import { sendNewOrderNotifications, sendOrderConfirmedNotifications, sendOrderCompletedNotifications, sendOrderStartedNotifications, sendOrderCancelledNotifications, sendTelegramMessage } from "@/lib/notifications";
import { logAdminAction } from "@/lib/audit-log";

export async function GET(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
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

    if (search) {
      const sanitized = search.replace(/[^a-zA-Z0-9\s\-_@+.]/g, "");
      if (sanitized) {
        query = query.or(`order_id.ilike.%${sanitized}%,username.ilike.%${sanitized}%,whatsapp.ilike.%${sanitized}%,game_id.ilike.%${sanitized}%`);
      }
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
    const orderId = `ETX-${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    // Whitelist allowed insert fields to prevent mass assignment
    const ALLOWED_INSERT_FIELDS = [
      "username", "game_id", "whatsapp", "customer_email",
      "current_rank", "target_rank", "current_star", "target_star",
      "package", "package_title", "total_price", "status",
      "is_express", "is_premium", "notes", "hero_request",
      "login_method", "account_login", "account_password",
    ] as const;

    const insertData: Record<string, unknown> = { order_id: orderId };
    for (const field of ALLOWED_INSERT_FIELDS) {
      if (field in sanitizedBody) {
        insertData[field] = sanitizedBody[field];
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .insert(insertData)
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
  "assigned_worker_id",
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

    // Block worker assignment if payment not confirmed
    if (updates.assigned_worker_id && currentOrder?.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Pembayaran belum dikonfirmasi. Assign worker hanya bisa setelah pembayaran dikonfirmasi." },
        { status: 400 }
      );
    }

    // Verify worker exists and is active when assigning
    if (updates.assigned_worker_id && updates.assigned_worker_id !== currentOrder?.assigned_worker_id) {
      const { data: workerCheck } = await supabase
        .from("staff_users")
        .select("id, name, role, is_active")
        .eq("id", updates.assigned_worker_id as string)
        .eq("role", "worker")
        .eq("is_active", true)
        .single();

      if (!workerCheck) {
        return NextResponse.json(
          { error: "Worker tidak ditemukan atau tidak aktif" },
          { status: 404 }
        );
      }

      // Auto-set status to in_progress when assigning worker (if currently confirmed)
      if (previousStatus === "confirmed" && !updates.status) {
        updates.status = "in_progress";
      }
    }

    // Validate status transitions
    if (updates.status && updates.status !== previousStatus) {
      const validTransitions: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["in_progress", "cancelled"],
        in_progress: ["completed", "cancelled", "confirmed"],
        completed: ["in_progress"], // Reopen
        cancelled: ["pending"], // Restore
      };
      const allowed = validTransitions[previousStatus || ""] || [];
      if (!allowed.includes(updates.status as string)) {
        return NextResponse.json(
          { error: `Tidak bisa mengubah status dari ${previousStatus} ke ${updates.status}` },
          { status: 400 }
        );
      }
    }

    // Auto-set timestamps on status transitions
    if (updates.status === "confirmed" && previousStatus !== "confirmed") {
      updates.confirmed_at = new Date().toISOString();
      // Only set payment_status if not already paid (idempotency — prevents double notifications from proof approval + status change)
      if (currentOrder?.payment_status !== "paid") {
        updates.payment_status = "paid";
        if (!updates.paid_at) updates.paid_at = new Date().toISOString();
      }
    }
    if (updates.status === "completed" && previousStatus !== "completed") {
      updates.completed_at = new Date().toISOString();
      updates.progress = 100;
    }
    updates.updated_at = new Date().toISOString();

    const updateQuery = supabase
      .from("orders")
      .update(updates)
      .eq("id", id);

    // Atomic guard: only update if status hasn't changed since we read it
    if (previousStatus) {
      updateQuery.eq("status", previousStatus);
    }

    const { data, error } = await updateQuery.select().single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Order sudah diubah oleh admin lain. Silakan refresh." }, { status: 409 });
    }

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

    // Handle worker assignment: create order_assignments record + Telegram notification
    if (updates.assigned_worker_id && updates.assigned_worker_id !== currentOrder?.assigned_worker_id) {
      const { data: worker } = await supabase
        .from("staff_users")
        .select("name")
        .eq("id", updates.assigned_worker_id as string)
        .single();

      // Create order_assignments record (so worker can see it in their dashboard)
      // First check if there's already an active assignment
      const { data: existingAssignment } = await supabase
        .from("order_assignments")
        .select("id")
        .eq("order_id", id)
        .in("status", ["assigned", "in_progress"])
        .single();

      if (existingAssignment) {
        // Update existing assignment to the new worker
        await supabase
          .from("order_assignments")
          .update({
            assigned_to: updates.assigned_worker_id as string,
            assigned_by: auth.user!.email,
            status: "assigned",
            assigned_at: new Date().toISOString(),
          })
          .eq("id", existingAssignment.id);
      } else {
        // Create new assignment
        await supabase.from("order_assignments").insert({
          order_id: id,
          assigned_to: updates.assigned_worker_id as string,
          assigned_by: auth.user!.email,
          status: "assigned",
        });
      }

      // Log to order_logs
      await supabase.from("order_logs").insert({
        order_id: id,
        action: "assigned",
        new_value: `Assigned to ${worker?.name || "Unknown"}`,
        notes: `Assigned by admin (${auth.user!.email})`,
        created_by: auth.user!.email,
      });

      // Notify worker via Telegram
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "integrations")
          .single();
        const integrations = settings?.value || {};
        if (integrations.telegramBotToken && integrations.telegramWorkerGroupId) {
          const msg = `📢 <b>ORDER BARU DITUGASKAN</b>\n\nWorker: <b>${worker?.name || "Unknown"}</b>\nOrder: <b>${data.order_id}</b>\n\nSegera kerjakan!`;
          await sendTelegramMessage(integrations.telegramWorkerGroupId, msg, integrations.telegramBotToken);
        }
      } catch (e) {
        console.error(`[assign] Telegram notification failed for ${data.order_id}:`, e);
      }
    }

    // Send notifications based on status change
    let notificationSent = false;
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
        try {
          await sendOrderConfirmedNotifications(orderData);
          notificationSent = true;
        } catch (e) { console.error(`[confirmed] Notification failed for ${data.order_id}:`, e); }
      }

      // Status: in_progress -> WA "Sedang Dikerjakan" + Telegram Admin & Worker
      if (updates.status === "in_progress") {
        try {
          await sendOrderStartedNotifications(orderData);
          notificationSent = true;
        } catch (e) { console.error(`[in_progress] Notification failed for ${data.order_id}:`, e); }
      }

      // Status: cancelled -> WA "Order Dibatalkan" + Telegram Worker
      if (updates.status === "cancelled") {
        try {
          await sendOrderCancelledNotifications(orderData);
          notificationSent = true;
        } catch (e) { console.error(`[cancelled] Notification failed for ${data.order_id}:`, e); }
      }
      
      // Status: completed -> notify customer + award reward points
      if (updates.status === "completed") {
        try {
          await sendOrderCompletedNotifications(orderData);
          notificationSent = true;
        } catch (err) { console.error(`[completed] Notification failed for ${data.order_id}:`, err); }

        // Award reward points to linked customer (idempotent check)
        try {
          if (data.whatsapp) {
            const { data: customer } = await supabase
              .from("customers")
              .select("id")
              .eq("whatsapp", data.whatsapp)
              .single();

            if (customer) {
              // Check if points already awarded for this order
              const { data: existingReward } = await supabase
                .from("reward_transactions")
                .select("id")
                .eq("order_id", data.id)
                .eq("type", "earn")
                .single();

              if (!existingReward) {
                await supabase.rpc("award_reward_points", {
                  p_customer_id: customer.id,
                  p_order_id: data.id,
                  p_order_amount: data.total_price,
                  p_description: "Poin dari order selesai",
                });
              }
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

    const hasStatusChange = updates.status && updates.status !== previousStatus;
    return NextResponse.json({ ...data, _notificationSent: hasStatusChange ? notificationSent : undefined });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data: order } = await supabase
      .from("orders")
      .select("order_id, status")
      .eq("id", id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Hard  cascade will clean up related rows (logs, assignments, etc.)delete 
    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) throw error;

    logAdminAction({
      admin_email: auth.user!.email,
      action: "delete",
      resource_type: "order",
      resource_id: order.order_id,
      details: `Deleted order ${order.order_id} (status: ${order.status})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order delete error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
