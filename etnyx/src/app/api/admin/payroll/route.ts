import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

// GET - Payroll overview (summary stats)
export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();

    // Get current period
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Pending commissions (not yet in a payout)
    const { data: pendingCommissions } = await supabase
      .from("commissions")
      .select("total_amount")
      .eq("status", "pending");

    const totalPendingCommissions = (pendingCommissions || []).reduce((s, c) => s + (c.total_amount || 0), 0);

    // This month's commissions
    const { data: monthCommissions } = await supabase
      .from("commissions")
      .select("total_amount, status")
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString());

    const monthTotal = (monthCommissions || []).reduce((s, c) => s + (c.total_amount || 0), 0);
    const monthPaid = (monthCommissions || []).filter(c => c.status === "paid").reduce((s, c) => s + (c.total_amount || 0), 0);

    // Pending payouts
    const { data: pendingPayouts, count: pendingPayoutCount } = await supabase
      .from("payouts")
      .select("total_amount", { count: "exact" })
      .in("status", ["draft", "pending_approval", "approved"]);

    const totalPendingPayouts = (pendingPayouts || []).reduce((s, p) => s + (p.total_amount || 0), 0);

    // Active staff salaries
    const { count: activeStaffCount } = await supabase
      .from("staff_salaries")
      .select("id", { count: "exact" })
      .is("effective_to", null);

    // Total paid this month
    const { data: paidThisMonth } = await supabase
      .from("payouts")
      .select("total_amount")
      .eq("status", "paid")
      .gte("paid_at", monthStart.toISOString())
      .lte("paid_at", monthEnd.toISOString());

    const totalPaidThisMonth = (paidThisMonth || []).reduce((s, p) => s + (p.total_amount || 0), 0);

    return NextResponse.json({
      overview: {
        pendingCommissions: totalPendingCommissions,
        pendingCommissionCount: (pendingCommissions || []).length,
        monthCommissionTotal: monthTotal,
        monthCommissionPaid: monthPaid,
        pendingPayouts: totalPendingPayouts,
        pendingPayoutCount: pendingPayoutCount || 0,
        activeStaffWithSalary: activeStaffCount || 0,
        totalPaidThisMonth,
      },
    });
  } catch (error) {
    console.error("Payroll overview error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Generate commissions for a period or salary records
export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { action } = body;
    const supabase = await createAdminClient();

    if (action === "generate_commissions") {
      // Generate commission records for completed orders without commissions
      const { periodStart, periodEnd } = body;
      if (!periodStart || !periodEnd) {
        return NextResponse.json({ error: "periodStart and periodEnd required" }, { status: 400 });
      }

      // Get payroll settings
      const { data: settings } = await supabase
        .from("payroll_settings")
        .select("value")
        .eq("key", "commission")
        .single();

      const commissionRate = settings?.value?.worker_rate ?? 0.60;

      // Find completed orders with assigned worker that don't have commissions yet
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_id, total_price, assigned_worker_id, completed_at")
        .eq("status", "completed")
        .not("assigned_worker_id", "is", null)
        .gte("completed_at", periodStart)
        .lte("completed_at", periodEnd);

      if (!orders || orders.length === 0) {
        return NextResponse.json({ message: "No completed orders in this period", generated: 0 });
      }

      // Filter out orders that already have commissions
      const orderIds = orders.map(o => o.id);
      const { data: existing } = await supabase
        .from("commissions")
        .select("order_id")
        .in("order_id", orderIds);

      const existingOrderIds = new Set((existing || []).map(e => e.order_id));
      const newOrders = orders.filter(o => !existingOrderIds.has(o.id));

      if (newOrders.length === 0) {
        return NextResponse.json({ message: "All orders already have commissions", generated: 0 });
      }

      // Insert commission records
      const records = newOrders.map(order => ({
        order_id: order.id,
        order_code: order.order_id,
        worker_id: order.assigned_worker_id,
        order_total: order.total_price,
        commission_rate: commissionRate,
        commission_amount: Math.floor(order.total_price * commissionRate),
        bonus_amount: 0,
        total_amount: Math.floor(order.total_price * commissionRate),
        status: "pending",
        period_start: periodStart,
        period_end: periodEnd,
      }));

      const { error } = await supabase.from("commissions").insert(records);
      if (error) throw error;

      logAdminAction({
        admin_email: auth.user!.email,
        action: "create",
        resource_type: "order",
        details: `Generated ${records.length} commission records for period ${periodStart} to ${periodEnd}`,
      });

      return NextResponse.json({ success: true, generated: records.length });
    }

    if (action === "generate_salaries") {
      const { month, year } = body;
      if (!month || !year) {
        return NextResponse.json({ error: "month and year required" }, { status: 400 });
      }

      // Get active salary configs
      const { data: configs } = await supabase
        .from("staff_salaries")
        .select("*, staff_users(name, email, role)")
        .is("effective_to", null);

      if (!configs || configs.length === 0) {
        return NextResponse.json({ message: "No active salary configs", generated: 0 });
      }

      // Check for existing records
      const { data: existingRecords } = await supabase
        .from("salary_records")
        .select("staff_id")
        .eq("period_month", month)
        .eq("period_year", year);

      const existingStaffIds = new Set((existingRecords || []).map(r => r.staff_id));
      const newConfigs = configs.filter(c => !existingStaffIds.has(c.staff_id));

      if (newConfigs.length === 0) {
        return NextResponse.json({ message: "Salary records already exist for this period", generated: 0 });
      }

      const records = newConfigs.map(config => {
        const allowances = config.allowances || [];
        const allowancesTotal = allowances.reduce((s: number, a: { amount?: number }) => s + (a.amount || 0), 0);
        return {
          staff_id: config.staff_id,
          salary_config_id: config.id,
          period_month: month,
          period_year: year,
          base_salary: config.base_salary,
          allowances_total: allowancesTotal,
          total_amount: config.base_salary + allowancesTotal,
          status: "pending",
        };
      });

      const { error } = await supabase.from("salary_records").insert(records);
      if (error) throw error;

      logAdminAction({
        admin_email: auth.user!.email,
        action: "create",
        resource_type: "staff",
        details: `Generated ${records.length} salary records for ${month}/${year}`,
      });

      return NextResponse.json({ success: true, generated: records.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Payroll generate error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
