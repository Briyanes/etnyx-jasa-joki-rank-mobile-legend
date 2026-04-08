import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();

    // Fetch all workers
    const { data: workers } = await supabase
      .from("staff_users")
      .select("id, name, email, role, is_active, created_at")
      .eq("role", "worker")
      .eq("is_active", true);

    if (!workers?.length) {
      return NextResponse.json({ leaderboard: [] });
    }

    const workerIds = workers.map((w) => w.id);

    // Parallel: assignments, submissions, reviews
    const [assignmentsRes, submissionsRes, reviewsRes] = await Promise.all([
      supabase
        .from("order_assignments")
        .select("assigned_to, status, completed_at")
        .in("assigned_to", workerIds),

      supabase
        .from("worker_submissions")
        .select("worker_id, stars_gained, mvp_count, savage_count, maniac_count, matches_played, win_count, duration_minutes")
        .in("worker_id", workerIds),

      supabase
        .from("testimonials")
        .select("booster_id, rating")
        .in("booster_id", workerIds),
    ]);

    // Aggregate per worker
    const leaderboard = workers.map((w) => {
      const assignments = assignmentsRes.data?.filter((a) => a.assigned_to === w.id) || [];
      const submissions = submissionsRes.data?.filter((s) => s.worker_id === w.id) || [];
      const reviews = reviewsRes.data?.filter((r) => r.booster_id === w.id) || [];

      const totalAssigned = assignments.length;
      const totalCompleted = assignments.filter((a) => a.status === "completed").length;
      const totalInProgress = assignments.filter((a) => a.status === "in_progress").length;

      const totalStars = submissions.reduce((s, sub) => s + (sub.stars_gained || 0), 0);
      const totalMVP = submissions.reduce((s, sub) => s + (sub.mvp_count || 0), 0);
      const totalSavage = submissions.reduce((s, sub) => s + (sub.savage_count || 0), 0);
      const totalManiac = submissions.reduce((s, sub) => s + (sub.maniac_count || 0), 0);
      const totalMatches = submissions.reduce((s, sub) => s + (sub.matches_played || 0), 0);
      const totalWins = submissions.reduce((s, sub) => s + (sub.win_count || 0), 0);
      const totalMinutes = submissions.reduce((s, sub) => s + (sub.duration_minutes || 0), 0);

      const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
      const avgRating = reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

      // Performance score: weighted combination
      const score =
        totalCompleted * 10 +
        winRate * 2 +
        avgRating * 15 +
        totalMVP * 3 +
        totalSavage * 10 +
        totalManiac * 5;

      return {
        id: w.id,
        name: w.name,
        email: w.email,
        totalAssigned,
        totalCompleted,
        totalInProgress,
        totalStars,
        totalMVP,
        totalSavage,
        totalManiac,
        totalMatches,
        totalWins,
        winRate,
        totalMinutes,
        avgRating,
        totalReviews: reviews.length,
        score,
      };
    });

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
