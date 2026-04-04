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

// GET /api/staff/orders — Get orders based on role
export async function GET(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff();
  if (!authenticated || !user) return error;

  const supabase = await createAdminClient();
  const status = request.nextUrl.searchParams.get("status");

  if (user.role === "admin" || user.role === "lead") {
    // Admin & Lead see all orders
    let query = supabase
      .from("orders")
      .select("*, order_assignments(id, assigned_to, status, assigned_at, staff_users:assigned_to(id, name, role))")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error: dbError } = await query;
    if (dbError) {
      console.error("Fetch orders error:", dbError);
      return NextResponse.json({ error: "Gagal memuat orders" }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  }

  if (user.role === "worker") {
    // Worker only sees assigned orders
    const { data: assignments } = await supabase
      .from("order_assignments")
      .select("order_id")
      .eq("assigned_to", user.id)
      .in("status", ["assigned", "in_progress"]);

    const orderIds = (assignments || []).map((a) => a.order_id);
    if (orderIds.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("id", orderIds)
      .order("created_at", { ascending: false });

    return NextResponse.json({ orders: data || [] });
  }

  return NextResponse.json({ orders: [] });
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
    .select("id, name, role")
    .eq("id", workerId)
    .eq("role", "worker")
    .eq("is_active", true)
    .single();

  if (!worker) {
    return NextResponse.json({ error: "Worker tidak ditemukan atau tidak aktif" }, { status: 404 });
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

// PUT /api/staff/orders — Update order status (worker updates progress)
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

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (newStatus) updates.status = newStatus;
  if (progress !== undefined) updates.progress = progress;
  if (currentProgressRank) updates.current_progress_rank = currentProgressRank;

  await supabase.from("orders").update(updates).eq("id", orderId);

  // Update assignment status
  if (newStatus === "in_progress") {
    await supabase
      .from("order_assignments")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .eq("assigned_to", user.id);
  }
  if (newStatus === "completed") {
    await supabase
      .from("order_assignments")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .eq("assigned_to", user.id);

    await supabase.from("orders").update({ completed_at: new Date().toISOString() }).eq("id", orderId);
  }

  // Log
  await supabase.from("order_logs").insert({
    order_id: orderId,
    action: newStatus ? `status_${newStatus}` : "progress_update",
    new_value: newStatus || `${progress}%`,
    notes: notes || `Updated by ${user.name}`,
    created_by: user.name,
  });

  // Notify admin when worker completes
  if (newStatus === "completed") {
    const settings = await getSettings();
    if (settings.telegramBotToken && settings.telegramAdminGroupId) {
      const { data: order } = await supabase.from("orders").select("order_id, username").eq("id", orderId).single();
      const msg = `✅ <b>ORDER SELESAI!</b>\n\n🎫 Order: <b>${order?.order_id}</b>\n👤 Customer: ${order?.username}\n👷 Worker: ${user.name}\n\n🔍 Review di dashboard admin.`;
      await sendTelegramMessage(settings.telegramAdminGroupId, msg, settings.telegramBotToken);
    }
  }

  return NextResponse.json({ success: true });
}
