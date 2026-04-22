import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendPaymentConfirmedWA, notifyWorkerConfirmedOrder, notifyAdminPaymentConfirmed, sendPaymentConfirmedEmail } from "@/lib/notifications";
import { sendMetaCAPI } from "@/lib/meta-capi";

// GET handler for webhook URL verification (Moota "Check URL")
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "payment-notification" });
}

// POST: Moota  { transactions: [{ uuid, amount, type, bank_type, note, status }] }webhook 
export async function POST(request: NextRequest) {
  try {
    let body: { transactions?: MootaTransaction[] } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body = Moota test ping
    }

    const { transactions } = body;

    // Return 200 for test pings (Moota "Check URL" sends empty body)
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ success: true, message: "Webhook OK" });
    }

    // Validate webhook token ( only checked on real calls)optional 
    const webhookToken = request.headers.get("x-moota-token") ?? request.headers.get("authorization");
    const expectedToken = process.env.MOOTA_WEBHOOK_TOKEN;
    if (expectedToken && webhookToken !== expectedToken && webhookToken !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();

    for (const tx of transactions) {
      // Only process incoming (credit) successful transactions
      if (tx.type !== "CR" && tx.type !== "credit") continue;
      if (tx.status !== "success" && tx.status !== "approved") continue;

      // Find order by moota transaction UUID or order_id in note
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .or(`moota_transaction_id.eq.${tx.uuid},order_id.eq.${tx.note}`)
        .single();

      if (!order) {
        console.warn(`Moota webhook: order not found for uuid=${tx.uuid} note=${tx.note}`);
        continue;
      }

      if (order.payment_status === "paid") continue;

      // Verify amount (allow small tolerance for rounding)
      const paidAmount = Number(tx.amount);
      if (paidAmount < order.total_price) {
        console.warn(`Moota webhook: underpaid for ${order.order_id}: paid ${paidAmount}, expected ${order.total_price}`);
        continue;
      }

      // Mark order as paid
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_type: tx.bank_type,
          status: "confirmed",
          paid_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

            const { error: logError } = await supabase.from("payment_logs").insert({
        order_id: order.id,
        midtrans_order_id: tx.uuid,
        transaction_status: tx.status,
        payment_type: tx.bank_type,
        gross_amount: tx.amount,
        raw_response: tx as unknown as Record<string, unknown>,
      });
      if (logError) console.error("payment_logs insert:", logError);

      console.log(`Moota: Order ${order.order_id} confirmed (Rp ${tx.amount})`);

      // Send notifications
      const orderData = {
        order_id: order.order_id,
        username: order.username,
        current_rank: order.current_rank,
        target_rank: order.target_rank,
        package: order.package,
        price: order.total_price,
        whatsapp: order.whatsapp,
        email: order.customer_email,
        status: "confirmed",
        is_express: order.is_express,
        is_premium: order.is_premium,
        notes: order.notes,
        db_id: order.id,
      };

      Promise.allSettled([
        sendPaymentConfirmedWA(orderData),
        notifyWorkerConfirmedOrder(orderData),
        notifyAdminPaymentConfirmed(orderData),
        sendPaymentConfirmedEmail(orderData),
      ]).catch(console.error);

      // Meta Conversions API
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
      } catch { /* pixel not configured */ }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Moota webhook error:", error);
    return NextResponse.json({ error: "Notification processing failed" }, { status: 500 });
  }
}

interface MootaTransaction {
  uuid: string;
  amount: number;
  type: string;
  bank_type: string;
  note: string;
  status: string;
  created_at?: string;
}
