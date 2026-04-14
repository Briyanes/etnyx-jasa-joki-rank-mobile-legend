import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required.");
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id required" }, { status: 400 });
    }

    const sanitizedId = orderId.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();

    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecret());
    const supabase = await createAdminClient();

    // Get customer
    const { data: customer } = await supabase
      .from("customers")
      .select("id, whatsapp")
      .eq("id", payload.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get order
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_id, username, game_id, current_rank, target_rank, current_star, target_star, package, package_title, total_price, original_price, discount_amount, promo_code, status, progress, current_progress_rank, is_express, is_premium, login_method, hero_request, notes, payment_method, payment_status, paid_at, created_at, updated_at, sla_deadline, customer_id, whatsapp")
      .eq("order_id", sanitizedId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership
    const isOwner =
      order.customer_id === customer.id ||
      (customer.whatsapp && order.whatsapp === customer.whatsapp);

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get worker submissions
    const { data: submissions } = await supabase
      .from("worker_submissions")
      .select("id, stars_gained, mvp_count, savage_count, maniac_count, matches_played, win_count, duration_minutes, screenshots, submitted_at")
      .eq("order_id", order.id)
      .order("submitted_at", { ascending: false });

    // Get status logs for timeline
    const { data: logs } = await supabase
      .from("order_logs")
      .select("action, new_value, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    // Get assigned worker name (public info only)
    const { data: assignment } = await supabase
      .from("order_assignments")
      .select("staff_users(name)")
      .eq("order_id", order.id)
      .in("status", ["assigned", "in_progress"])
      .single();

    const workerName = assignment?.staff_users
      ? (assignment.staff_users as unknown as { name: string }).name
      : null;

    // Strip internal id
    const { id: _id, customer_id: _cid, whatsapp: _wa, ...safeOrder } = order;

    return NextResponse.json({
      ...safeOrder,
      worker_name: workerName,
      submissions: submissions || [],
      status_logs: logs || [],
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
