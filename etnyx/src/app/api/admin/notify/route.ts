import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { sendWhatsAppMessage } from "@/lib/notifications";
import { logAdminAction } from "@/lib/audit-log";

// POST /api/admin/notify — Send custom WhatsApp notification to customer by order ID
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const rawMessage = typeof body.message === "string" ? body.message.trim() : "";

    if (!orderId || !rawMessage) {
      return NextResponse.json({ error: "orderId and message are required" }, { status: 400 });
    }

    // Limit message length to Meta WA max
    const message = rawMessage.slice(0, 4096);

    const supabase = await createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_id, whatsapp, username")
      .eq("order_id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (!order.whatsapp) {
      return NextResponse.json({ error: "Customer tidak punya nomor WhatsApp" }, { status: 400 });
    }

    const sent = await sendWhatsAppMessage(order.whatsapp, message);

    // Log to order_logs
    supabase.from("order_logs").insert({
      order_id: order.id,
      action: "manual_notify_whatsapp",
      new_value: sent ? "sent" : "failed",
      notes: `Notif manual via WA: ${message.slice(0, 120)}`,
      created_by: auth.user?.email || "admin",
    }).then(() => {});

    logAdminAction({
      admin_email: auth.user!.email,
      action: "create",
      resource_type: "order",
      resource_id: order.id,
      details: `Manual WA notify to ${order.whatsapp} (${order.order_id}): ${message.slice(0, 120)}`,
    });

    return NextResponse.json({
      success: sent,
      message: sent
        ? "Notifikasi berhasil dikirim!"
        : "Gagal mengirim. Cek konfigurasi WhatsApp atau pastikan customer dalam 24h window.",
    });
  } catch (error) {
    console.error("Admin notify error:", error);
    return NextResponse.json({ error: "Gagal mengirim notifikasi" }, { status: 500 });
  }
}