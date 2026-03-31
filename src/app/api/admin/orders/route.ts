import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createAdminClient();

    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      // Return mock data for development if table doesn't exist
      if (error.code === "42P01") {
        return NextResponse.json({
          orders: [
            {
              id: "1",
              order_id: "ETX-DEMO001",
              username: "Player123",
              game_id: "123456789",
              current_rank: "epic",
              target_rank: "legend",
              package: "Standard",
              is_express: false,
              is_premium: false,
              base_price: 25000,
              total_price: 25000,
              status: "in_progress",
              progress: 65,
              created_at: new Date().toISOString(),
            },
            {
              id: "2",
              order_id: "ETX-DEMO002",
              username: "GamerPro",
              game_id: "987654321",
              current_rank: "legend",
              target_rank: "mythic",
              package: "Express",
              is_express: true,
              is_premium: false,
              base_price: 80000,
              total_price: 96000,
              status: "pending",
              progress: 0,
              created_at: new Date().toISOString(),
            },
          ],
          total: 2,
        });
      }
      throw error;
    }

    return NextResponse.json({ orders: data, total: count });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createAdminClient();

    // Generate order ID
    const orderId = `ETX-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        ...body,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
