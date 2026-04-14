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

// POST /api/staff/submissions — Submit work result (worker or lead)
export async function POST(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff(["worker", "lead"]);
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

  // Validate numeric fields
  const numericFields = { starsGained, mvpCount, savageCount, maniacCount, matchesPlayed, winCount, durationMinutes };
  for (const [key, val] of Object.entries(numericFields)) {
    if (val !== undefined && val !== null) {
      const num = Number(val);
      if (!Number.isFinite(num) || num < 0 || num > 999) {
        return NextResponse.json({ error: `${key} harus angka 0-999` }, { status: 400 });
      }
    }
  }

  const supabase = await createAdminClient();

  let workerId = user.id;

  if (user.role === "worker") {
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
  } else {
    // Lead: get the assigned worker for this order
    const { data: assignment } = await supabase
      .from("order_assignments")
      .select("assigned_to")
      .eq("order_id", orderId)
      .in("status", ["assigned", "in_progress"])
      .order("assigned_at", { ascending: false })
      .limit(1)
      .single();

    if (assignment) {
      workerId = assignment.assigned_to;
    }
    // If no assignment, workerId stays as lead's id (fallback)
  }

  const { data: submission, error: insertError } = await supabase
    .from("worker_submissions")
    .insert({
      order_id: orderId,
      worker_id: workerId,
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

  // TG notification for new submission
  try {
    const { data: orderInfo } = await supabase.from("orders").select("order_id").eq("id", orderId).single();
    const { data: workerInfo } = await supabase.from("staff_users").select("name").eq("id", workerId).single();
    const { sendTelegramMessage  } = await import("@/lib/notifications");
    const { data: settingsRow } = await supabase.from("settings").select("value").eq("key", "integrations").single();
    const integ = settingsRow?.value as Record<string, string> | null;
    if (integ?.telegramAdminGroupId) {
      const subMsg = `📋 <b>SUBMISSION BARU</b>\n\nOrder: <b>${orderInfo?.order_id || orderId}</b>\nWorker: <b>${workerInfo?.name || "Unknown"}</b>\nSubmitted by: <b>${user.name}</b>\n\n⭐ Stars: ${starsGained || 0}\n🎮 Matches: ${matchesPlayed || 0} (Win: ${winCount || 0})\n🏆 MVP: ${mvpCount || 0}\n📸 Screenshots: ${(screenshots || []).length}`;
      await sendTelegramMessage(integ.telegramAdminGroupId, subMsg);
    }
  } catch { /* non-blocking */ }

  return NextResponse.json({ success: true, submission }, { status: 201 });
}

// PUT /api/staff/submissions — Edit a submission (worker within 30 min, or lead)
export async function PUT(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff(["worker", "lead"]);
  if (!authenticated || !user) return error;

  const body = await request.json();
  const { id, starsGained, mvpCount, savageCount, maniacCount, matchesPlayed, winCount, durationMinutes, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Submission ID wajib" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Verify submission exists
  const subQuery = supabase
    .from("worker_submissions")
    .select("id, worker_id, submitted_at, stars_gained, order_id")
    .eq("id", id);

  // Workers can only edit their own submissions
  if (user.role === "worker") {
    subQuery.eq("worker_id", user.id);
  }

  const { data: sub } = await subQuery.single();

  if (!sub) {
    return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
  }

  // Workers have 30-min time limit; leads can edit anytime
  if (user.role === "worker") {
    const minutesSinceSubmit = (Date.now() - new Date(sub.submitted_at).getTime()) / (1000 * 60);
    if (minutesSinceSubmit > 30) {
      return NextResponse.json({ error: "Submission hanya bisa diedit dalam 30 menit setelah submit" }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (starsGained !== undefined) updates.stars_gained = starsGained;
  if (mvpCount !== undefined) updates.mvp_count = mvpCount;
  if (savageCount !== undefined) updates.savage_count = savageCount;
  if (maniacCount !== undefined) updates.maniac_count = maniacCount;
  if (matchesPlayed !== undefined) updates.matches_played = matchesPlayed;
  if (winCount !== undefined) updates.win_count = winCount;
  if (durationMinutes !== undefined) updates.duration_minutes = durationMinutes;
  if (notes !== undefined) updates.notes = notes;

  const { error: updateError } = await supabase
    .from("worker_submissions")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Gagal update submission" }, { status: 500 });
  }

  // Recalculate order progress if stars changed
  if (starsGained !== undefined && starsGained !== sub.stars_gained) {
    const { data: allSubs } = await supabase
      .from("worker_submissions")
      .select("stars_gained")
      .eq("order_id", sub.order_id);
    const totalStars = (allSubs || []).reduce((sum, s) => sum + (s.stars_gained || 0), 0);
    const newProgress = Math.min(100, totalStars * 5);
    await supabase.from("orders").update({ progress: newProgress, updated_at: new Date().toISOString() }).eq("id", sub.order_id);
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/staff/submissions — Delete a submission (worker within 30 min, lead, or admin)
export async function DELETE(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff(["worker", "lead", "admin"]);
  if (!authenticated || !user) return error;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Submission ID wajib" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  const { data: sub } = await supabase
    .from("worker_submissions")
    .select("id, worker_id, submitted_at, stars_gained, order_id")
    .eq("id", id)
    .single();

  if (!sub) {
    return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
  }

  // Workers can only delete their own within 30 min; leads can delete anytime
  if (user.role === "worker") {
    if (sub.worker_id !== user.id) {
      return NextResponse.json({ error: "Bukan submission kamu" }, { status: 403 });
    }
    const minutesSinceSubmit = (Date.now() - new Date(sub.submitted_at).getTime()) / (1000 * 60);
    if (minutesSinceSubmit > 30) {
      return NextResponse.json({ error: "Submission hanya bisa dihapus dalam 30 menit" }, { status: 403 });
    }
  }

  const { error: deleteError } = await supabase
    .from("worker_submissions")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: "Gagal hapus submission" }, { status: 500 });
  }

  // Recalculate order progress
  const { data: allSubs } = await supabase
    .from("worker_submissions")
    .select("stars_gained")
    .eq("order_id", sub.order_id);
  const totalStars = (allSubs || []).reduce((sum, s) => sum + (s.stars_gained || 0), 0);
  const newProgress = Math.min(100, totalStars * 5);
  await supabase.from("orders").update({ progress: newProgress, updated_at: new Date().toISOString() }).eq("id", sub.order_id);

  return NextResponse.json({ success: true });
}
