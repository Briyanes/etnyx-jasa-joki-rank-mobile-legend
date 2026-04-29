import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyStaff } from "@/lib/staff-auth";
import { sendTelegramMessage, sendOrderCompletedWA, sendOrderStartedWA } from "@/lib/notifications";

// Helper to get integration settings
async function getSettings() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase.from("settings").select("value").eq("key", "integrations").single();
    return data?.value || {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) { return {}; }
}

// GET /api/staff/orders — Get orders based on role (with search, pagination)
export async function GET(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff();
  if (!authenticated || !user) return error;

  const supabase = await createAdminClient();
  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("search");
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;
  const includeCompleted = request.nextUrl.searchParams.get("includeCompleted") === "true";

  if (user.role === "admin" || user.role === "lead") {
    // Admin & Lead see all orders
    let query = supabase
      .from("orders")
      .select("*, order_assignments(id, assigned_to, status, assigned_at, notes, staff_users:assigned_to(id, name, role))", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      const sanitized = search.replace(/[^a-zA-Z0-9\s\-_@+.]/g, "");
      if (sanitized) {
        query = query.or(`order_id.ilike.%${sanitized}%,username.ilike.%${sanitized}%,game_id.ilike.%${sanitized}%,whatsapp.ilike.%${sanitized}%`);
      }
    }

    const { data, error: dbError, count } = await query;
    if (dbError) {
      console.error("Fetch orders error:", dbError);
      return NextResponse.json({ error: "Gagal memuat orders" }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [], total: count || 0, page, limit });
  }

  if (user.role === "worker") {
    // Worker sees assigned orders (active + optionally completed)
    const statusFilter = includeCompleted 
      ? ["assigned", "in_progress", "completed"]
      : ["assigned", "in_progress"];
    
    const { data: assignments } = await supabase
      .from("order_assignments")
      .select("order_id")
      .eq("assigned_to", user.id)
      .in("status", statusFilter);

    const orderIds = (assignments || []).map((a) => a.order_id);
    if (orderIds.length === 0) {
      return NextResponse.json({ orders: [], total: 0, page, limit });
    }

    const { data, count } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .in("id", orderIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({ orders: data || [], total: count || 0, page, limit });
  }

  return NextResponse.json({ orders: [], total: 0, page, limit });
}

// POST /api/staff/orders — Assign order to worker (admin/lead only)
export async function POST(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff(["admin", "lead"]);
  if (!authenticated || !user) return error;

  const { orderId, workerId, notes } = await request.json();

  if (!orderId || !workerId) {
    return NextResponse.json({ error: "Order ID dan Worker ID wajib" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Verify order exists and payment is confirmed before allowing assignment
  const { data: orderCheck } = await supabase
    .from("orders")
    .select("id, payment_status, status")
    .eq("id", orderId)
    .single();

  if (!orderCheck) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  if (orderCheck.payment_status !== "paid") {
    return NextResponse.json({ error: "Pembayaran belum dikonfirmasi. Assign worker hanya bisa setelah pembayaran dikonfirmasi." }, { status: 400 });
  }

  // Lead can only assign orders in 'in_progress' (admin already clicked "Mulai Kerjakan")
  // Admin can assign from 'confirmed' or 'in_progress'
  if (user.role === "lead") {
    if (orderCheck.status !== "in_progress") {
      return NextResponse.json({ error: "Order belum bisa di-assign. Admin harus klik 'Mulai Kerjakan' terlebih dahulu." }, { status: 400 });
    }
  } else {
    if (orderCheck.status !== "confirmed" && orderCheck.status !== "in_progress") {
      return NextResponse.json({ error: `Order status '${orderCheck.status}' tidak bisa di-assign. Order harus dalam status 'confirmed' terlebih dahulu.` }, { status: 400 });
    }
  }

  // Verify worker exists and is active
  const { data: worker } = await supabase
    .from("staff_users")
    .select("id, name, role, lead_id")
    .eq("id", workerId)
    .eq("role", "worker")
    .eq("is_active", true)
    .single();

  if (!worker) {
    return NextResponse.json({ error: "Worker tidak ditemukan atau tidak aktif" }, { status: 404 });
  }

  // Lead can only assign to their own team workers
  if (user.role === "lead" && worker.lead_id !== user.id) {
    return NextResponse.json({ error: "Worker bukan anggota tim kamu" }, { status: 403 });
  }

  // Create assignment
  const { error: assignError } = await supabase.from("order_assignments").insert({
    order_id: orderId,
    assigned_to: workerId,
    assigned_by: user.id,
    status: "assigned",
    notes,
  });

  if (assignError) {
    console.error("Assignment error:", assignError);
    return NextResponse.json({ error: "Gagal assign order" }, { status: 500 });
  }

  // Update order
  const updateData: Record<string, unknown> = {
    assigned_worker_id: workerId,
    status: "in_progress",
    updated_at: new Date().toISOString(),
  };
  if (user.role === "lead") {
    updateData.assigned_lead_id = user.id;
  }

  await supabase.from("orders").update(updateData).eq("id", orderId);

  // Log
  const { data: order } = await supabase.from("orders").select("order_id, username, current_rank, target_rank, current_star, target_star, package, package_title, total_price, whatsapp, customer_email, is_express, is_premium, notes").eq("id", orderId).single();
  await supabase.from("order_logs").insert({
    order_id: orderId,
    action: "assigned",
    new_value: `Assigned to ${worker.name}`,
    notes: notes || `Assigned by ${user.name}`,
    created_by: user.name,
  });

  // WA Follow Up 3: Notify customer that order is being worked on
  if (order?.whatsapp) {
    sendOrderStartedWA({
      order_id: order.order_id, username: order.username, current_rank: order.current_rank,
      target_rank: order.target_rank, current_star: order.current_star, target_star: order.target_star,
      package: order.package, package_title: order.package_title, price: order.total_price,
      whatsapp: order.whatsapp, email: order.customer_email, status: "in_progress",
    }).catch(console.error);
  }

  // Notify worker + admin via Telegram
  const settings = await getSettings();
  if (settings.telegramBotToken) {
    const msg = `📢 <b>ORDER BARU DITUGASKAN</b>\n\nWorker: <b>${worker.name}</b>\nAssigned by: <b>${user.name}</b>\nOrder: <b>${order?.order_id || orderId}</b>\nNotes: ${notes || "-"}\n\nSegera kerjakan!`;
    const promises: Promise<boolean>[] = [];
    if (settings.telegramWorkerGroupId) {
      promises.push(sendTelegramMessage(settings.telegramWorkerGroupId, msg, settings.telegramBotToken));
    }
    if (settings.telegramAdminGroupId) {
      promises.push(sendTelegramMessage(settings.telegramAdminGroupId, msg, settings.telegramBotToken));
    }
    await Promise.allSettled(promises);
  }

  return NextResponse.json({ success: true });
}

// PUT /api/staff/orders — Update order status (role-based)
export async function PUT(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff();
  if (!authenticated || !user) return error;

  const { orderId, status: newStatus, progress, currentProgressRank, notes } = await request.json();

  if (!orderId) {
    return NextResponse.json({ error: "Order ID wajib" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Workers can only update their assigned orders
  if (user.role === "worker") {
    const { data: assignment } = await supabase
      .from("order_assignments")
      .select("id")
      .eq("order_id", orderId)
      .eq("assigned_to", user.id)
      .in("status", ["assigned", "in_progress"])
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Order tidak ditemukan atau bukan milik kamu" }, { status: 403 });
    }

    // Workers can set in_progress & completed status
    const workerAllowed = ["in_progress", "completed"];
    if (newStatus && !workerAllowed.includes(newStatus)) {
      return NextResponse.json({ error: "Worker tidak bisa set status ini" }, { status: 403 });
    }
  }

  // Lead can update status for assigned orders but not pricing/admin stuff
  if (user.role === "lead") {
    const allowedStatuses = ["confirmed", "in_progress", "completed", "cancelled"];
    if (newStatus && !allowedStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "Lead tidak bisa set status ini" }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let currentStatus: string | undefined;
  if (newStatus) {
    // Validate status transitions
    const { data: currentOrder } = await supabase.from("orders").select("status").eq("id", orderId).single();
    currentStatus = currentOrder?.status;
    if (currentOrder && newStatus !== currentOrder.status) {
      const validTransitions: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["in_progress", "cancelled"],
        in_progress: ["completed", "cancelled", "confirmed"],
        completed: ["in_progress"],
        cancelled: ["pending"],
      };
      const allowed = validTransitions[currentOrder.status] || [];
      if (!allowed.includes(newStatus)) {
        return NextResponse.json({ error: `Tidak bisa mengubah status dari ${currentOrder.status} ke ${newStatus}` }, { status: 400 });
      }
    }
    updates.status = newStatus;
  }
  if (progress !== undefined) updates.progress = Math.min(100, Math.max(0, progress));
  if (currentProgressRank) updates.current_progress_rank = currentProgressRank;

  // Reopen order: admin/lead can revert completed back to in_progress
  if (newStatus === "in_progress") {
    const { data: currentOrder } = await supabase.from("orders").select("status, progress").eq("id", orderId).single();
    if (currentOrder?.status === "completed") {
      // Reopen - clear completion
      updates.completed_at = null;
      updates.progress = progress ?? currentOrder.progress ?? 0;
      // Reactivate assignment
      await supabase
        .from("order_assignments")
        .update({ status: "in_progress", completed_at: null })
        .eq("order_id", orderId)
        .eq("status", "completed");
    }
  }

  // Atomic guard: only update if status hasn't changed since we read it
  const updateQuery = supabase.from("orders").update(updates).eq("id", orderId);
  if (currentStatus) {
    updateQuery.eq("status", currentStatus);
  }
  const { data: updatedOrder, error: updateError } = await updateQuery.select("id").maybeSingle();
  if (updateError) {
    return NextResponse.json({ error: "Gagal update order" }, { status: 500 });
  }
  if (!updatedOrder) {
    return NextResponse.json({ error: "Order sudah diubah oleh user lain. Silakan refresh." }, { status: 409 });
  }

  // Update assignment status
  if (newStatus === "in_progress" && user.role === "worker") {
    await supabase
      .from("order_assignments")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .eq("assigned_to", user.id);
  }
  if (newStatus === "completed") {
    if (user.role === "worker") {
      await supabase
        .from("order_assignments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("order_id", orderId)
        .eq("assigned_to", user.id);
    } else {
      // Admin/Lead completing - mark the latest active assignment
      await supabase
        .from("order_assignments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("order_id", orderId)
        .in("status", ["assigned", "in_progress"]);
    }
    await supabase.from("orders").update({ completed_at: new Date().toISOString() }).eq("id", orderId);

    // Award reward points to customer (if linked)
    try {
      const { data: completedOrder } = await supabase
        .from("orders")
        .select("whatsapp, total_price")
        .eq("id", orderId)
        .single();

      if (completedOrder?.whatsapp) {
        const { data: customer } = await supabase
          .from("customers")
          .select("id")
          .eq("whatsapp", completedOrder.whatsapp)
          .single();

        if (customer) {
          // Check if points already awarded for this order
          const { data: existingReward } = await supabase
            .from("reward_transactions")
            .select("id")
            .eq("order_id", orderId)
            .eq("type", "earn")
            .single();

          if (!existingReward) {
            await supabase.rpc("award_reward_points", {
              p_customer_id: customer.id,
              p_order_id: orderId,
              p_order_amount: completedOrder.total_price,
              p_description: "Poin dari order selesai",
            });
          }
        }
      }

      // Award referrer bonus points if this order used a referral
      if (completedOrder) {
        const { data: referral } = await supabase
          .from("referrals")
          .select("id, referrer_id, reward_given")
          .eq("referred_order_id", orderId)
          .eq("reward_given", false)
          .single();

        if (referral) {
          await supabase.rpc("award_reward_points", {
            p_customer_id: referral.referrer_id,
            p_order_id: orderId,
            p_order_amount: completedOrder.total_price,
            p_description: "Bonus referral - teman kamu menyelesaikan order",
          });
          await supabase.from("referrals").update({ reward_given: true }).eq("id", referral.id);
        }
      }
    } catch {
      // Non-blocking: reward point failure should not fail order completion
    }
  }

  // Log
  await supabase.from("order_logs").insert({
    order_id: orderId,
    action: newStatus ? `status_${newStatus}` : "progress_update",
    new_value: newStatus || `${progress}%`,
    notes: notes || `Updated by ${user.name} (${user.role})`,
    created_by: user.name,
  });

  // === Notifications on status change ===
  if (newStatus === "in_progress") {
    // WA "Sedang Dikerjakan" dikirim saat Lead assign ke worker (POST route), bukan di sini
    // Telegram only (worker click mulai or admin/lead reopen)
    const settings = await getSettings();
    if (settings.telegramBotToken) {
      const { data: order } = await supabase.from("orders").select("order_id, username").eq("id", orderId).single();
      const msg = `📢 <b>ORDER DIKERJAKAN!</b>\n\nOrder: <b>${order?.order_id}</b>\nCustomer: ${order?.username}\nWorker: ${user.name}\n\nSedang dalam pengerjaan.`;
      if (settings.telegramAdminGroupId) {
        await sendTelegramMessage(settings.telegramAdminGroupId, msg, settings.telegramBotToken);
      }
      if (settings.telegramWorkerGroupId) {
        await sendTelegramMessage(settings.telegramWorkerGroupId, msg, settings.telegramBotToken);
      }
    }
  }

  if (newStatus === "completed") {
    // WA "Order Selesai" hanya dikirim oleh Lead/Admin, bukan Worker
    // Worker selesai → Telegram only
    try {
      const { data: order } = await supabase.from("orders")
        .select("order_id, username, current_rank, target_rank, current_star, target_star, package, package_title, total_price, whatsapp, customer_email, assigned_worker_id, is_express, is_premium, notes")
        .eq("id", orderId).single();
      if (order && user.role !== "worker") {
        sendOrderCompletedWA({
          order_id: order.order_id, username: order.username, current_rank: order.current_rank,
          target_rank: order.target_rank, current_star: order.current_star, target_star: order.target_star,
          package: order.package, package_title: order.package_title, price: order.total_price,
          whatsapp: order.whatsapp, email: order.customer_email, status: "completed",
        }).catch(console.error);

        // Auto-generate commission for assigned worker
        if (order.assigned_worker_id) {
          try {
            const { data: payrollSettings } = await supabase
              .from("payroll_settings").select("value").eq("key", "commission").single();
            const commissionRate = payrollSettings?.value?.worker_rate ?? 0.60;
            const commissionAmount = Math.round(order.total_price * commissionRate);
            const day = new Date().getDate();
            const now = new Date();
            const periodStart = day <= 15
              ? new Date(now.getFullYear(), now.getMonth(), 1)
              : new Date(now.getFullYear(), now.getMonth(), 16);
            const periodEnd = day <= 15
              ? new Date(now.getFullYear(), now.getMonth(), 15)
              : new Date(now.getFullYear(), now.getMonth() + 1, 0);
            await supabase.from("commissions").upsert({
              order_id: orderId, order_code: order.order_id,
              worker_id: order.assigned_worker_id, order_total: order.total_price,
              commission_rate: commissionRate, commission_amount: commissionAmount,
              bonus_amount: 0, total_amount: commissionAmount, status: "pending",
              period_start: periodStart.toISOString().split("T")[0],
              period_end: periodEnd.toISOString().split("T")[0],
            }, { onConflict: "order_id,worker_id" });
          } catch { /* non-blocking */ }
        }
      }
    } catch { /* non-blocking */ }

    // Telegram to admin + worker group
    const settings = await getSettings();
    if (settings.telegramBotToken) {
      const { data: order } = await supabase.from("orders").select("order_id, username").eq("id", orderId).single();
      const msg = `🏆 <b>ORDER SELESAI!</b>\n\nOrder: <b>${order?.order_id}</b>\nCustomer: ${order?.username}\nWorker: ${user.name}\n\n✅ Order telah selesai dikerjakan.`;
      if (settings.telegramAdminGroupId) {
        await sendTelegramMessage(settings.telegramAdminGroupId, msg, settings.telegramBotToken);
      }
      if (settings.telegramWorkerGroupId) {
        await sendTelegramMessage(settings.telegramWorkerGroupId, msg, settings.telegramBotToken);
      }
    }
  }

  return NextResponse.json({ success: true });
}
