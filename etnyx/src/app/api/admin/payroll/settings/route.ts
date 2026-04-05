import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

// GET - Payroll settings
export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("payroll_settings")
      .select("*");

    if (error) throw error;

    const settings: Record<string, unknown> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Payroll settings error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Update payroll settings
export async function PUT(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    if (!["commission", "payout_cycle"].includes(key)) {
      return NextResponse.json({ error: "Invalid settings key" }, { status: 400 });
    }

    // Validate commission settings
    if (key === "commission") {
      const rate = value.worker_rate;
      if (typeof rate !== "number" || rate < 0.1 || rate > 0.9) {
        return NextResponse.json({ error: "worker_rate must be between 0.1 and 0.9" }, { status: 400 });
      }
    }

    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("payroll_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw error;

    logAdminAction({
      admin_email: auth.user!.email,
      action: "settings_change",
      resource_type: "settings",
      details: `Updated payroll setting: ${key}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payroll settings update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
