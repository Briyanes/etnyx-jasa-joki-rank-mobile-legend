import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * POST /api/admin/ban-customer
 * Body: { orderId: string, reason?: string }
 *
 * 1. Fetches the order by order_id
 * 2. Bans ALL identifiers: IP + WA + Email + Game ID
 * 3. Cancels all pending orders from this customer
 * 4. Returns summary of what was banned
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authenticated) {
      return authResult.error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const bannedBy = authResult.user?.email || "admin";
    const banReason = reason || `Banned from order ${orderId} by admin`;

    // 1. Fetch the order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_id, whatsapp, customer_email, game_id, customer_ip, username")
      .eq("order_id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    const banned: string[] = [];
    const errors: string[] = [];

    // 2. Ban IP
    if (order.customer_ip && order.customer_ip !== "unknown") {
      const { error } = await supabase
        .from("banned_ips")
        .upsert({
          ip_address: order.customer_ip,
          reason: banReason,
          auto_banned: false,
          banned_by: bannedBy,
        }, { onConflict: "ip_address", ignoreDuplicates: true });

      if (error) errors.push(`IP: ${error.message}`);
      else banned.push(`IP: ${order.customer_ip}`);
    }

    // 3. Ban WhatsApp
    if (order.whatsapp) {
      const { error } = await supabase
        .from("banned_whatsapp")
        .upsert({
          whatsapp: order.whatsapp,
          reason: banReason,
          auto_banned: false,
          banned_by: bannedBy,
        }, { onConflict: "whatsapp", ignoreDuplicates: true });

      if (error) errors.push(`WA: ${error.message}`);
      else banned.push(`WA: ${order.whatsapp}`);
    }

    // 4. Ban Email
    if (order.customer_email) {
      const { error } = await supabase
        .from("banned_emails")
        .upsert({
          email: order.customer_email.toLowerCase(),
          reason: banReason,
          auto_banned: false,
          banned_by: bannedBy,
        }, { onConflict: "email", ignoreDuplicates: true });

      if (error) errors.push(`Email: ${error.message}`);
      else banned.push(`Email: ${order.customer_email}`);
    }

    // 5. Ban Game ID (most important — cannot be changed)
    if (order.game_id) {
      const cleanGameId = String(order.game_id).replace(/\D/g, "");
      if (cleanGameId) {
        const { error } = await supabase
          .from("banned_game_ids")
          .upsert({
            game_id: cleanGameId,
            reason: banReason,
            auto_banned: false,
            banned_by: bannedBy,
          }, { onConflict: "game_id", ignoreDuplicates: true });

        if (error) errors.push(`Game ID: ${error.message}`);
        else banned.push(`Game ID: ${cleanGameId}`);
      }
    }

    // 6. Cancel all pending orders from this customer
    let cancelledCount = 0;
    const orConditions: string[] = [];
    if (order.whatsapp) orConditions.push(`whatsapp.eq.${order.whatsapp}`);
    if (order.customer_email) orConditions.push(`customer_email.eq.${order.customer_email}`);
    if (order.game_id) orConditions.push(`game_id.eq.${order.game_id}`);

    if (orConditions.length > 0) {
      const { data: cancelled, error: cancelErr } = await supabase
        .from("orders")
        .update({ status: "cancelled", notes: `Auto-cancelled: customer banned by ${bannedBy}` })
        .or(orConditions.join(","))
        .in("status", ["pending", "confirmed"])
        .select("id");

      if (cancelErr) {
        errors.push(`Cancel orders: ${cancelErr.message}`);
      } else {
        cancelledCount = cancelled?.length || 0;
      }
    }

    // 7. Log the ban action
    await supabase.from("order_logs").insert({
      order_id: order.id,
      action: "customer_banned",
      new_value: "banned",
      notes: `Customer banned by ${bannedBy}. Banned: ${banned.join(", ")}. Cancelled ${cancelledCount} orders.`,
      created_by: bannedBy,
    });

    return NextResponse.json({
      success: true,
      banned,
      errors: errors.length > 0 ? errors : undefined,
      cancelledOrders: cancelledCount,
      customer: {
        username: order.username,
        whatsapp: order.whatsapp,
        email: order.customer_email,
        gameId: order.game_id,
        ip: order.customer_ip,
      },
    });
  } catch (error) {
    console.error("Error banning customer:", error);
    return NextResponse.json(
      { error: "Gagal ban customer" },
      { status: 500 }
    );
  }
}