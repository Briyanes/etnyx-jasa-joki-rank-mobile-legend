import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyStaff } from "@/lib/staff-auth";
import { decryptField } from "@/lib/encryption";

// GET /api/staff/credentials?orderId=xxx — Get order credentials (worker only sees assigned orders)
export async function GET(request: NextRequest) {
  const auth = await verifyStaff();
  if (!auth.authenticated || !auth.user) return auth.error!;

  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const supabase = await createAdminClient();

    // Workers can only view credentials for their assigned orders
    if (auth.user.role === "worker") {
      const { data: assignment } = await supabase
        .from("order_assignments")
        .select("id")
        .eq("order_id", orderId)
        .eq("assigned_to", auth.user.id)
        .eq("status", "in_progress")
        .single();

      if (!assignment) {
        return NextResponse.json({ error: "Not assigned to this order" }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .select("order_id, account_login, account_password, login_method, package_title, notes")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isGendong = data.package_title?.includes("Gendong") || data.package_title?.includes("Duo Boost");

    return NextResponse.json({
      order_id: data.order_id,
      login_method: data.login_method,
      account_login: data.account_login ? decryptField(data.account_login) : null,
      account_password: data.account_password ? decryptField(data.account_password) : null,
      is_gendong: !!isGendong,
      notes: isGendong ? data.notes : null,
    });
  } catch (error) {
    console.error("Credentials fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }
}
