import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";

// ============ Helper: Get Meta WA Settings ============
async function getMetaWASettings() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations")
      .single();
    const v = data?.value || {};
    return {
      phoneNumberId: v.metaWaPhoneNumberId || "",
      accessToken: v.metaWaAccessToken || "",
      verifyToken: v.metaWaVerifyToken || "",
      enabled: !!v.metaWaEnabled,
    };
  } catch {
    return { phoneNumberId: "", accessToken: "", verifyToken: "", enabled: false };
  }
}

// ============ GET: Webhook Verification ============
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const settings = await getMetaWASettings();
  if (!settings.verifyToken) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  if (token !== settings.verifyToken) {
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }

  // Return challenge as plain text (Meta requirement)
  return new NextResponse(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// ============ POST: Incoming Messages ============
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Meta sends various webhook events — only process messages
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ status: "ok" });
    }

    // Handle message status updates (sent, delivered, read)
    if (value.statuses) {
      // Just acknowledge — no action needed
      return NextResponse.json({ status: "ok" });
    }

    // Handle incoming messages
    const messages = value.messages;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: "ok" });
    }

    const settings = await getMetaWASettings();
    if (!settings.enabled || !settings.accessToken || !settings.phoneNumberId) {
      return NextResponse.json({ status: "ok" });
    }

    for (const msg of messages) {
      const from = msg.from; // sender phone number (e.g. "6281234567890")
      const msgType = msg.type;
      const timestamp = msg.timestamp;

      // Only handle text messages for chatbot
      if (msgType === "text") {
        const text = msg.text?.body?.trim() || "";
        await handleIncomingMessage(from, text, settings);
      } else if (msgType === "interactive") {
        // Handle button/list replies
        const buttonReply = msg.interactive?.button_reply?.id;
        const listReply = msg.interactive?.list_reply?.id;
        const replyId = buttonReply || listReply || "";
        if (replyId) {
          await handleIncomingMessage(from, replyId, settings);
        }
      } else {
        // For images, documents, etc. — reply with help
        await sendTextMessage(from, "Maaf, saat ini kami hanya bisa memproses pesan teks. Silakan ketik *menu* untuk melihat pilihan.", settings);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    // Always return 200 to prevent Meta from retrying
    return NextResponse.json({ status: "ok" });
  }
}

// ============ Chatbot Logic ============
async function handleIncomingMessage(
  from: string,
  text: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const lower = text.toLowerCase().trim();

  // Keyword matching
  if (["menu", "help", "halo", "hi", "hai", "start"].includes(lower)) {
    return sendMainMenu(from, settings);
  }

  if (["1", "harga", "price", "paket"].some(k => lower.includes(k))) {
    return sendPricingInfo(from, settings);
  }

  if (["2", "cek", "track", "status", "order"].some(k => lower === k || lower.startsWith("cek ") || lower.startsWith("track "))) {
    // Check if they sent an order ID
    const orderIdMatch = text.match(/ETX-\d{6}-\d{3}/i);
    if (orderIdMatch) {
      return sendOrderStatus(from, orderIdMatch[0].toUpperCase(), settings);
    }
    return sendTextMessage(from, "Silakan kirim Order ID kamu (contoh: *ETX-260101-001*) untuk cek status order.", settings);
  }

  // Direct order ID check
  if (/^ETX-\d{6}-\d{3}$/i.test(lower.replace(/\s/g, ""))) {
    return sendOrderStatus(from, text.trim().toUpperCase(), settings);
  }

  if (["3", "cs", "admin", "bantuan", "komplain"].some(k => lower.includes(k))) {
    return sendCSInfo(from, settings);
  }

  if (["4", "review", "ulasan", "testimoni"].some(k => lower.includes(k))) {
    return sendReviewInfo(from, settings);
  }

  if (["5", "promo", "diskon", "voucher"].some(k => lower.includes(k))) {
    return sendPromoInfo(from, settings);
  }

  // Default: show menu
  return sendMainMenu(from, settings);
}

// ============ Response Builders ============

async function sendMainMenu(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const message = `Halo! Selamat datang di *ETNYX* 👋
Jasa Joki & Gendong Mobile Legends terpercaya!

Silakan pilih menu:

1️⃣ *Harga & Paket*
2️⃣ *Cek Status Order*
3️⃣ *Hubungi CS*
4️⃣ *Tulis Review*
5️⃣ *Info Promo*

Atau kirim *Order ID* langsung (contoh: ETX-260101-001) untuk cek status.

🌐 Website: ${SITE_URL}`;

  return sendTextMessage(from, message, settings);
}

async function sendPricingInfo(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const message = `*DAFTAR HARGA JOKI RANK ML* 💰

Harga mulai dari Rp 5.000 tergantung rank yang dipilih.

*Mode Tersedia:*
• Standard — Harga normal
• Express — Dikerjakan prioritas (+biaya)
• Premium — Booster terbaik (+biaya)

*Layanan:*
• Push Rank (Warrior → Mythic Glory)
• Per Bintang
• Gendong / Duo Boost

📱 Order langsung di website:
${SITE_URL}/order

_Harga ter-update dan kalkulator otomatis tersedia di halaman order._`;

  return sendTextMessage(from, message, settings);
}

async function sendOrderStatus(
  from: string,
  orderId: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  try {
    const supabase = await createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("order_id, status, current_rank, target_rank, package_title, total_price, progress, current_progress_rank, created_at")
      .eq("order_id", orderId)
      .single();

    if (!order) {
      return sendTextMessage(from, `Order *${orderId}* tidak ditemukan. Pastikan Order ID benar ya.`, settings);
    }

    const statusLabels: Record<string, string> = {
      pending: "⏳ Menunggu Pembayaran",
      confirmed: "✅ Dikonfirmasi",
      in_progress: "🔄 Sedang Dikerjakan",
      completed: "🏆 Selesai",
      cancelled: "❌ Dibatalkan",
    };

    const rankDisplay = order.package_title || `${order.current_rank} → ${order.target_rank}`;

    const message = `*STATUS ORDER*

📋 *Order ID:* ${order.order_id}
📊 *Status:* ${statusLabels[order.status] || order.status}
🎮 *Paket:* ${rankDisplay}
💰 *Total:* Rp ${(order.total_price || 0).toLocaleString("id-ID")}
${order.progress > 0 ? `📈 *Progress:* ${order.progress}%` : ""}
${order.current_progress_rank ? `🏅 *Rank Saat Ini:* ${order.current_progress_rank}` : ""}

🔗 Track real-time: ${SITE_URL}/track/?id=${order.order_id}`;

    return sendTextMessage(from, message.trim(), settings);
  } catch {
    return sendTextMessage(from, "Maaf, terjadi kendala saat mengecek order. Silakan coba lagi nanti.", settings);
  }
}

async function sendCSInfo(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const message = `*HUBUNGI CS ETNYX* 📞

Untuk bantuan lebih lanjut, silakan hubungi CS kami:

💬 *WhatsApp CS:* wa.me/6281515141452
🌐 *Website:* ${SITE_URL}
📧 *Email:* support@etnyx.com

Jam operasional: 09.00 - 22.00 WIB
_Response time: ~15 menit_`;

  return sendTextMessage(from, message, settings);
}

async function sendReviewInfo(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const message = `*TULIS REVIEW* ⭐

Sudah selesai order? Bantu kami dengan review kamu!

📝 Tulis review: ${SITE_URL}/review
📖 Lihat review lainnya: ${SITE_URL}/reviews

_Review kamu sangat berarti untuk kami!_`;

  return sendTextMessage(from, message, settings);
}

async function sendPromoInfo(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  try {
    const supabase = await createAdminClient();
    const { data: promos } = await supabase
      .from("promo_codes")
      .select("code, discount_type, discount_value, description, valid_until")
      .eq("is_active", true)
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
      .limit(5);

    if (!promos || promos.length === 0) {
      return sendTextMessage(from, "Saat ini belum ada promo aktif. Follow Instagram kami untuk update promo terbaru! 📱", settings);
    }

    let message = "*PROMO AKTIF* 🎁\n\n";
    for (const p of promos) {
      const discountLabel = p.discount_type === "percentage" ? `${p.discount_value}%` : `Rp ${p.discount_value.toLocaleString("id-ID")}`;
      message += `🏷️ *${p.code}* — Diskon ${discountLabel}\n`;
      if (p.description) message += `   ${p.description}\n`;
      if (p.valid_until) message += `   _Berlaku s/d ${new Date(p.valid_until).toLocaleDateString("id-ID")}_\n`;
      message += "\n";
    }
    message += `Gunakan kode promo saat order di:\n${SITE_URL}/order`;

    return sendTextMessage(from, message.trim(), settings);
  } catch {
    return sendTextMessage(from, "Maaf, tidak bisa mengambil info promo saat ini. Coba lagi nanti ya!", settings);
  }
}

// ============ Meta Cloud API: Send Message ============
async function sendTextMessage(
  to: string,
  message: string,
  settings: { phoneNumberId: string; accessToken: string }
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${settings.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: true, body: message },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Meta WA send error:", err);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Meta WA send failed:", error);
    return false;
  }
}
