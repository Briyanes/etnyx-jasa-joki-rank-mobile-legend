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

const WA_OFFICIAL = "6281515141452";
function waDisclaimer(orderId: string): string {
  const csLink = `https://wa.me/${WA_OFFICIAL}?text=${encodeURIComponent(`Halo min, saya mau tanya soal order ${orderId}`)}`;
  return `\n\n---\n⚠️ _Pesan ini dikirim otomatis, jangan balas pesan ini._\nHubungi CS kami di sini:\n${csLink}`;
}

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

    // Format rank with star/division info
    const STAR_LABELS: Record<number, string> = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };
    const fmtRank = (rank: string, star?: number | null) => {
      if (star && STAR_LABELS[star]) return `${rank} ${STAR_LABELS[star]}`;
      return rank;
    };
    // For per-bintang/gendong orders (same rank), show package_title
    const isPerStar = order.current_rank === order.target_rank && order.package_title;
    const rankDisplay = isPerStar
      ? order.package_title
      : `${fmtRank(order.current_rank, order.current_star)} → ${fmtRank(order.target_rank, order.target_star)}`;
    const targetDisplay = isPerStar
      ? order.package_title
      : fmtRank(order.target_rank, order.target_star);

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

        const uploadUrl = `${siteConfig.url}/payment/manual/?order_id=${order.order_id}`;
        message = `Halo kak!\n\nIni dari *ETNYX*. Kami ingin mengingatkan terkait order yang belum dibayar:\n\n*Order ID:* ${order.order_id}\n*Paket:* ${rankDisplay}\n*Total:* Rp ${order.total_price.toLocaleString("id-ID")}${paymentInfo}\n\nSetelah transfer, upload bukti di sini:\n${uploadUrl}\n\nSilakan selesaikan pembayaran agar order bisa segera diproses ya!\n\n_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}`;
        sent = await sendWhatsAppMessage(order.whatsapp, message, uploadUrl);
        break;
      }

      case "follow_up_credentials": {
        message = `Halo kak!\n\nPembayaran kamu sudah dikonfirmasi.\n\n*Order ID:* ${order.order_id}\n\nKami butuh *data login akun ML* kamu untuk mulai proses boosting:\n\n1. Email/No HP Moonton\n2. Password akun\n\n*Penting:* Jangan login ke akun selama proses joki ya!\n\nKirim data login kamu ke CS kami via link di bawah.\n\n_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}`;
        sent = await sendWhatsAppMessage(order.whatsapp, message);
        break;
      }

      case "follow_up_progress": {
        const progress = order.progress || 0;
        message = `Halo kak!\n\nUpdate progress order kamu:\n\n*Order ID:* ${order.order_id}\n*Progress:* ${progress}%\n*Target:* ${targetDisplay}\n\nBooster kami sedang mengerjakan order kamu. Estimasi selesai dalam waktu dekat!\n\nJangan login ke akun selama proses ya!\n\nTrack order di sini:\n${siteConfig.url}/track/?id=${order.order_id}\n\n_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}`;
        sent = await sendWhatsAppMessage(order.whatsapp, message, `${siteConfig.url}/track/?id=${order.order_id}`);
        break;
      }

      case "notify_completed": {
        const orderData = {
          order_id: order.order_id,
          username: order.username,
          current_rank: order.current_rank,
          target_rank: order.target_rank,
          current_star: order.current_star,
          target_star: order.target_star,
          package: order.package,
          package_title: order.package_title,
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
          current_star: order.current_star,
          target_star: order.target_star,
          package: order.package,
          package_title: order.package_title,
          price: order.total_price,
          whatsapp: order.whatsapp,
          email: order.customer_email,
          status: order.status,
        };
        sent = await sendOrderStartedWA(orderData);
        break;
      }

      case "request_review": {
        const reviewUrl = `${siteConfig.url}/review/?id=${order.order_id}`;
        message = `Halo kak!\n\nTerima kasih sudah menggunakan *ETNYX*!\n\n*Order ID:* ${order.order_id}\n*Rank:* ${rankDisplay}\n\nKami senang banget order kamu sudah selesai!\n\nBoleh minta waktunya sebentar untuk kasih *review*?\n\nKasih review di sini:\n${reviewUrl}\n\nTerima kasih banyak!\n\n_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}`;
        sent = await sendWhatsAppMessage(order.whatsapp, message, reviewUrl);
        break;
      }

      case "reactivation": {
        message = `Halo kak!\n\nKami dari *ETNYX*. Kami lihat order kamu sebelumnya belum selesai:\n\n*Order ID:* ${order.order_id}\n*Paket:* ${rankDisplay}\n\nApakah kamu masih tertarik untuk melanjutkan? Kami siap bantu push rank kamu kapan saja!\n\nHubungi CS kami via link di bawah untuk melanjutkan order.\n\n_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}`;
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
