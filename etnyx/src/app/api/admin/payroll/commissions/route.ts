import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

// GET - List commissions with filters
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("worker_id");
    const status = searchParams.get("status");
    const periodStart = searchParams.get("period_start");
    const periodEnd = searchParams.get("period_end");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    const supabase = await createAdminClient();

    let query = supabase
      .from("commissions")
      .select("*, staff_users(name, email)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (workerId) query = query.eq("worker_id", workerId);
    if (status) query = query.eq("status", status);
    if (periodStart) query = query.gte("period_start", periodStart);
    if (periodEnd) query = query.lte("period_end", periodEnd);

    const { data, count, error } = await query;
    if (error) throw error;

    // Aggregate stats
    const totalAmount = (data || []).reduce((s, c) => s + (c.total_amount || 0), 0);
    const pendingAmount = (data || []).filter(c => c.status === "pending").reduce((s, c) => s + (c.total_amount || 0), 0);

    return NextResponse.json({
      commissions: data || [],
      stats: { totalAmount, pendingAmount },
      pagination: { page, limit, total: count || 0 },
    });
  } catch (error) {
    console.error("Commissions fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
