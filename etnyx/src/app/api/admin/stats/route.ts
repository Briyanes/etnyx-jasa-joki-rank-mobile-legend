import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("orders")
      .select("status, payment_status, total_price, created_at");

    if (error) {
      console.error("Stats query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    // Aggregate stats from orders
    const stats = {
      total_orders: data?.length || 0,
      pending_orders: data?.filter(o => o.status === "pending").length || 0,
      active_orders: data?.filter(o => ["confirmed", "in_progress"].includes(o.status)).length || 0,
      completed_orders: data?.filter(o => o.status === "completed").length || 0,
      cancelled_orders: data?.filter(o => o.status === "cancelled").length || 0,
      total_revenue: data?.filter(o => o.payment_status === "paid").reduce((sum, o) => sum + (o.total_price || 0), 0) || 0,
      paid_orders: data?.filter(o => o.payment_status === "paid").length || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
