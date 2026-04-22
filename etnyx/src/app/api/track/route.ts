import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// Simple in-memory rate limit: max 10 req/min per IP
const trackRateLimit = new Map<string, number[]>();
function checkTrackRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const max = 10;
  const hits = (trackRateLimit.get(ip) || []).filter(t => now - t < window);
  if (hits.length >= max) return false;
  hits.push(now);
  trackRateLimit.set(ip, hits);
  return true;
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkTrackRateLimit(ip)) {
    return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("id");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID diperlukan" }, { status: 400 });
  }

  // Sanitize input
  const sanitizedId = orderId.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_id, current_rank, target_rank, current_star, target_star, package, package_title, status, progress, current_progress_rank, is_express, is_premium, created_at, updated_at")
      .eq("order_id", sanitizedId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    // Fetch worker submissions for this order (public: no credentials/notes/worker_id)
    const { data: submissions } = await supabase
      .from("worker_submissions")
      .select("id, stars_gained, mvp_count, savage_count, maniac_count, matches_played, win_count, duration_minutes, screenshots, submitted_at")
      .eq("order_id", data.id)
      .order("submitted_at", { ascending: false });

    // Fetch order logs for timeline timestamps (public: only status changes)
    const { data: logs } = await supabase
      .from("order_logs")
      .select("action, new_value, created_at")
      .eq("order_id", data.id)
      .in("action", ["status_change", "status_confirmed", "status_in_progress", "status_completed", "status_cancelled", "payment_confirmed", "created", "assigned"])
      .order("created_at", { ascending: true });

    // Strip internal id from response, also strip username for privacy
    const { id: _id, ...orderData } = data;

    return NextResponse.json({ ...orderData, submissions: submissions || [], status_logs: logs || [] });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data order" }, { status: 500 });
  }
}
