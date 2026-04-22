import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const MOOTA_API_TOKEN = process.env.MOOTA_API_TOKEN || "";
const MOOTA_API_URL = "https://app.moota.co/api/v2";
const MOOTA_BANK_TYPE = process.env.MOOTA_BANK_TYPE || "bca";
const MOOTA_EXPIRED_MINUTES = parseInt(process.env.MOOTA_EXPIRED_MINUTES || "1440"); // 24 jam

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, total_price, status, payment_status")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order already processed" }, { status: 400 });
    }

    // Buat transaksi Moota Payment Gateway
    const response = await fetch(`${MOOTA_API_URL}/pg/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MOOTA_API_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: order.total_price,
        bank_type: MOOTA_BANK_TYPE,
        note: order.order_id,
        expired: MOOTA_EXPIRED_MINUTES,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Moota PG error:", data);
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
    }

    // Simpan info transaksi Moota ke order
    await supabase
      .from("orders")
      .update({
        moota_transaction_id: data.uuid,
        bank_account_number: data.account_number,
        bank_type: MOOTA_BANK_TYPE,
        payment_status: "unpaid",
        payment_expired_at: data.expired_time,
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      transaction: {
        uuid: data.uuid,
        account_number: data.account_number,
        bank_type: data.bank_type ?? MOOTA_BANK_TYPE,
        amount: data.amount ?? order.total_price,
        expired_time: data.expired_time,
      },
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}

// Cek status pembayaran order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("status, payment_status, bank_account_number, bank_type, payment_expired_at, total_price")
      .eq("order_id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: order.status,
      payment_status: order.payment_status,
      bank_account_number: order.bank_account_number,
      bank_type: order.bank_type,
      payment_expired_at: order.payment_expired_at,
      amount: order.total_price,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
