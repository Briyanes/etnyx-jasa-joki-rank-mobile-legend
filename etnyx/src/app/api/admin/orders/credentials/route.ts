import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { decryptField } from "@/lib/encryption";
import { logAdminAction } from "@/lib/audit-log";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const orderId = request.nextUrl.searchParams.get("id");

    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("orders")
      .select("id, order_id, account_login, account_password, package_title, notes")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isGendong = data.package_title?.includes("Gendong") || data.package_title?.includes("Duo Boost");

    // Decrypt sensitive fields
    const credentials = {
      order_id: data.order_id,
      account_login: data.account_login ? decryptField(data.account_login) : null,
      account_password: data.account_password ? decryptField(data.account_password) : null,
      is_gendong: !!isGendong,
      notes: isGendong ? data.notes : null,
    };

    logAdminAction({
      admin_email: auth.user!.email,
      action: "view_credentials",
      resource_type: "order",
      resource_id: data.order_id,
      details: `Viewed credentials for order ${data.order_id}`,
    });

    return NextResponse.json(credentials);
  } catch (error) {
    console.error("Credentials fetch error:", error);
    return NextResponse.json(
      { error: "Failed to decrypt credentials" },
      { status: 500 }
    );
  }
}
