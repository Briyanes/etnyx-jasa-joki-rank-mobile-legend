import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import crypto from "crypto";
import { sendPaymentConfirmedWA, notifyWorkerConfirmedOrder } from "@/lib/notifications";
import { sendMetaCAPI } from "@/lib/meta-capi";

// Get iPaymu settings from DB or env
async function getIpaymuSettings(): Promise<{ apiKey: string; va: string; isProduction: boolean }> {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations")
      .single();
    
    return {
      apiKey: data?.value?.ipaymuApiKey || process.env.IPAYMU_API_KEY || "",
      va: data?.value?.ipaymuVa || process.env.IPAYMU_VA || "",
      isProduction: data?.value?.ipaymuIsProduction ?? (process.env.IPAYMU_IS_PRODUCTION === "true"),
    };
  } catch {
    return {
      apiKey: process.env.IPAYMU_API_KEY || "",
      va: process.env.IPAYMU_VA || "",
      isProduction: process.env.IPAYMU_IS_PRODUCTION === "true",
    };
  }
}

// Verify iPaymu callback by checking transaction status via API
async function verifyIpaymuTransaction(trxId: string | number, settings: { apiKey: string; va: string; isProduction: boolean }): Promise<Record<string, unknown> | null> {
  const url = settings.isProduction
    ? "https://my.ipaymu.com/api/v2/transaction"
    : "https://sandbox.ipaymu.com/api/v2/transaction";

  const body = { transactionId: String(trxId) };
  const bodyHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
  const stringToSign = `POST:${settings.va}:${bodyHash}:${settings.apiKey}`;
  const signature = crypto.createHmac("sha256", settings.apiKey).update(stringToSign).digest("hex");

  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      va: settings.va,
      signature,
      timestamp,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (res.ok && data.Status === 200 && data.Data) {
    return data.Data as Record<string, unknown>;
  }
  return null;
}

// GET handler for URL verification
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "payment-notification" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      trx_id,
      sid,
      reference_id,
      status_code,
      status,
      via,
    } = body;

    // iPaymu sends: trx_id, sid, reference_id, status_code, status, via, channel, amount
    if (!trx_id && !reference_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const settings = await getIpaymuSettings();

    // Verify transaction with iPaymu API (server-side check)
    const verifiedTrx = await verifyIpaymuTransaction(trx_id, settings);
    if (!verifiedTrx) {
      console.error("iPaymu transaction verification failed for trx_id:", trx_id);
      return NextResponse.json({ error: "Transaction verification failed" }, { status: 403 });
    }

    const supabase = await createAdminClient();

    // Find order by reference ID (stored in midtrans_order_id field)
    const refId = reference_id || String(verifiedTrx.ReferenceId || "");
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("midtrans_order_id", refId)
      .single();

    if (error || !order) {
      console.error("Order not found for iPaymu ref:", refId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Determine payment status from iPaymu status_code
    // iPaymu status_code: 1 = success, 0 = pending, -1 = expired/failed
    const ipaymuStatusCode = Number(verifiedTrx.StatusCode ?? status_code);
    const ipaymuStatus = String(verifiedTrx.Status ?? status ?? "").toLowerCase();

    // Idempotency: skip if order already paid
    if (order.payment_status === "paid" && ipaymuStatusCode === 1) {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    let paymentStatus = "pending";
    let orderStatus = order.status;

    if (ipaymuStatusCode === 1 || ipaymuStatus === "berhasil" || ipaymuStatus === "success") {
      // Verify payment amount
      const paidAmount = Number(verifiedTrx.Amount ?? body.amount ?? 0);
      if (paidAmount < order.total_price) {
        console.error(`Amount mismatch for ${refId}: paid ${paidAmount}, expected ${order.total_price}`);
        paymentStatus = "underpaid";
      } else {
        paymentStatus = "paid";
        orderStatus = "confirmed";
      }
    } else if (ipaymuStatusCode === 0 || ipaymuStatus === "pending") {
      paymentStatus = "pending";
    } else {
      // -1 or other = expired/failed/canceled
      paymentStatus = "failed";
    }

    const paymentType = String(via || verifiedTrx.Channel || verifiedTrx.Via || "ipaymu");

    // Update order
    await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        payment_type: paymentType,
        status: orderStatus,
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
        confirmed_at: paymentStatus === "paid" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // Send notifications when payment is confirmed
    if (paymentStatus === "paid" && order.status !== "confirmed") {
      const orderData = {
        order_id: order.order_id,
        username: order.username,
        current_rank: order.current_rank,
        target_rank: order.target_rank,
        package: order.package,
        price: order.total_price,
        whatsapp: order.whatsapp,
        email: order.customer_email,
        status: orderStatus,
        is_express: order.is_express,
        is_premium: order.is_premium,
        notes: order.notes,
        db_id: order.id,
      };
      
      // Send payment confirmed notifications (WA + Telegram worker group)
      Promise.allSettled([
        sendPaymentConfirmedWA(orderData),
        notifyWorkerConfirmedOrder(orderData),
      ]).catch(console.error);

      // Fire Meta Conversions API (server-side dedup with client pixel)
      try {
        const { data: pixelSettings } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "tracking_pixels")
          .single();

        if (pixelSettings?.value) {
          sendMetaCAPI(
            {
              eventName: "Purchase",
              eventId: `purchase_${order.order_id}`,
              value: order.total_price || 0,
              currency: "IDR",
              email: order.customer_email,
              phone: order.whatsapp,
              orderId: order.order_id,
              ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
              userAgent: request.headers.get("user-agent") || undefined,
            },
            pixelSettings.value
          ).catch(console.error);
        }
      } catch { /* pixel settings not configured */ }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment notification error:", error);
    return NextResponse.json({ error: "Notification processing failed" }, { status: 500 });
  }
}
