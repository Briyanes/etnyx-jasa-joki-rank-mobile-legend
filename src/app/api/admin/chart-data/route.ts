import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Get orders from last 7 days grouped by date
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: orders } = await supabase
      .from("orders")
      .select("created_at, total_price")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    // Group by date
    const groupedData: Record<string, { orders: number; revenue: number }> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      groupedData[dateStr] = { orders: 0, revenue: 0 };
    }

    // Fill with actual data
    orders?.forEach((order) => {
      const date = new Date(order.created_at);
      const dateStr = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      if (groupedData[dateStr]) {
        groupedData[dateStr].orders += 1;
        groupedData[dateStr].revenue += order.total_price || 0;
      }
    });

    const chartData = Object.entries(groupedData).map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: data.revenue,
    }));

    return NextResponse.json({ chartData });
  } catch (error) {
    console.error("Chart data error:", error);
    return NextResponse.json({ chartData: [] });
  }
}
