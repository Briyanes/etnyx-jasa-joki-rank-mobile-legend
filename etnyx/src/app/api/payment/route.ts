import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import crypto from "crypto";

// Get iPaymu settings from database or env
async function getIpaymuSettings() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations")
      .single();
    
    const settings = data?.value || {};
    return {
      apiKey: settings.ipaymuApiKey || process.env.IPAYMU_API_KEY || "",
      va: settings.ipaymuVa || process.env.IPAYMU_VA || "",
      isProduction: settings.ipaymuIsProduction ?? (process.env.IPAYMU_IS_PRODUCTION === "true"),
    };
  } catch {
    return {
      apiKey: process.env.IPAYMU_API_KEY || "",
      va: process.env.IPAYMU_VA || "",
      isProduction: process.env.IPAYMU_IS_PRODUCTION === "true",
    };
  }
}

function generateSignature(body: object, va: string, apiKey: string): string {
  const bodyHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
  const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`;
  return crypto.createHmac("sha256", apiKey).update(stringToSign).digest("hex");
}

function getTimestamp(): string {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { orderId, customerName, customerEmail, customerPhone, itemName } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order already processed" }, { status: 400 });
    }

    // Get iPaymu settings
    const ipaymu = await getIpaymuSettings();
    const apiUrl = ipaymu.isProduction
      ? "https://my.ipaymu.com/api/v2/payment"
      : "https://sandbox.ipaymu.com/api/v2/payment";

    // Use verified price from database
    const verifiedAmount = order.total_price;
    const refId = `ETN-${orderId}-${Date.now()}`;

    const ipaymuBody = {
      product: [itemName || "Joki ML Service"],
      qty: ["1"],
      price: [String(verifiedAmount)],
      amount: String(verifiedAmount),
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?order_id=${orderId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?order_id=${orderId}&transaction_status=cancel`,
      notifyUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/notification`,
      referenceId: refId,
      buyerName: customerName || "Customer",
      buyerPhone: customerPhone || "",
      buyerEmail: customerEmail || "customer@email.com",
    };

    const signature = generateSignature(ipaymuBody, ipaymu.va, ipaymu.apiKey);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        va: ipaymu.va,
        signature,
        timestamp: getTimestamp(),
      },
      body: JSON.stringify(ipaymuBody),
    });

    const data = await response.json();

    if (!response.ok || data.Status !== 200 || !data.Data?.Url) {
      console.error("iPaymu error:", data);
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
    }

    // Save payment token to order
    await supabase
      .from("orders")
      .update({
        payment_token: data.Data.SessionId || null,
        payment_url: data.Data.Url,
        midtrans_order_id: refId,
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      redirect_url: data.Data.Url,
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
