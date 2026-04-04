import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyStaff } from "@/lib/staff-auth";

// GET /api/staff/submissions?orderId=xxx — Get submissions for an order
export async function GET(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff();
  if (!authenticated || !user) return error;

  const orderId = request.nextUrl.searchParams.get("orderId");
  const supabase = await createAdminClient();

  let query = supabase
    .from("worker_submissions")
    .select("*, staff_users:worker_id(id, name)")
    .order("submitted_at", { ascending: false });

  if (orderId) {
    query = query.eq("order_id", orderId);
  }

  // Workers only see their own submissions
  if (user.role === "worker") {
    query = query.eq("worker_id", user.id);
  }

  const { data, error: dbError } = await query.limit(50);
  if (dbError) {
    return NextResponse.json({ error: "Gagal memuat submissions" }, { status: 500 });
  }

  return NextResponse.json({ submissions: data || [] });
}

// POST /api/staff/submissions — Submit work result (worker only)
export async function POST(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff(["worker"]);
  if (!authenticated || !user) return error;

  const body = await request.json();
  const {
    orderId,
    starsGained,
    mvpCount,
    savageCount,
    maniacCount,
    matchesPlayed,
    winCount,
    durationMinutes,
    screenshots,
    notes,
  } = body;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID wajib" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Verify worker is assigned to this order
  const { data: assignment } = await supabase
    .from("order_assignments")
    .select("id")
    .eq("order_id", orderId)
    .eq("assigned_to", user.id)
    .in("status", ["assigned", "in_progress"])
    .single();

  if (!assignment) {
    return NextResponse.json({ error: "Order tidak ditugaskan ke kamu" }, { status: 403 });
  }

  const { data: submission, error: insertError } = await supabase
    .from("worker_submissions")
    .insert({
      order_id: orderId,
      worker_id: user.id,
      stars_gained: starsGained || 0,
      mvp_count: mvpCount || 0,
      savage_count: savageCount || 0,
      maniac_count: maniacCount || 0,
      matches_played: matchesPlayed || 0,
      win_count: winCount || 0,
      duration_minutes: durationMinutes || 0,
      screenshots: screenshots || [],
      notes,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Submission error:", insertError);
    return NextResponse.json({ error: "Gagal submit hasil" }, { status: 500 });
  }

  // Update order progress
  const totalStars = starsGained || 0;
  if (totalStars > 0) {
    const { data: order } = await supabase.from("orders").select("progress").eq("id", orderId).single();
    const newProgress = Math.min(100, (order?.progress || 0) + totalStars * 5); // Rough estimate
    await supabase.from("orders").update({ progress: newProgress, updated_at: new Date().toISOString() }).eq("id", orderId);
  }

  return NextResponse.json({ success: true, submission }, { status: 201 });
}
