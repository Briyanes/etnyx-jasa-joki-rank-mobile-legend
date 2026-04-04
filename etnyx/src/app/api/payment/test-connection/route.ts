import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { serverKey, isProduction: isProd } = await req.json();

    if (!serverKey) {
      return NextResponse.json({ success: false, error: "Server Key belum diisi" }, { status: 400 });
    }

    // Use explicit isProduction from dashboard; fallback to key prefix detection
    const isProduction = isProd ?? !serverKey.startsWith("SB-");
    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const url = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: `TEST-${Date.now()}`, gross_amount: 10000 },
        customer_details: { first_name: "Test", email: "test@test.com", phone: "+6281234567890" },
        item_details: [{ id: "test", price: 10000, quantity: 1, name: "Test Connection" }],
      }),
    });

    const data = await res.json();

    if (res.ok && data.redirect_url) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({
      success: false,
      error: data.error_messages?.join(", ") || `HTTP ${res.status}`,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Network error",
    }, { status: 500 });
  }
}
