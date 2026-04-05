import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { sanitizeInput } from "@/lib/validation";

// GET - List payment accounts for a staff member (or all)
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staff_id");
    const supabase = await createAdminClient();

    let query = supabase
      .from("staff_payment_accounts")
      .select("*, staff_users(name, email, role)")
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (staffId) query = query.eq("staff_id", staffId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ accounts: data || [] });
  } catch (error) {
    console.error("Payment accounts fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create payment account for a staff member
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { staffId, method, label, accountName, accountNumber, isPrimary } = body;

    if (!staffId || !method || !label || !accountName || !accountNumber) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // If setting as primary, unset other primaries for this staff
    if (isPrimary) {
      await supabase
        .from("staff_payment_accounts")
        .update({ is_primary: false })
        .eq("staff_id", staffId);
    }

    const { data, error } = await supabase
      .from("staff_payment_accounts")
      .insert({
        staff_id: staffId,
        method: sanitizeInput(method),
        label: sanitizeInput(label),
        account_name: sanitizeInput(accountName),
        account_number: sanitizeInput(accountNumber),
        is_primary: isPrimary || false,
      })
      .select()
      .single();

    if (error) throw error;

    logAdminAction({
      admin_email: auth.user!.email,
      action: "create",
      resource_type: "staff",
      resource_id: data.id,
      details: `Added payment account ${label} for staff ${staffId}`,
    });

    return NextResponse.json({ success: true, account: data });
  } catch (error) {
    console.error("Create payment account error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update or deactivate payment account
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { id, action, accountName, accountNumber, isPrimary } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    if (action === "deactivate") {
      const { error } = await supabase
        .from("staff_payment_accounts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      logAdminAction({
        admin_email: auth.user!.email,
        action: "delete",
        resource_type: "staff",
        resource_id: id,
        details: `Deactivated payment account`,
      });

      return NextResponse.json({ success: true });
    }

    // Update account details
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (accountName) updates.account_name = sanitizeInput(accountName);
    if (accountNumber) updates.account_number = sanitizeInput(accountNumber);

    if (isPrimary !== undefined) {
      if (isPrimary) {
        // Get staff_id first
        const { data: account } = await supabase
          .from("staff_payment_accounts")
          .select("staff_id")
          .eq("id", id)
          .single();

        if (account) {
          await supabase
            .from("staff_payment_accounts")
            .update({ is_primary: false })
            .eq("staff_id", account.staff_id);
        }
      }
      updates.is_primary = isPrimary;
    }

    const { error } = await supabase
      .from("staff_payment_accounts")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update payment account error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
