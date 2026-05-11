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
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total_orders: data?.length || 0,
      pending_orders: data?.filter(o => o.status === "pending").length || 0,
      confirmed_orders: data?.filter(o => o.status === "confirmed").length || 0,
      in_progress_orders: data?.filter(o => o.status === "in_progress").length || 0,
      completed_orders: data?.filter(o => o.status === "completed").length || 0,
      cancelled_orders: data?.filter(o => o.status === "cancelled").length || 0,
      total_revenue: data?.filter(o => o.payment_status === "paid").reduce((sum, o) => sum + (o.total_price || 0), 0) || 0,
      pending_revenue: data?.filter(o => o.payment_status !== "paid" && o.status !== "cancelled").reduce((sum, o) => sum + (o.total_price || 0), 0) || 0,
      paid_orders: data?.filter(o => o.payment_status === "paid").length || 0,
      orders_today: data?.filter(o => o.created_at?.slice(0, 10) === todayStr).length || 0,
      orders_this_week: data?.filter(o => o.created_at && new Date(o.created_at) >= startOfWeek).length || 0,
      orders_this_month: data?.filter(o => o.created_at && new Date(o.created_at) >= startOfMonth).length || 0,
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
