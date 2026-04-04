import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import crypto from "crypto";
import { sendNewOrderNotifications } from "@/lib/notifications";

// Get Midtrans server key from settings or env
async function getMidtransServerKey(): Promise<string> {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations")
      .single();
    
    return data?.value?.midtransServerKey || process.env.MIDTRANS_SERVER_KEY || "";
  } catch {
    return process.env.MIDTRANS_SERVER_KEY || "";
  }
}

// Verify Midtrans signature
function verifySignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string, serverKey: string): boolean {
  const hash = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return hash === signatureKey;
}

// GET handler for URL verification
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "payment-notification" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body;

    // Handle Midtrans test notification (no order_id or signature)
    if (!order_id || !signature_key) {
      console.log("Midtrans test notification received:", JSON.stringify(body));
      return NextResponse.json({ success: true, message: "Test notification received" });
    }

    const serverKey = await getMidtransServerKey();

    // Verify signature
    if (!verifySignature(order_id, status_code, gross_amount, signature_key, serverKey)) {
      console.error("Invalid signature for order:", order_id);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const supabase = await createAdminClient();

    // Find order by Midtrans order ID
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("midtrans_order_id", order_id)
      .single();

    if (error || !order) {
      console.error("Order not found for Midtrans ID:", order_id);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Determine payment status
    let paymentStatus = "pending";
    let orderStatus = order.status;

    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status === "accept" || !fraud_status) {
        paymentStatus = "paid";
        orderStatus = "confirmed"; // Auto-confirm when paid
      } else {
        paymentStatus = "challenge";
      }
    } else if (transaction_status === "pending") {
      paymentStatus = "pending";
    } else if (transaction_status === "deny" || transaction_status === "cancel" || transaction_status === "expire") {
      paymentStatus = "failed";
    } else if (transaction_status === "refund") {
      paymentStatus = "refunded";
    }

    // Update order
    await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        payment_type: payment_type,
        status: orderStatus,
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", order.id);

    console.log(`Payment notification: Order ${order.order_id} - ${transaction_status} - ${paymentStatus}`);

    // Send notifications when payment is confirmed
    if (paymentStatus === "paid" && order.status !== "confirmed") {
      const orderData = {
        order_id: order.order_id,
        username: order.username,
        current_rank: order.current_rank,
        target_rank: order.target_rank,
        package: order.package,
        price: order.price || order.total_price,
        whatsapp: order.whatsapp,
        email: order.email,
        status: orderStatus,
        is_express: order.is_express,
        is_premium: order.is_premium,
        notes: order.notes,
      };
      
      // Send all notifications (Telegram admin, WA, Email)
      sendNewOrderNotifications(orderData).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment notification error:", error);
    return NextResponse.json({ error: "Notification processing failed" }, { status: 500 });
  }
}
