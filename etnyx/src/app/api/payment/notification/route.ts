import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendNewOrderNotifications } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // iPaymu callback fields: trx_id, reference_id, status, status_code, sid, via, channel
    const {
      reference_id,
      status,
      status_code,
      via,
      channel,
      trx_id,
    } = body;

    if (!reference_id) {
      return NextResponse.json({ error: "Missing reference_id" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Find order by our order_id (stored as referenceId in iPaymu)
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", reference_id)
      .single();

    if (error || !order) {
      // Fallback: try midtrans_order_id DB column (legacy column name)
      const { data: orderAlt } = await supabase
        .from("orders")
        .select("*")
        .eq("midtrans_order_id", reference_id)
        .single();

      if (!orderAlt) {
        console.error("Order not found for iPaymu reference:", reference_id);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      // Use alt order
      return processPayment(supabase, orderAlt, { status, status_code, via, channel, trx_id });
    }

    return processPayment(supabase, order, { status, status_code, via, channel, trx_id });
  } catch (error) {
    console.error("Payment notification error:", error);
    return NextResponse.json({ error: "Notification processing failed" }, { status: 500 });
  }
}

async function processPayment(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  order: Record<string, unknown>,
  payment: { status: string; status_code: string; via: string; channel: string; trx_id: string }
) {
  // iPaymu status codes: 1 = pending, 0 = failed/expired, 6 = refunded, positive status_code with status=1 = success
  // iPaymu status field: "berhasil" (success), "pending", "expired", "gagal" (failed)
  let paymentStatus = "pending";
  let orderStatus = order.status as string;

  const normalizedStatus = String(payment.status).toLowerCase();

  if (normalizedStatus === "berhasil" || String(payment.status_code) === "1") {
    paymentStatus = "paid";
    orderStatus = "confirmed";
  } else if (normalizedStatus === "pending") {
    paymentStatus = "pending";
  } else if (normalizedStatus === "expired" || normalizedStatus === "gagal" || String(payment.status_code) === "0") {
    paymentStatus = "failed";
  } else if (normalizedStatus === "refund") {
    paymentStatus = "refunded";
  }

  const paymentType = [payment.via, payment.channel].filter(Boolean).join(" - ");

  // Update order
  await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      payment_type: paymentType || null,
      status: orderStatus,
      paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", order.id);

  console.log(`iPaymu notification: Order ${order.order_id} - status=${payment.status} - ${paymentStatus}`);

  // Send notifications when payment is confirmed
  if (paymentStatus === "paid" && order.status !== "confirmed") {
    const orderData = {
      order_id: order.order_id as string,
      username: order.username as string,
      current_rank: order.current_rank as string,
      target_rank: order.target_rank as string,
      package: order.package as string,
      price: (order.price || order.total_price) as number,
      whatsapp: order.whatsapp as string,
      email: order.email as string,
      status: orderStatus,
      is_express: order.is_express as boolean,
      is_premium: order.is_premium as boolean,
      notes: order.notes as string,
    };

    sendNewOrderNotifications(orderData).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
