import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

// GET /api/admin/reports — Financial reports & worker performance
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "pnl";
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const supabase = await createAdminClient();

    switch (type) {
      // ============ PROFIT & LOSS ============
      case "pnl": {
        const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
        const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

        // Revenue: completed orders in this month
        const { data: revenueData } = await supabase
          .from("orders")
          .select("total_price, base_price, is_express, is_premium, promo_discount")
          .eq("status", "completed")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonth);

        const orders = revenueData || [];
        const totalRevenue = orders.reduce((s, o) => s + (o.total_price || 0), 0);
        const totalBasePrice = orders.reduce((s, o) => s + (o.base_price || 0), 0);
        const totalExpressPremium = totalRevenue - totalBasePrice;
        const totalPromoDiscount = orders.reduce((s, o) => s + (o.promo_discount || 0), 0);

        // Commission paid this month
        const { data: commissionData } = await supabase
          .from("commissions")
          .select("commission_amount, bonus_amount, total_amount, status")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonth);

        const commissions = commissionData || [];
        const totalCommission = commissions.reduce((s, c) => s + (c.total_amount || 0), 0);
        const paidCommission = commissions.filter(c => c.status === "paid").reduce((s, c) => s + (c.total_amount || 0), 0);
        const pendingCommission = commissions.filter(c => c.status !== "paid" && c.status !== "cancelled").reduce((s, c) => s + (c.total_amount || 0), 0);

        // Salaries paid this month
        const { data: salaryData } = await supabase
          .from("salary_records")
          .select("base_salary, allowances_total, deductions, bonus_amount, total_amount, status")
          .eq("period_month", month)
          .eq("period_year", year);

        const salaries = salaryData || [];
        const totalSalary = salaries.reduce((s, r) => s + (r.total_amount || 0), 0);
        const paidSalary = salaries.filter(r => r.status === "paid").reduce((s, r) => s + (r.total_amount || 0), 0);

        // Payouts this month
        const { data: payoutData } = await supabase
          .from("payouts")
          .select("total_amount, status, type, payment_method_label")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonth);

        const payouts = payoutData || [];
        const totalPaidOut = payouts.filter(p => p.status === "paid").reduce((s, p) => s + (p.total_amount || 0), 0);

        const totalExpenses = totalCommission + totalSalary;
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

        // Previous month for comparison
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
        const { data: prevRevenueData } = await supabase
          .from("orders")
          .select("total_price")
          .eq("status", "completed")
          .gte("created_at", prevMonthStart)
          .lt("created_at", monthStart);
        const prevRevenue = (prevRevenueData || []).reduce((s, o) => s + (o.total_price || 0), 0);

        return NextResponse.json({
          report: {
            month, year,
            // Revenue breakdown
            totalRevenue,
            totalBasePrice,
            totalExpressPremium,
            totalPromoDiscount,
            completedOrders: orders.length,
            // Expenses breakdown
            totalCommission,
            paidCommission,
            pendingCommission,
            commissionCount: commissions.length,
            totalSalary,
            paidSalary,
            salaryCount: salaries.length,
            totalExpenses,
            totalPaidOut,
            payoutCount: payouts.length,
            // Profit
            netProfit,
            profitMargin: Math.round(profitMargin * 100) / 100,
            // Comparison
            prevMonthRevenue: prevRevenue,
            revenueGrowth: prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 10000) / 100 : 0,
          },
        });
      }

      // ============ P&L MONTHLY TREND (last 6 months) ============
      case "pnl_trend": {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          let m = month - i;
          let y = year;
          while (m <= 0) { m += 12; y--; }
          months.push({ month: m, year: y });
        }

        const trends = [];
        for (const period of months) {
          const mStart = `${period.year}-${String(period.month).padStart(2, "0")}-01`;
          const nMonth = period.month === 12 ? `${period.year + 1}-01-01` : `${period.year}-${String(period.month + 1).padStart(2, "0")}-01`;

          const [revRes, comRes, salRes] = await Promise.all([
            supabase.from("orders").select("total_price").eq("status", "completed").gte("created_at", mStart).lt("created_at", nMonth),
            supabase.from("commissions").select("total_amount").gte("created_at", mStart).lt("created_at", nMonth),
            supabase.from("salary_records").select("total_amount").eq("period_month", period.month).eq("period_year", period.year),
          ]);

          const revenue = (revRes.data || []).reduce((s, o) => s + (o.total_price || 0), 0);
          const commission = (comRes.data || []).reduce((s, c) => s + (c.total_amount || 0), 0);
          const salary = (salRes.data || []).reduce((s, r) => s + (r.total_amount || 0), 0);
          const expenses = commission + salary;

          trends.push({
            label: `${String(period.month).padStart(2, "0")}/${period.year}`,
            month: period.month,
            year: period.year,
            revenue,
            commission,
            salary,
            expenses,
            profit: revenue - expenses,
          });
        }

        return NextResponse.json({ trends });
      }

      // ============ WORKER PERFORMANCE ============
      case "workers": {
        const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
        const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

        // Get all workers
        const { data: workers } = await supabase
          .from("staff_users")
          .select("id, name, email, role")
          .eq("role", "worker")
          .eq("is_active", true);

        if (!workers || workers.length === 0) {
          return NextResponse.json({ workers: [] });
        }

        const workerStats = [];

        for (const worker of workers) {
          // Orders completed this month
          const { data: completedOrders } = await supabase
            .from("orders")
            .select("id, total_price, current_rank, target_rank")
            .eq("assigned_worker_id", worker.id)
            .eq("status", "completed")
            .gte("created_at", monthStart)
            .lt("created_at", nextMonth);

          // All orders assigned this month (for winrate calc)
          const { data: allOrders } = await supabase
            .from("orders")
            .select("id, status")
            .eq("assigned_worker_id", worker.id)
            .gte("created_at", monthStart)
            .lt("created_at", nextMonth);

          // All-time orders
          const { data: allTimeOrders } = await supabase
            .from("orders")
            .select("id, status")
            .eq("assigned_worker_id", worker.id);

          // Commissions this month
          const { data: comms } = await supabase
            .from("commissions")
            .select("total_amount, status")
            .eq("worker_id", worker.id)
            .gte("created_at", monthStart)
            .lt("created_at", nextMonth);

          // Reviews for this worker
          const { data: reviews } = await supabase
            .from("reviews")
            .select("worker_rating")
            .eq("worker_id", worker.id)
            .not("worker_rating", "is", null);

          const completed = completedOrders || [];
          const all = allOrders || [];
          const allTime = allTimeOrders || [];
          const commissions = comms || [];
          const workerReviews = reviews || [];

          const monthCompleted = completed.length;
          const monthTotal = all.length;
          const monthCancelled = all.filter(o => o.status === "cancelled").length;
          const monthWinrate = monthTotal > 0 ? ((monthCompleted / (monthTotal - monthCancelled || 1)) * 100) : 0;

          const allTimeCompleted = allTime.filter(o => o.status === "completed").length;
          const allTimeTotal = allTime.length;
          const allTimeCancelled = allTime.filter(o => o.status === "cancelled").length;
          const allTimeWinrate = allTimeTotal > 0 ? ((allTimeCompleted / (allTimeTotal - allTimeCancelled || 1)) * 100) : 0;

          const monthRevenue = completed.reduce((s, o) => s + (o.total_price || 0), 0);
          const monthEarnings = commissions.reduce((s, c) => s + (c.total_amount || 0), 0);
          const paidEarnings = commissions.filter(c => c.status === "paid").reduce((s, c) => s + (c.total_amount || 0), 0);

          const avgRating = workerReviews.length > 0
            ? workerReviews.reduce((s, r) => s + (r.worker_rating || 0), 0) / workerReviews.length
            : 0;

          workerStats.push({
            id: worker.id,
            name: worker.name,
            email: worker.email,
            // This month
            monthCompleted,
            monthTotal,
            monthWinrate: Math.round(monthWinrate * 10) / 10,
            monthRevenue,
            monthEarnings,
            paidEarnings,
            // All time
            allTimeCompleted,
            allTimeTotal,
            allTimeWinrate: Math.round(allTimeWinrate * 10) / 10,
            // Ratings
            avgRating: Math.round(avgRating * 10) / 10,
            totalReviews: workerReviews.length,
          });
        }

        // Sort by monthly earnings desc
        workerStats.sort((a, b) => b.monthEarnings - a.monthEarnings);

        return NextResponse.json({ workers: workerStats });
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
