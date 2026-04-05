import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { sanitizeInput } from "@/lib/validation";

// GET - List salary configs and records
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view"); // "configs" or "records"
    const supabase = await createAdminClient();

    if (view === "records") {
      const month = searchParams.get("month");
      const year = searchParams.get("year");

      let query = supabase
        .from("salary_records")
        .select("*, staff_users(name, email, role)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (month) query = query.eq("period_month", parseInt(month));
      if (year) query = query.eq("period_year", parseInt(year));

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ records: data || [] });
    }

    // Default: salary configs
    const { data, error } = await supabase
      .from("staff_salaries")
      .select("*, staff_users(name, email, role)")
      .is("effective_to", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ configs: data || [] });
  } catch (error) {
    console.error("Salaries fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create/update salary config
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { staffId, baseSalary, allowances, notes } = body;

    if (!staffId || baseSalary == null) {
      return NextResponse.json({ error: "staffId and baseSalary required" }, { status: 400 });
    }

    if (baseSalary < 0 || baseSalary > 100000000) {
      return NextResponse.json({ error: "Invalid salary amount" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Close existing active config
    await supabase
      .from("staff_salaries")
      .update({ effective_to: new Date().toISOString().split("T")[0] })
      .eq("staff_id", staffId)
      .is("effective_to", null);

    // Create new config
    const { data, error } = await supabase
      .from("staff_salaries")
      .insert({
        staff_id: staffId,
        base_salary: Math.round(baseSalary),
        allowances: allowances || [],
        notes: notes ? sanitizeInput(notes) : null,
      })
      .select("*, staff_users(name, email)")
      .single();

    if (error) throw error;

    logAdminAction({
      admin_email: auth.user!.email,
      action: "create",
      resource_type: "staff",
      resource_id: staffId,
      details: `Set salary: Rp ${Math.round(baseSalary).toLocaleString()} for staff`,
    });

    return NextResponse.json({ success: true, config: data });
  } catch (error) {
    console.error("Salary config error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update salary record (deductions, bonus, etc)
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { id, deductions, deductionNotes, bonusAmount, bonusNotes } = body;

    if (!id) {
      return NextResponse.json({ error: "Salary record id required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Get current record
    const { data: record } = await supabase
      .from("salary_records")
      .select("*")
      .eq("id", id)
      .single();

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (deductions != null) updates.deductions = Math.max(0, Math.round(deductions));
    if (deductionNotes) updates.deduction_notes = sanitizeInput(deductionNotes);
    if (bonusAmount != null) updates.bonus_amount = Math.max(0, Math.round(bonusAmount));
    if (bonusNotes) updates.bonus_notes = sanitizeInput(bonusNotes);

    // Recalculate total
    const newDeductions = updates.deductions != null ? updates.deductions as number : record.deductions;
    const newBonus = updates.bonus_amount != null ? updates.bonus_amount as number : record.bonus_amount;
    updates.total_amount = record.base_salary + record.allowances_total - newDeductions + newBonus;

    const { error } = await supabase
      .from("salary_records")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    logAdminAction({
      admin_email: auth.user!.email,
      action: "update",
      resource_type: "staff",
      resource_id: id,
      details: `Updated salary record`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Salary update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
