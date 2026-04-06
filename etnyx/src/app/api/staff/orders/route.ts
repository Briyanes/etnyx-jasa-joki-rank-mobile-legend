import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyStaff } from "@/lib/staff-auth";
import { sendTelegramMessage } from "@/lib/notifications";

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
  const { data: order } = await supabase.from("orders").select("order_id").eq("id", orderId).single();
  await supabase.from("order_logs").insert({
    order_id: orderId,
    action: "assigned",
    new_value: `Assigned to ${worker.name}`,
    notes: notes || `Assigned by ${user.name}`,
    created_by: user.name,
  });

  // Notify worker via Telegram (if worker has Telegram)
  const settings = await getSettings();
  if (settings.telegramBotToken && settings.telegramWorkerGroupId) {
    const msg = `📋 <b>ORDER BARU DITUGASKAN</b>\n\n👷 Worker: <b>${worker.name}</b>\n🎫 Order: <b>${order?.order_id || orderId}</b>\n📝 Notes: ${notes || "-"}\n\n⚡ Segera kerjakan!`;
    await sendTelegramMessage(settings.telegramWorkerGroupId, msg, settings.telegramBotToken);
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
  }

  // Lead can update status for assigned orders but not pricing/admin stuff
  if (user.role === "lead") {
    const allowedStatuses = ["confirmed", "in_progress", "completed", "cancelled"];
    if (newStatus && !allowedStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "Lead tidak bisa set status ini" }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (newStatus) updates.status = newStatus;
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

  await supabase.from("orders").update(updates).eq("id", orderId);

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
          await supabase.rpc("award_reward_points", {
            p_customer_id: customer.id,
            p_order_id: orderId,
            p_order_amount: completedOrder.total_price,
            p_description: "Poin dari order selesai",
          });
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

  // Notify admin when worker completes
  if (newStatus === "completed" && user.role === "worker") {
    const settings = await getSettings();
    if (settings.telegramBotToken && settings.telegramAdminGroupId) {
      const { data: order } = await supabase.from("orders").select("order_id, username").eq("id", orderId).single();
      const msg = `✅ <b>ORDER SELESAI!</b>\n\n🎫 Order: <b>${order?.order_id}</b>\n👤 Customer: ${order?.username}\n👷 Worker: ${user.name}\n\n🔍 Review di dashboard admin.`;
      await sendTelegramMessage(settings.telegramAdminGroupId, msg, settings.telegramBotToken);
    }
  }

  return NextResponse.json({ success: true });
}
