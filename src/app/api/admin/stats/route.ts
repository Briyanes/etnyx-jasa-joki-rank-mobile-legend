import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("order_statistics")
      .select("*")
      .single();

    if (error) {
      // If view doesn't exist, return mock data for development
      if (error.code === "42P01") {
        return NextResponse.json({
          total_orders: 156,
          pending_orders: 12,
          confirmed_orders: 8,
          in_progress_orders: 15,
          completed_orders: 118,
          cancelled_orders: 3,
          total_revenue: 15680000,
          pending_revenue: 4250000,
          orders_today: 5,
          orders_this_week: 28,
          orders_this_month: 89,
        });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
