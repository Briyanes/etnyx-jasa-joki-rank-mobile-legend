import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { siteConfig } from "@/lib/constants";
import {
  sendWhatsAppMessage,
  sendOrderCompletedWA,
  sendOrderStartedWA,
} from "@/lib/notifications";

// POST /api/admin/orders/follow-up — Send follow-up messages
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { orderId, action } = await request.json();

    if (!orderId || !action) {
      return NextResponse.json({ error: "orderId and action required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.whatsapp) {
      return NextResponse.json({ error: "Customer tidak punya WhatsApp" }, { status: 400 });
    }

    let message = "";
    let sent = false;

    switch (action) {
      case "follow_up_payment": {
        // Fetch active bank accounts from settings
        let paymentInfo = "";
        try {
          const { data: bankSettings } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "bank_accounts")
            .single();
          if (bankSettings?.value && Array.isArray(bankSettings.value)) {
            const activeAccounts = (bankSettings.value as { bank: string; account_number: string; account_name: string; is_active: boolean; category?: string }[])
              .filter((a) => a.is_active);
            if (activeAccounts.length > 0) {
              const bankList = activeAccounts
                .map((a) => `• *${a.bank}*: ${a.account_number} (a.n. ${a.account_name})`)
                .join("\n");
              paymentInfo = `\n\n💳 *Transfer ke salah satu rekening berikut:*\n${bankList}`;
            }
          }
        } catch { /* no bank accounts configured */ }

        const uploadUrl = `${siteConfig.url}/payment/manual/?order_id=${order.order_id}/`;
        message = `Halo kak!\n\nIni dari *ETNYX*. Kami ingin mengingatkan terkait order yang belum dibayar:\n\n*Order ID:* ${order.order_id}\n*Paket:* ${order.current_rank} → ${order.target_rank}\n*Total:* Rp ${order.total_price.toLocaleString("id-ID")}${paymentInfo}\n\nSetelah transfer, upload bukti di sini:\n${uploadUrl}\n\nSilakan selesaikan pembayaran agar order bisa segera diproses ya!\n\nAda pertanyaan? Balas pesan ini aja~\n\n_ETNYX - Push Rank, Tanpa Main_`;
        sent = await sendWhatsAppMessage(order.whatsapp, message);
        break;
      }

      case "follow_up_credentials": {
        message = `Halo kak!\n\nPembayaran kamu sudah dikonfirmasi.\n\n*Order ID:* ${order.order_id}\n\nKami butuh *data login akun ML* kamu untuk mulai proses boosting:\n\n1. Email/No HP Moonton\n2. Password akun\n\n*Penting:* Jangan login ke akun selama proses joki ya!\n\nBalas pesan ini dengan data login kamu.\n\n_ETNYX - Push Rank, Tanpa Main_`;
        sent = await sendWhatsAppMessage(order.whatsapp, message);
        break;
      }

      case "follow_up_progress": {
        const progress = order.progress || 0;
        message = `Halo kak!\n\nUpdate progress order kamu:\n\n*Order ID:* ${order.order_id}\n*Progress:* ${progress}%\n*Target:* ${order.target_rank}\n\nBooster kami sedang mengerjakan order kamu. Estimasi selesai dalam waktu dekat!\n\nJangan login ke akun selama proses ya!\n\nTrack order di sini:\n${siteConfig.url}/track/?id=${order.order_id}/\n\n_ETNYX - Push Rank, Tanpa Main_`;
        sent = await sendWhatsAppMessage(order.whatsapp, message);
        break;
      }

      case "notify_completed": {
        const orderData = {
          order_id: order.order_id,
          username: order.username,
          current_rank: order.current_rank,
          target_rank: order.target_rank,
          package: order.package,
          price: order.total_price,
          whatsapp: order.whatsapp,
          email: order.customer_email,
          status: order.status,
        };
        sent = await sendOrderCompletedWA(orderData);
        break;
      }

      case "notify_started": {
        const orderData = {
          order_id: order.order_id,
          username: order.username,
          current_rank: order.current_rank,
          target_rank: order.target_rank,
          package: order.package,
          price: order.total_price,
          whatsapp: order.whatsapp,
          email: order.customer_email,
          status: order.status,
        };
        sent = await sendOrderStartedWA(orderData);
        break;
      }

      case "request_review": {
        const reviewUrl = `${siteConfig.url}/review/?id=${order.order_id}/`;
        message = `Halo kak!\n\nTerima kasih sudah menggunakan *ETNYX*!\n\n*Order ID:* ${order.order_id}\n*Rank:* ${order.current_rank} → ${order.target_rank}\n\nKami senang banget order kamu sudah selesai!\n\nBoleh minta waktunya sebentar untuk kasih *review*?\n\nKasih review di sini:\n${reviewUrl}\n\nTerima kasih banyak!\n\n_ETNYX - Push Rank, Tanpa Main_`;
        sent = await sendWhatsAppMessage(order.whatsapp, message);
        break;
      }

      case "reactivation": {
        message = `Halo kak!\n\nKami dari *ETNYX*. Kami lihat order kamu sebelumnya belum selesai:\n\n*Order ID:* ${order.order_id}\n*Paket:* ${order.current_rank} → ${order.target_rank}\n\nApakah kamu masih tertarik untuk melanjutkan? Kami siap bantu push rank kamu kapan saja!\n\nBalas pesan ini untuk melanjutkan order.\n\n_ETNYX - Push Rank, Tanpa Main_`;
        sent = await sendWhatsAppMessage(order.whatsapp, message);
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    // Log the follow-up action
    await supabase.from("order_logs").insert({
      order_id: orderId,
      action: `follow_up_${action}`,
      new_value: sent ? "sent" : "failed",
      notes: `Follow-up ${action} via WhatsApp`,
      created_by: auth.user?.email || "admin",
    }).then(() => {});

    logAdminAction({
      admin_email: auth.user!.email,
      action: "create",
      resource_type: "order",
      resource_id: orderId,
      details: `Follow-up ${action}: ${sent ? "sent" : "failed"} to ${order.whatsapp}`,
    });

    return NextResponse.json({ 
      success: sent, 
      message: sent ? "Pesan berhasil dikirim!" : "Gagal mengirim pesan. Cek konfigurasi WhatsApp." 
    });
  } catch (error) {
    console.error("Follow-up error:", error);
    return NextResponse.json({ error: "Gagal mengirim follow-up" }, { status: 500 });
  }
}
