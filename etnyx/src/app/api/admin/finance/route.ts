import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

// GET /api/admin/finance — Comprehensive financial data for owner
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const supabase = await createAdminClient();

    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonthDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    switch (type) {
      // ============ FULL OVERVIEW ============
      case "overview": {
        // 1. Revenue data (completed orders)
        const { data: completedOrders } = await supabase
          .from("orders")
          .select("id, total_price, base_price, is_express, is_premium, promo_discount, tier_discount, package, payment_method, created_at, completed_at")
          .eq("status", "completed")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthDate);

        const orders = completedOrders || [];
        const totalRevenue = orders.reduce((s, o) => s + (o.total_price || 0), 0);
        const totalBasePrice = orders.reduce((s, o) => s + (o.base_price || 0), 0);
        const totalPromoDiscount = orders.reduce((s, o) => s + (o.promo_discount || 0), 0);
        const totalTierDiscount = orders.reduce((s, o) => s + (o.tier_discount || 0), 0);

        // 2. All orders this month (all statuses)
        const { data: allOrders } = await supabase
          .from("orders")
          .select("id, status, total_price, payment_status, payment_method, created_at")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthDate);

        const allOrd = allOrders || [];
        const pendingOrders = allOrd.filter(o => o.status === "pending");
        const cancelledOrders = allOrd.filter(o => o.status === "cancelled");
        const inProgressOrders = allOrd.filter(o => o.status === "in_progress");
        const confirmedOrders = allOrd.filter(o => o.status === "confirmed");
        const pendingRevenue = [...pendingOrders, ...confirmedOrders, ...inProgressOrders]
          .reduce((s, o) => s + (o.total_price || 0), 0);

        // 3. Commissions (COGS — worker payout)
        const { data: commissionData } = await supabase
          .from("commissions")
          .select("commission_amount, bonus_amount, total_amount, status, worker_id, created_at")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthDate);

        const commissions = commissionData || [];
        const totalCommission = commissions.reduce((s, c) => s + (c.total_amount || 0), 0);
        const paidCommission = commissions.filter(c => c.status === "paid").reduce((s, c) => s + (c.total_amount || 0), 0);
        const pendingCommission = commissions.filter(c => c.status !== "paid" && c.status !== "cancelled").reduce((s, c) => s + (c.total_amount || 0), 0);

        // 4. Salaries (fixed cost)
        const { data: salaryData } = await supabase
          .from("salary_records")
          .select("base_salary, allowances_total, deductions, bonus_amount, total_amount, status, staff_id")
          .eq("period_month", month)
          .eq("period_year", year);

        const salaries = salaryData || [];
        const totalSalary = salaries.reduce((s, r) => s + (r.total_amount || 0), 0);
        const paidSalary = salaries.filter(r => r.status === "paid").reduce((s, r) => s + (r.total_amount || 0), 0);

        // 5. Payouts
        const { data: payoutData } = await supabase
          .from("payouts")
          .select("total_amount, status, type, paid_at, payment_method_label")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthDate);

        const payouts = payoutData || [];
        const totalPaidOut = payouts.filter(p => p.status === "paid").reduce((s, p) => s + (p.total_amount || 0), 0);

        // 6. Staff count
        const { data: staffData } = await supabase
          .from("staff_users")
          .select("id, role, is_active")
          .eq("is_active", true);

        const staff = staffData || [];
        const workerCount = staff.filter(s => s.role === "worker").length;
        const leadCount = staff.filter(s => s.role === "lead").length;
        const adminCount = staff.filter(s => s.role === "admin").length;

        // 7. Previous month comparison
        const prevM = month === 1 ? 12 : month - 1;
        const prevY = month === 1 ? year - 1 : year;
        const prevStart = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
        const { data: prevRevData } = await supabase
          .from("orders")
          .select("total_price")
          .eq("status", "completed")
          .gte("created_at", prevStart)
          .lt("created_at", monthStart);
        const prevRevenue = (prevRevData || []).reduce((s, o) => s + (o.total_price || 0), 0);

        const { data: prevComData } = await supabase
          .from("commissions")
          .select("total_amount")
          .gte("created_at", prevStart)
          .lt("created_at", monthStart);
        const prevCommission = (prevComData || []).reduce((s, c) => s + (c.total_amount || 0), 0);

        // Calculations
        const grossProfit = totalRevenue - totalCommission; // Revenue - COGS
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const totalExpenses = totalCommission + totalSalary;
        const netProfit = totalRevenue - totalExpenses;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const avgRevenuePerOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
        const avgCostPerOrder = orders.length > 0 ? totalCommission / orders.length : 0;
        const avgProfitPerOrder = orders.length > 0 ? grossProfit / orders.length : 0;
        const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

        // Contribution margin (revenue - variable costs only)
        const contributionMargin = totalRevenue > 0 ? ((totalRevenue - totalCommission) / totalRevenue) * 100 : 0;
        // Break-even = fixed costs / contribution margin ratio
        const breakEvenRevenue = contributionMargin > 0 ? (totalSalary / (contributionMargin / 100)) : 0;
        const breakEvenOrders = avgRevenuePerOrder > 0 ? Math.ceil(breakEvenRevenue / avgRevenuePerOrder) : 0;

        // Cash position
        const totalCashIn = totalRevenue; // Revenue collected
        const totalCashOut = totalPaidOut; // Actual paid out
        const netCashFlow = totalCashIn - totalCashOut;

        // Payment method breakdown
        const paymentMethods: Record<string, { count: number; amount: number }> = {};
        for (const o of orders) {
          const method = o.payment_method || "unknown";
          if (!paymentMethods[method]) paymentMethods[method] = { count: 0, amount: 0 };
          paymentMethods[method].count++;
          paymentMethods[method].amount += o.total_price || 0;
        }

        return NextResponse.json({
          overview: {
            month, year,
            // Revenue
            totalRevenue,
            totalBasePrice,
            totalPromoDiscount,
            totalTierDiscount,
            pendingRevenue,
            avgRevenuePerOrder: Math.round(avgRevenuePerOrder),
            completedOrders: orders.length,
            // Orders by status
            totalOrders: allOrd.length,
            ordersByStatus: {
              pending: pendingOrders.length,
              confirmed: confirmedOrders.length,
              in_progress: inProgressOrders.length,
              completed: orders.length,
              cancelled: cancelledOrders.length,
            },
            // COGS
            totalCommission,
            paidCommission,
            pendingCommission,
            avgCostPerOrder: Math.round(avgCostPerOrder),
            // Fixed costs
            totalSalary,
            paidSalary,
            // Profit
            grossProfit,
            grossMargin: Math.round(grossMargin * 100) / 100,
            netProfit,
            netMargin: Math.round(netMargin * 100) / 100,
            avgProfitPerOrder: Math.round(avgProfitPerOrder),
            totalExpenses,
            // Break-even
            contributionMargin: Math.round(contributionMargin * 100) / 100,
            breakEvenRevenue: Math.round(breakEvenRevenue),
            breakEvenOrders,
            // Cash flow
            totalCashIn,
            totalCashOut,
            netCashFlow,
            totalPaidOut,
            // Staff
            staff: { workers: workerCount, leads: leadCount, admins: adminCount, total: staff.length },
            // Comparison
            prevRevenue,
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            prevCommission,
            // Payment methods
            paymentMethods,
          },
        });
      }

      // ============ 12-MONTH TREND ============
      case "trend": {
        const trends = [];
        for (let i = 11; i >= 0; i--) {
          let m = month - i;
          let y = year;
          while (m <= 0) { m += 12; y--; }

          const mStart = `${y}-${String(m).padStart(2, "0")}-01`;
          const nM = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

          const [revRes, comRes, salRes] = await Promise.all([
            supabase.from("orders").select("total_price").eq("status", "completed").gte("created_at", mStart).lt("created_at", nM),
            supabase.from("commissions").select("total_amount").gte("created_at", mStart).lt("created_at", nM),
            supabase.from("salary_records").select("total_amount").eq("period_month", m).eq("period_year", y),
          ]);

          const revenue = (revRes.data || []).reduce((s, o) => s + (o.total_price || 0), 0);
          const commission = (comRes.data || []).reduce((s, c) => s + (c.total_amount || 0), 0);
          const salary = (salRes.data || []).reduce((s, r) => s + (r.total_amount || 0), 0);

          trends.push({
            label: `${String(m).padStart(2, "0")}/${y}`,
            month: m, year: y,
            revenue, commission, salary,
            expenses: commission + salary,
            grossProfit: revenue - commission,
            netProfit: revenue - commission - salary,
          });
        }

        return NextResponse.json({ trends });
      }

      // ============ DAILY REVENUE (current month) ============
      case "daily": {
        const { data: dailyOrders } = await supabase
          .from("orders")
          .select("total_price, created_at")
          .eq("status", "completed")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthDate)
          .order("created_at", { ascending: true });

        const dailyMap: Record<string, { revenue: number; orders: number }> = {};
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          dailyMap[key] = { revenue: 0, orders: 0 };
        }

        for (const o of (dailyOrders || [])) {
          const day = o.created_at.substring(0, 10);
          if (dailyMap[day]) {
            dailyMap[day].revenue += o.total_price || 0;
            dailyMap[day].orders++;
          }
        }

        const daily = Object.entries(dailyMap).map(([date, data]) => ({
          date,
          day: parseInt(date.split("-")[2]),
          ...data,
        }));

        return NextResponse.json({ daily });
      }

      // ============ PROFIT DISTRIBUTION MODEL ============
      case "distribution": {
        // Get all completed orders
        const { data: allCompleted } = await supabase
          .from("orders")
          .select("total_price")
          .eq("status", "completed")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthDate);

        const totalRev = (allCompleted || []).reduce((s, o) => s + (o.total_price || 0), 0);

        // Worker cost (60% default)
        const { data: settingsData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "payroll_settings")
          .single();

        const workerRate = settingsData?.value?.worker_rate ? Number(settingsData.value.worker_rate) : 60;
        const workerShare = totalRev * (workerRate / 100);
        const etnyxShare = totalRev - workerShare;

        // Salary costs
        const { data: salData } = await supabase
          .from("salary_records")
          .select("total_amount")
          .eq("period_month", month)
          .eq("period_year", year);
        const salaryTotal = (salData || []).reduce((s, r) => s + (r.total_amount || 0), 0);

        // Operational costs estimate (API, hosting, domains, tools)
        const operationalEst = 500000; // ~Rp500k/bulan base

        const afterSalary = etnyxShare - salaryTotal;
        const afterOps = afterSalary - operationalEst;
        const expansionFund = afterOps > 0 ? afterOps * 0.10 : 0; // 10% expansion
        const emergencyFund = afterOps > 0 ? afterOps * 0.05 : 0; // 5% emergency
        const ownerProfit = afterOps - expansionFund - emergencyFund;

        return NextResponse.json({
          distribution: {
            totalRevenue: totalRev,
            workerRate,
            workerShare: Math.round(workerShare),
            etnyxShare: Math.round(etnyxShare),
            salaryTotal: Math.round(salaryTotal),
            operationalEst,
            afterSalary: Math.round(afterSalary),
            afterOps: Math.round(afterOps),
            expansionFund: Math.round(expansionFund),
            emergencyFund: Math.round(emergencyFund),
            ownerProfit: Math.round(ownerProfit),
            // Percentages of total revenue
            pct: {
              worker: workerRate,
              salary: totalRev > 0 ? Math.round((salaryTotal / totalRev) * 10000) / 100 : 0,
              operational: totalRev > 0 ? Math.round((operationalEst / totalRev) * 10000) / 100 : 0,
              expansion: totalRev > 0 ? Math.round((expansionFund / totalRev) * 10000) / 100 : 0,
              emergency: totalRev > 0 ? Math.round((emergencyFund / totalRev) * 10000) / 100 : 0,
              owner: totalRev > 0 ? Math.round((ownerProfit / totalRev) * 10000) / 100 : 0,
            },
          },
        });
      }

      // ============ CASHFLOW DETAIL ============
      case "cashflow": {
        // Cash in: paid orders
        const { data: paidOrders } = await supabase
          .from("orders")
          .select("total_price, paid_at, payment_method, created_at")
          .eq("payment_status", "paid")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthDate);

        const cashIn = (paidOrders || []).reduce((s, o) => s + (o.total_price || 0), 0);

        // Cash out: paid payouts
        const { data: paidPayouts } = await supabase
          .from("payouts")
          .select("total_amount, type, paid_at, payment_method_label, payout_code")
          .eq("status", "paid")
          .gte("paid_at", monthStart)
          .lt("paid_at", nextMonthDate);

        const cashOutCommission = (paidPayouts || []).filter(p => p.type === "commission").reduce((s, p) => s + (p.total_amount || 0), 0);
        const cashOutSalary = (paidPayouts || []).filter(p => p.type === "salary").reduce((s, p) => s + (p.total_amount || 0), 0);
        const cashOutMixed = (paidPayouts || []).filter(p => p.type === "mixed").reduce((s, p) => s + (p.total_amount || 0), 0);
        const totalCashOut = cashOutCommission + cashOutSalary + cashOutMixed;

        // Pending obligations
        const { data: pendingCom } = await supabase
          .from("commissions")
          .select("total_amount")
          .in("status", ["pending", "approved"])
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthDate);
        const pendingComTotal = (pendingCom || []).reduce((s, c) => s + (c.total_amount || 0), 0);

        const { data: pendingSal } = await supabase
          .from("salary_records")
          .select("total_amount")
          .in("status", ["pending", "approved"])
          .eq("period_month", month)
          .eq("period_year", year);
        const pendingSalTotal = (pendingSal || []).reduce((s, r) => s + (r.total_amount || 0), 0);

        // Recent transactions
        const recentCashIn = (paidOrders || []).slice(-10).map(o => ({
          type: "in" as const,
          amount: o.total_price,
          method: o.payment_method,
          date: o.paid_at || o.created_at,
        }));
        const recentCashOut = (paidPayouts || []).slice(-10).map(p => ({
          type: "out" as const,
          amount: p.total_amount,
          method: p.payment_method_label,
          code: p.payout_code,
          date: p.paid_at,
        }));

        return NextResponse.json({
          cashflow: {
            cashIn,
            cashOut: totalCashOut,
            cashOutBreakdown: {
              commission: cashOutCommission,
              salary: cashOutSalary,
              mixed: cashOutMixed,
            },
            netCashFlow: cashIn - totalCashOut,
            pendingObligations: pendingComTotal + pendingSalTotal,
            pendingCommissions: pendingComTotal,
            pendingSalaries: pendingSalTotal,
            // Health check
            runwayMonths: totalCashOut > 0 ? Math.round(((cashIn - totalCashOut) / totalCashOut) * 10) / 10 : 0,
            recentIn: recentCashIn,
            recentOut: recentCashOut,
          },
        });
      }

      // ============ ORDER PROFITABILITY ============
      case "orders": {
        const { data: orderDetails } = await supabase
          .from("orders")
          .select(`
            id, order_id, total_price, base_price, package, package_title,
            current_rank, target_rank, is_express, is_premium,
            promo_discount, tier_discount, payment_method,
            status, created_at, completed_at
          `)
          .eq("status", "completed")
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthDate)
          .order("created_at", { ascending: false })
          .limit(100);

        // Get commissions for these orders
        const orderIds = (orderDetails || []).map(o => o.id);
        let orderCommissions: Record<string, number> = {};
        if (orderIds.length > 0) {
          const { data: comData } = await supabase
            .from("commissions")
            .select("order_id, total_amount")
            .in("order_id", orderIds);
          for (const c of (comData || [])) {
            orderCommissions[c.order_id] = c.total_amount;
          }
        }

        const profitableOrders = (orderDetails || []).map(o => {
          const commission = orderCommissions[o.id] || 0;
          const profit = (o.total_price || 0) - commission;
          const margin = o.total_price > 0 ? (profit / o.total_price) * 100 : 0;
          return {
            ...o,
            commission,
            profit,
            margin: Math.round(margin * 100) / 100,
          };
        });

        // Package profitability
        const packageProfit: Record<string, { count: number; revenue: number; cost: number; profit: number }> = {};
        for (const o of profitableOrders) {
          const pkg = o.package_title || o.package || "unknown";
          if (!packageProfit[pkg]) packageProfit[pkg] = { count: 0, revenue: 0, cost: 0, profit: 0 };
          packageProfit[pkg].count++;
          packageProfit[pkg].revenue += o.total_price || 0;
          packageProfit[pkg].cost += o.commission;
          packageProfit[pkg].profit += o.profit;
        }

        return NextResponse.json({
          orders: profitableOrders,
          packageProfitability: Object.entries(packageProfit)
            .map(([name, data]) => ({ name, ...data, margin: data.revenue > 0 ? Math.round((data.profit / data.revenue) * 10000) / 100 : 0 }))
            .sort((a, b) => b.revenue - a.revenue),
        });
      }

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Finance API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
