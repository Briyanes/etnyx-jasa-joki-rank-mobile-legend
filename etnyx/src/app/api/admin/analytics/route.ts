import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 90);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Parallel: revenue trend, package breakdown, top customers, customer growth
    const [revenueRes, packagesRes, topCustomersRes, customerGrowthRes, rankPairsRes] = await Promise.all([
      // 1. Daily revenue + orders (last N days)
      supabase
        .from("orders")
        .select("created_at, total_price, status")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true }),

      // 2. Revenue by package type
      supabase
        .from("orders")
        .select("package, total_price, status")
        .in("status", ["completed", "in_progress", "confirmed"]),

      // 3. Top customers by spending
      supabase
        .from("customers")
        .select("id, name, email, total_orders, total_spent, reward_tier")
        .order("total_spent", { ascending: false })
        .limit(10),

      // 4. Customer registrations over time
      supabase
        .from("customers")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true }),

      // 5. Popular rank combinations
      supabase
        .from("orders")
        .select("current_rank, target_rank, total_price")
        .in("status", ["completed", "in_progress", "confirmed"]),
    ]);

    // Process revenue trend
    const dailyData: Record<string, { orders: number; revenue: number; completed: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyData[key] = { orders: 0, revenue: 0, completed: 0 };
    }
    revenueRes.data?.forEach((o) => {
      const key = new Date(o.created_at).toISOString().split("T")[0];
      if (dailyData[key]) {
        dailyData[key].orders += 1;
        dailyData[key].revenue += o.total_price || 0;
        if (o.status === "completed") dailyData[key].completed += 1;
      }
    });
    const revenueTrend = Object.entries(dailyData).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      ...data,
    }));

    // Process package breakdown
    const packageBreakdown: Record<string, { count: number; revenue: number }> = {};
    packagesRes.data?.forEach((o) => {
      const pkg = o.package || "paket";
      if (!packageBreakdown[pkg]) packageBreakdown[pkg] = { count: 0, revenue: 0 };
      packageBreakdown[pkg].count += 1;
      packageBreakdown[pkg].revenue += o.total_price || 0;
    });
    const packageStats = Object.entries(packageBreakdown).map(([name, data]) => ({
      name: name === "paket" ? "Paket" : name === "perstar" ? "Per Star" : name === "gendong" ? "Gendong" : name,
      ...data,
    }));

    // Process customer growth
    const customerGrowth: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      customerGrowth[key] = 0;
    }
    customerGrowthRes.data?.forEach((c) => {
      const key = new Date(c.created_at).toISOString().split("T")[0];
      if (customerGrowth[key] !== undefined) customerGrowth[key] += 1;
    });
    const customerTrend = Object.entries(customerGrowth).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      newCustomers: count,
    }));

    // Process popular rank pairs
    const rankPairs: Record<string, { count: number; revenue: number }> = {};
    rankPairsRes.data?.forEach((o) => {
      const key = `${o.current_rank} → ${o.target_rank}`;
      if (!rankPairs[key]) rankPairs[key] = { count: 0, revenue: 0 };
      rankPairs[key].count += 1;
      rankPairs[key].revenue += o.total_price || 0;
    });
    const popularRanks = Object.entries(rankPairs)
      .map(([pair, data]) => ({ pair, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate summary metrics
    const totalRevenue = revenueRes.data?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
    const totalOrders = revenueRes.data?.length || 0;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const newCustomers = customerGrowthRes.data?.length || 0;

    return NextResponse.json({
      summary: { totalRevenue, totalOrders, avgOrderValue, newCustomers, days },
      revenueTrend,
      packageStats,
      topCustomers: topCustomersRes.data || [],
      customerTrend,
      popularRanks,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
