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
    const baseUrl = ipaymu.isProduction
      ? "https://my.ipaymu.com"
      : "https://sandbox.ipaymu.com";

    // Use verified price from database, not client-supplied amount
    const verifiedAmount = order.total_price || amount;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    const ipaymuBody = {
      product: [itemName || "Joki ML Service"],
      qty: ["1"],
      price: [String(verifiedAmount)],
      amount: String(verifiedAmount),
      returnUrl: `${siteUrl}/payment/success`,
      cancelUrl: `${siteUrl}/payment/success`,
      notifyUrl: `${siteUrl}/api/payment/notification`,
      referenceId: orderId,
      buyerName: customerName || "Customer",
      buyerPhone: customerPhone || "",
      buyerEmail: customerEmail || "customer@etnyx.com",
    };

    const bodyStr = JSON.stringify(ipaymuBody);
    const bodyHash = crypto.createHash("sha256").update(bodyStr).digest("hex");
    const stringToSign = `POST:${ipaymu.va}:${bodyHash}:${ipaymu.apiKey}`;
    const signature = crypto.createHmac("sha256", ipaymu.apiKey).update(stringToSign).digest("hex");

    const response = await fetch(`${baseUrl}/api/v2/payment`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "va": ipaymu.va,
        "signature": signature,
        "timestamp": new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14),
      },
      body: bodyStr,
    });

    const data = await response.json();

    if (!response.ok || data.Status !== 200 || !data.Data?.Url) {
      console.error("iPaymu error:", data);
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
    }

    // Save payment info to order
    await supabase
      .from("orders")
      .update({
        payment_url: data.Data.Url,
        payment_token: String(data.Data.SessionId || ""),
        midtrans_order_id: orderId,
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
