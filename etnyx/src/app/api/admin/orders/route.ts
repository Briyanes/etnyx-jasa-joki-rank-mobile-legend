import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { sanitizeInput, isValidRank } from "@/lib/validation";
import { sendNewOrderNotifications, sendOrderConfirmedNotifications, sendOrderCompletedNotifications } from "@/lib/notifications";

export async function GET(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
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
      console.error("Orders query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
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
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.username || !body.current_rank || !body.target_rank) {
      return NextResponse.json({ error: "Missing required fields: username, current_rank, target_rank" }, { status: 400 });
    }

    if (!isValidRank(body.current_rank) || !isValidRank(body.target_rank)) {
      return NextResponse.json({ error: "Invalid rank value" }, { status: 400 });
    }

    // Sanitize string inputs
    const sanitizedBody = {
      ...body,
      username: sanitizeInput(body.username),
      game_id: body.game_id ? sanitizeInput(body.game_id) : undefined,
    };

    const supabase = await createAdminClient();

    // Generate order ID
    const orderId = `ETX-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        ...sanitizedBody,
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

// Whitelist of fields admin is allowed to update
const ALLOWED_UPDATE_FIELDS = [
  "status",
  "progress",
  "current_progress_rank",
  "notes",
  "assigned_booster",
  "is_express",
  "is_premium",
] as const;

export async function PATCH(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    // Only pick allowed fields — prevents mass assignment
    const updates: Record<string, unknown> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Get current order state before update
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    const previousStatus = currentOrder?.status;

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Send notifications based on status change
    if (updates.status && updates.status !== previousStatus) {
      const orderData = {
        order_id: data.order_id,
        username: data.username,
        current_rank: data.current_rank,
        target_rank: data.target_rank,
        package: data.package,
        price: data.price,
        whatsapp: data.whatsapp,
        email: data.email,
        status: data.status,
        is_express: data.is_express,
        is_premium: data.is_premium,
        notes: data.notes,
      };

      // Status: confirmed/in_progress -> notify worker + customer
      if (updates.status === "confirmed" || updates.status === "in_progress") {
        sendOrderConfirmedNotifications(orderData).catch(console.error);
      }
      
      // Status: completed -> notify customer
      if (updates.status === "completed") {
        sendOrderCompletedNotifications(orderData).catch(console.error);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
