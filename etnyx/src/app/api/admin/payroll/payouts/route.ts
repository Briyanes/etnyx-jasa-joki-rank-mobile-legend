import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { sanitizeInput } from "@/lib/validation";

// GET - List payouts
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const supabase = await createAdminClient();

    let query = supabase
      .from("payouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ payouts: data || [] });
  } catch (error) {
    console.error("Payouts fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create payout batch
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { type, periodLabel, periodStart, periodEnd, commissionIds, salaryRecordIds, notes } = body;

    if (!type || !periodLabel) {
      return NextResponse.json({ error: "type and periodLabel required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Generate payout code
    const { data: codeData } = await supabase.rpc("generate_payout_code");
    const payoutCode = codeData || `PAY-${Date.now()}`;

    // Calculate total from selected items
    let totalAmount = 0;
    let totalItems = 0;
    const items: Array<{
      staff_id: string;
      item_type: string;
      reference_id: string;
      amount: number;
      description: string;
    }> = [];

    // Process commissions
    if (commissionIds && commissionIds.length > 0) {
      const { data: commissions } = await supabase
        .from("commissions")
        .select("id, worker_id, total_amount, order_code")
        .in("id", commissionIds)
        .eq("status", "pending");

      for (const c of commissions || []) {
        totalAmount += c.total_amount;
        totalItems++;
        items.push({
          staff_id: c.worker_id,
          item_type: "commission",
          reference_id: c.id,
          amount: c.total_amount,
          description: `Commission: ${c.order_code}`,
        });
      }
    }

    // Process salary records
    if (salaryRecordIds && salaryRecordIds.length > 0) {
      const { data: salaries } = await supabase
        .from("salary_records")
        .select("id, staff_id, total_amount, period_month, period_year")
        .in("id", salaryRecordIds)
        .eq("status", "pending");

      for (const s of salaries || []) {
        totalAmount += s.total_amount;
        totalItems++;
        items.push({
          staff_id: s.staff_id,
          item_type: "salary",
          reference_id: s.id,
          amount: s.total_amount,
          description: `Salary: ${s.period_month}/${s.period_year}`,
        });
      }
    }

    if (totalItems === 0) {
      return NextResponse.json({ error: "No valid items to include in payout" }, { status: 400 });
    }

    // Create payout
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        payout_code: payoutCode,
        type,
        period_label: periodLabel,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        total_amount: totalAmount,
        total_items: totalItems,
        status: "pending_approval",
        created_by: auth.user!.email,
        notes: notes ? sanitizeInput(notes) : null,
      })
      .select()
      .single();

    if (payoutError) throw payoutError;

    // Create payout items
    const payoutItems = items.map(item => ({
      ...item,
      payout_id: payout.id,
    }));

    const { error: itemsError } = await supabase
      .from("payout_items")
      .insert(payoutItems);

    if (itemsError) throw itemsError;

    // Update commission/salary statuses and link to payout
    if (commissionIds && commissionIds.length > 0) {
      await supabase
        .from("commissions")
        .update({ status: "approved", payout_id: payout.id })
        .in("id", commissionIds)
        .eq("status", "pending");
    }

    if (salaryRecordIds && salaryRecordIds.length > 0) {
      await supabase
        .from("salary_records")
        .update({ status: "approved", payout_id: payout.id })
        .in("id", salaryRecordIds)
        .eq("status", "pending");
    }

    logAdminAction({
      admin_email: auth.user!.email,
      action: "create",
      resource_type: "order",
      resource_id: payout.id,
      details: `Created payout ${payoutCode}: Rp ${totalAmount.toLocaleString()} (${totalItems} items)`,
    });

    return NextResponse.json({ success: true, payout });
  } catch (error) {
    console.error("Create payout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update payout status (approve, mark paid, cancel)
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { id, action, paymentProof, notes, paymentMethod, paymentMethodLabel, paymentReference, recipientAccountId, recipientInfo } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "id and action required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data: payout } = await supabase
      .from("payouts")
      .select("*")
      .eq("id", id)
      .single();

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    switch (action) {
      case "approve":
        if (payout.status !== "pending_approval") {
          return NextResponse.json({ error: "Can only approve pending payouts" }, { status: 400 });
        }
        updates.status = "approved";
        updates.approved_by = auth.user!.email;
        updates.approved_at = new Date().toISOString();
        break;

      case "mark_paid":
        if (payout.status !== "approved") {
          return NextResponse.json({ error: "Can only mark approved payouts as paid" }, { status: 400 });
        }
        if (!paymentMethod) {
          return NextResponse.json({ error: "Payment method required" }, { status: 400 });
        }
        updates.status = "paid";
        updates.paid_by = auth.user!.email;
        updates.paid_at = new Date().toISOString();
        updates.payment_method = paymentMethod;
        if (paymentMethodLabel) updates.payment_method_label = paymentMethodLabel;
        if (paymentReference) updates.payment_reference = sanitizeInput(paymentReference);
        if (paymentProof) updates.payment_proof = paymentProof;
        if (recipientAccountId) updates.recipient_account_id = recipientAccountId;
        if (recipientInfo) updates.recipient_info = recipientInfo;

        // Update all related commissions and salary records to paid
        await supabase
          .from("commissions")
          .update({ status: "paid" })
          .eq("payout_id", id);

        await supabase
          .from("salary_records")
          .update({ status: "paid" })
          .eq("payout_id", id);
        break;

      case "cancel":
        if (payout.status === "paid") {
          return NextResponse.json({ error: "Cannot cancel paid payouts" }, { status: 400 });
        }
        updates.status = "cancelled";

        // Revert commissions and salary records to pending
        await supabase
          .from("commissions")
          .update({ status: "pending", payout_id: null })
          .eq("payout_id", id);

        await supabase
          .from("salary_records")
          .update({ status: "pending", payout_id: null })
          .eq("payout_id", id);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (notes) updates.notes = sanitizeInput(notes);

    const { error } = await supabase
      .from("payouts")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    logAdminAction({
      admin_email: auth.user!.email,
      action: "update",
      resource_type: "order",
      resource_id: id,
      details: `Payout ${payout.payout_code}: ${action}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update payout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
