import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { orderId, amount, customerName, customerEmail, customerPhone, itemName } = body;

    if (!orderId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, total_price, status")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order already processed" }, { status: 400 });
    }

    // Use verified price from database, not client-supplied amount
    const verifiedAmount = order.total_price || amount;

    // Prepare Midtrans request
    const transactionDetails = {
      order_id: `ETN-${orderId}-${Date.now()}`,
      gross_amount: verifiedAmount,
    };

    const customerDetails = {
      first_name: customerName || "Customer",
      email: customerEmail || "customer@email.com",
      phone: customerPhone || "",
    };

    const itemDetails = [
      {
        id: orderId,
        price: verifiedAmount,
        quantity: 1,
        name: itemName || "Joki ML Service",
      },
    ];

    const payload = {
      transaction_details: transactionDetails,
      customer_details: customerDetails,
      item_details: itemDetails,
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?order_id=${orderId}`,
      },
    };

    // Create Midtrans transaction
    const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");

    const response = await fetch(MIDTRANS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Midtrans error:", data);
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
    }

    // Save payment token to order
    await supabase
      .from("orders")
      .update({ 
        payment_token: data.token,
        payment_url: data.redirect_url,
        midtrans_order_id: transactionDetails.order_id
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      token: data.token,
      redirect_url: data.redirect_url,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}

// Get payment status
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
      .select("status, payment_status, midtrans_order_id")
      .eq("order_id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      status: order.status,
      payment_status: order.payment_status 
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
