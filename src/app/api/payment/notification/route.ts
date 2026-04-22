import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// Moota mengirim webhook: { transactions: [{ uuid, amount, type, bank_type, note, status, ... }] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validasi webhook token dari Moota (opsional, set di header X-Moota-Token)
    const webhookToken = request.headers.get("x-moota-token") ?? request.headers.get("authorization");
    const expectedToken = process.env.MOOTA_WEBHOOK_TOKEN;
    if (expectedToken && webhookToken !== expectedToken && webhookToken !== `Bearer ${expectedToken}`) {
      console.warn("Moota webhook: invalid token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactions } = body as { transactions: MootaTransaction[] };

    // Moota "Check URL" test sends empty body — return 200 so validation passes
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ success: true, message: "Webhook OK" });
    }

    const supabase = await createAdminClient();

    for (const tx of transactions) {
      // Hanya proses transaksi kredit (masuk) yang sukses
      if (tx.type !== "CR" && tx.type !== "credit") continue;
      if (tx.status !== "success" && tx.status !== "approved") continue;

      // Cari order berdasarkan moota_transaction_id atau note (order_id)
      const { data: order } = await supabase
        .from("orders")
        .select("id, order_id, status, payment_status, total_price")
        .or(`moota_transaction_id.eq.${tx.uuid},order_id.eq.${tx.note}`)
        .single();

      if (!order) {
        console.warn(`Moota webhook: order tidak ditemukan untuk uuid=${tx.uuid} note=${tx.note}`);
        continue;
      }

      if (order.payment_status === "paid") {
        continue; // Sudah diproses
      }

      // Update order: tandai sebagai paid dan konfirmasi
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_type: tx.bank_type,
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      // Simpan log pembayaran
      await supabase.from("payment_logs").insert({
        order_id: order.id,
        midtrans_order_id: tx.uuid, // pakai kolom yg ada untuk simpan moota uuid
        transaction_status: tx.status,
        payment_type: tx.bank_type,
        gross_amount: tx.amount,
        raw_response: tx as unknown as Record<string, unknown>,
      });

      console.log(`Moota webhook: Order ${order.order_id} terkonfirmasi (Rp ${tx.amount})`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Moota webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
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
