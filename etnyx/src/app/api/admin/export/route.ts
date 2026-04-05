import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "orders";

    let data: Record<string, unknown>[] = [];
    let filename = "";

    switch (type) {
      case "orders": {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, order_id, username, game_id, current_rank, target_rank, package, package_title, is_express, is_premium, total_price, status, progress, current_progress_rank, login_method, hero_request, customer_email, whatsapp, promo_code, promo_discount, created_at, updated_at")
          .order("created_at", { ascending: false });
        data = orders || [];
        filename = `orders_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "customers": {
        const { data: customers } = await supabase
          .from("customers")
          .select("id, email, name, whatsapp, total_orders, total_spent, referral_code, created_at")
          .order("created_at", { ascending: false });
        data = customers || [];
        filename = `customers_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "testimonials": {
        const { data: testimonials } = await supabase
          .from("testimonials")
          .select("*")
          .order("created_at", { ascending: false });
        data = testimonials || [];
        filename = `testimonials_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "promo_codes": {
        const { data: promos } = await supabase
          .from("promo_codes")
          .select("*")
          .order("created_at", { ascending: false });
        data = promos || [];
        filename = `promo_codes_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "boosters": {
        const { data: boosters } = await supabase
          .from("boosters")
          .select("*")
          .order("created_at", { ascending: false });
        data = boosters || [];
        filename = `boosters_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "commissions": {
        const month = searchParams.get("month");
        const year = searchParams.get("year");
        let query = supabase
          .from("commissions")
          .select("order_code, worker_id, order_total, commission_rate, commission_amount, bonus_amount, total_amount, status, period_start, period_end, created_at, staff_users(name, email)")
          .order("created_at", { ascending: false });
        if (month && year) {
          const mStart = `${year}-${String(month).padStart(2, "0")}-01`;
          const nMonth = parseInt(month) === 12 ? `${parseInt(year) + 1}-01-01` : `${year}-${String(parseInt(month) + 1).padStart(2, "0")}-01`;
          query = query.gte("created_at", mStart).lt("created_at", nMonth);
        }
        const { data: commissions } = await query;
        data = (commissions || []).map((c: Record<string, unknown>) => {
          const staff = c.staff_users as Record<string, string> | null;
          return {
            order_code: c.order_code,
            worker_name: staff?.name || "",
            worker_email: staff?.email || "",
            order_total: c.order_total,
            commission_rate: c.commission_rate,
            commission_amount: c.commission_amount,
            bonus_amount: c.bonus_amount,
            total_amount: c.total_amount,
            status: c.status,
            period_start: c.period_start,
            period_end: c.period_end,
            created_at: c.created_at,
          };
        });
        filename = `commissions_${month || "all"}_${year || "all"}_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "salaries": {
        const sMonth = searchParams.get("month");
        const sYear = searchParams.get("year");
        let query = supabase
          .from("salary_records")
          .select("staff_id, period_month, period_year, base_salary, allowances_total, deductions, deduction_notes, bonus_amount, bonus_notes, total_amount, status, created_at, staff_users(name, email, role)")
          .order("created_at", { ascending: false });
        if (sMonth && sYear) {
          query = query.eq("period_month", parseInt(sMonth)).eq("period_year", parseInt(sYear));
        }
        const { data: salaries } = await query;
        data = (salaries || []).map((s: Record<string, unknown>) => {
          const staff = s.staff_users as Record<string, string> | null;
          return {
            staff_name: staff?.name || "",
            staff_email: staff?.email || "",
            staff_role: staff?.role || "",
            period: `${s.period_month}/${s.period_year}`,
            base_salary: s.base_salary,
            allowances_total: s.allowances_total,
            deductions: s.deductions,
            deduction_notes: s.deduction_notes,
            bonus_amount: s.bonus_amount,
            bonus_notes: s.bonus_notes,
            total_amount: s.total_amount,
            status: s.status,
            created_at: s.created_at,
          };
        });
        filename = `salaries_${sMonth || "all"}_${sYear || "all"}_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "payouts": {
        const { data: payouts } = await supabase
          .from("payouts")
          .select("payout_code, type, period_label, total_amount, total_items, status, payment_method_label, payment_reference, created_by, approved_by, approved_at, paid_by, paid_at, created_at")
          .order("created_at", { ascending: false });
        data = payouts || [];
        filename = `payouts_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle values with commas or quotes
            if (value === null || value === undefined) return "";
            const str = String(value);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      ),
    ];
    const csv = csvRows.join("\n");

    logAdminAction({
      admin_email: auth.user!.email,
      action: "export_data",
      resource_type: "order",
      details: `Exported ${type} (${data.length} rows)`,
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
