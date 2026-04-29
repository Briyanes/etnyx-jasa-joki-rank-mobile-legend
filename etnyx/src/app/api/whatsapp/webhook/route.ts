import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendTelegramMessage, csWaLink, waDisclaimer } from "@/lib/notifications";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import crypto from "crypto";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";
const WA_CS = WHATSAPP_NUMBER;

// Known auto-reply bot numbers to ignore (prevent spam in Telegram alerts)
const BOT_NUMBERS = new Set([
  "628551000185", // INDIRA (Indosat)
  "6285100001",   // Indosat prefix
]);

// Patterns that indicate auto-reply bot messages
const BOT_MESSAGE_PATTERNS = [
  /terima kasih sudah menghubungi/i,
  /silahkan ketik .?hi.?/i,
  /dengan senang hati akan membantu/i,
  /pesan ini dikirim secara otomatis/i,
  /auto.?reply/i,
  /ini adalah pesan otomatis/i,
];

function isBotMessage(from: string, text: string): boolean {
  // Check known bot numbers
  if (BOT_NUMBERS.has(from)) return true;
  for (const prefix of BOT_NUMBERS) {
    if (from.startsWith(prefix)) return true;
  }
  // Check message patterns (need at least 2 matches to avoid false positives)
  const patternMatches = BOT_MESSAGE_PATTERNS.filter(p => p.test(text)).length;
  return patternMatches >= 2;
}

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

  // Check env var first (for initial setup before DB is configured)
  const envVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const settings = await getMetaWASettings();
  const verifyToken = settings.verifyToken || envVerifyToken;

  if (!verifyToken) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  if (token !== verifyToken) {
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
    // Verify webhook signature from Meta
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const signature = request.headers.get("x-hub-signature-256");
    const rawBody = await request.text();

    if (appSecret && signature) {
      const expectedSig = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
      if (signature !== expectedSig) {
        console.warn("WA webhook signature mismatch");
        return NextResponse.json({ status: "ok" }, { status: 403 });
      }
    }

    const body = JSON.parse(rawBody);

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

      // Skip auto-reply bot messages (e.g. INDIRA, carrier bots)
      const msgText = msg.text?.body?.trim() || msg.interactive?.button_reply?.title || "";
      if (isBotMessage(from, msgText)) {
        console.log(`Skipped bot message from ${from}: ${msgText.slice(0, 50)}`);
        continue;
      }

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
        const csLink = `https://wa.me/${WA_CS}?text=${encodeURIComponent("Halo min, saya butuh bantuan")}`;
        await sendTextMessage(from, `Halo kak!\n\nMaaf, saat ini kami hanya bisa memproses pesan teks.\n\nKetik *menu* untuk bantuan otomatis\nAtau hubungi CS langsung:\n${csLink}\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`, settings);
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

  if (["2", "cek", "track", "status"].some(k => lower === k || lower.startsWith("cek ") || lower.startsWith("track "))) {
    // Check if they sent an order ID
    const orderIdMatch = text.match(/ETX-[A-Z0-9]+/i);
    if (orderIdMatch) {
      return sendOrderStatus(from, orderIdMatch[0].toUpperCase(), settings);
    }
    // Auto-detect latest order by phone number
    return sendLatestOrderByPhone(from, settings);
  }

  // Direct order ID check
  if (/^ETX-[A-Z0-9]+$/i.test(lower.replace(/\s/g, ""))) {
    return sendOrderStatus(from, text.trim().toUpperCase(), settings);
  }

  if (["3", "cs", "admin", "bantuan", "komplain"].some(k => lower.includes(k))) {
    return sendCSInfo(from, settings);
  }

  if (["bayar", "pembayaran", "transfer", "upload", "bukti"].some(k => lower.includes(k))) {
    return sendPaymentHelp(from, settings);
  }

  if (["order", "pesan", "beli", "joki", "boost"].some(k => lower.includes(k))) {
    return sendOrderHelp(from, settings);
  }

  if (["4", "review", "ulasan", "testimoni"].some(k => lower.includes(k))) {
    return sendReviewInfo(from, settings);
  }

  if (["5", "promo", "diskon", "voucher"].some(k => lower.includes(k))) {
    return sendPromoInfo(from, settings);
  }

  // Default: unknown message → show menu + forward to CS via Telegram
  await sendUnknownMessage(from, text, settings);
}

// ============ Response Builders ============

async function sendMainMenu(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const csLink = `https://wa.me/${WA_CS}`;
  const message = `Halo kak! 👋\n\nSelamat datang di *ETNYX*!\nJasa Joki & Gendong Mobile Legends terpercaya.\n\nSilakan pilih menu:\n\n1️⃣ *Harga & Paket*\n2️⃣ *Cek Status Order*\n3️⃣ *Hubungi CS*\n4️⃣ *Tulis Review*\n5️⃣ *Info Promo*\n\nAtau kirim *Order ID* langsung (contoh: ETX-MNX6ABC123) untuk cek status.\n\n🌐 ${SITE_URL}\n\n📞 *Butuh bantuan?* Hubungi CS ETNYX:\n${csLink}\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`;

  return sendTextMessage(from, message, settings);
}

async function sendPricingInfo(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const csLink = `https://wa.me/${WA_CS}`;
  const message = `Halo kak!\n\nBerikut info *Harga Joki Rank ML* di ETNYX:\n\nHarga mulai dari Rp 5.000 tergantung rank yang dipilih.\n\n*Mode Tersedia:*\n• Standard — Harga normal\n• Express — Dikerjakan prioritas (+biaya)\n• Premium — Booster terbaik (+biaya)\n\n*Layanan:*\n• Push Rank (Warrior → Mythic Glory)\n• Per Bintang\n• Gendong / Duo Boost\n\n📱 *Order & kalkulator harga:*\n${SITE_URL}/order\n\n📞 *Butuh bantuan?* Hubungi CS ETNYX:\n${csLink}\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`;

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

    const message = `Halo kak!\n\nBerikut status order kamu:\n\n📋 *Order ID:* ${order.order_id}\n📊 *Status:* ${statusLabels[order.status] || order.status}\n🎮 *Paket:* ${rankDisplay}\n💰 *Total:* Rp ${(order.total_price || 0).toLocaleString("id-ID")}\n${order.progress > 0 ? `📈 *Progress:* ${order.progress}%\n` : ""}${order.current_progress_rank ? `🏅 *Rank Saat Ini:* ${order.current_progress_rank}\n` : ""}\n🔗 Track real-time:\n${SITE_URL}/track/?id=${order.order_id}${waDisclaimer(order.order_id)}\n\n_ETNYX - Push Rank, Tanpa Main_`;

    return sendTextMessage(from, message.trim(), settings);
  } catch {
    return sendTextMessage(from, "Maaf, terjadi kendala saat mengecek order. Silakan coba lagi nanti.", settings);
  }
}

async function sendLatestOrderByPhone(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  try {
    const supabase = await createAdminClient();
    // Normalize phone: from is like "6281234567890"
    const phoneVariants = [from, `+${from}`, `0${from.slice(2)}`];

    const { data: orders } = await supabase
      .from("orders")
      .select("order_id, status, current_rank, target_rank, package_title, total_price, progress, current_progress_rank")
      .in("whatsapp", phoneVariants)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!orders || orders.length === 0) {
      const csLink = `https://wa.me/${WA_CS}`;
      return sendTextMessage(from, `Halo kak!\n\nBelum ada order yang terdaftar dengan nomor kamu.\n\n📱 Order sekarang di:\n${SITE_URL}/order\n\n📞 *Butuh bantuan?* Hubungi CS ETNYX:\n${csLink}\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`, settings);
    }

    const statusLabels: Record<string, string> = {
      pending: "⏳ Menunggu Bayar",
      confirmed: "✅ Dikonfirmasi",
      in_progress: "🔄 Dikerjakan",
      completed: "🏆 Selesai",
      cancelled: "❌ Dibatalkan",
    };

    let message = `Halo kak!\n\nBerikut *Order Terbaru* kamu:\n\n`;

    for (const o of orders) {
      const rankDisplay = o.package_title || `${o.current_rank} → ${o.target_rank}`;
      message += `📋 *${o.order_id}*\n`;
      message += `   ${statusLabels[o.status] || o.status} | ${rankDisplay}\n`;
      message += `   💰 Rp ${(o.total_price || 0).toLocaleString("id-ID")}`;
      if (o.progress > 0) message += ` | 📈 ${o.progress}%`;
      message += "\n\n";
    }

    message += `🔗 Kirim *Order ID* untuk detail lengkap.\nContoh: *${orders[0].order_id}*`;
    message += `${waDisclaimer(orders[0].order_id)}\n\n_ETNYX - Push Rank, Tanpa Main_`;

    return sendTextMessage(from, message.trim(), settings);
  } catch {
    return sendTextMessage(from, "Maaf, tidak bisa mengecek order saat ini. Coba kirim Order ID langsung ya (contoh: *ETX-MNX6ABC123*).", settings);
  }
}

async function sendCSInfo(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const csLink = `https://wa.me/${WA_CS}`;

  const message = `Halo kak!\n\nUntuk bantuan lebih lanjut, hubungi CS kami langsung:\n\n💬 *WhatsApp CS:* ${csLink}\n🌐 *Website:* ${SITE_URL}\n\nJam operasional: 09.00 - 22.00 WIB\n_Response time: ~15 menit_\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`;

  return sendTextMessage(from, message, settings);
}

async function sendReviewInfo(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const csLink = `https://wa.me/${WA_CS}`;
  const message = `Halo kak!\n\nSudah selesai order? Bantu kami dengan *review* kamu!\n\n📝 *Tulis review:* ${SITE_URL}/review\n📖 *Lihat review lainnya:* ${SITE_URL}/reviews\n\n_Review kamu sangat berarti untuk kami!_\n\n📞 *Butuh bantuan?* Hubungi CS ETNYX:\n${csLink}\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`;

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

    const csLink = `https://wa.me/${WA_CS}`;
    const footer = `\n\n📞 *Butuh bantuan?* Hubungi CS ETNYX:\n${csLink}\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`;

    if (!promos || promos.length === 0) {
      return sendTextMessage(from, `Halo kak!\n\nSaat ini belum ada promo aktif.\nFollow Instagram kami untuk update promo terbaru! 📱${footer}`, settings);
    }

    let message = `Halo kak!\n\nBerikut *Promo Aktif* saat ini:\n\n`;
    for (const p of promos) {
      const discountLabel = p.discount_type === "percentage" ? `${p.discount_value}%` : `Rp ${p.discount_value.toLocaleString("id-ID")}`;
      message += `🏷️ *${p.code}* — Diskon ${discountLabel}\n`;
      if (p.description) message += `   ${p.description}\n`;
      if (p.valid_until) message += `   _Berlaku s/d ${new Date(p.valid_until).toLocaleDateString("id-ID")}_\n`;
      message += "\n";
    }
    message += `Gunakan kode promo saat order di:\n${SITE_URL}/order`;
    message += footer;

    return sendTextMessage(from, message.trim(), settings);
  } catch {
    return sendTextMessage(from, "Maaf, tidak bisa mengambil info promo saat ini. Coba lagi nanti ya!", settings);
  }
}

async function sendPaymentHelp(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  try {
    const supabase = await createAdminClient();
    const phoneVariants = [from, `+${from}`, `0${from.slice(2)}`];
    const { data: orders } = await supabase
      .from("orders")
      .select("order_id, status, total_price, package_title, current_rank, target_rank")
      .in("whatsapp", phoneVariants)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    const csLink = `https://wa.me/${WA_CS}`;

    if (orders && orders.length > 0) {
      const o = orders[0];
      const paymentLink = `${SITE_URL}/payment/manual/?order_id=${o.order_id}`;
      const rankDisplay = o.package_title || `${o.current_rank} → ${o.target_rank}`;
      const message = `Halo kak!\n\nAda order yang menunggu pembayaran:\n\n📋 *Order ID:* ${o.order_id}\n🎮 *Paket:* ${rankDisplay}\n💰 *Total:* Rp ${(o.total_price || 0).toLocaleString("id-ID")}\n\n💳 *Upload bukti transfer di sini:*\n${paymentLink}\n\n📞 *Butuh bantuan?* Hubungi CS ETNYX:\n${csLink}\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`;
      return sendTextMessage(from, message, settings);
    }

    const message = `Halo kak!\n\nUntuk melakukan pembayaran, kamu perlu membuat order terlebih dahulu.\n\n📱 *Order & pilih paket di sini:*\n${SITE_URL}/order\n\nSetelah order dibuat, kamu akan mendapat link untuk upload bukti transfer atau bayar via iPaymu.\n\n📞 *Butuh bantuan?* Hubungi CS ETNYX:\n${csLink}\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`;
    return sendTextMessage(from, message, settings);
  } catch {
    return sendTextMessage(from, "Maaf, tidak bisa mengecek info pembayaran saat ini. Coba lagi nanti ya!", settings);
  }
}

async function sendOrderHelp(
  from: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const csLink = `https://wa.me/${WA_CS}`;
  const message = `Halo kak!\n\nIngin order joki rank ML? 🎮\n\n*Cara order:*\n1️⃣ Buka ${SITE_URL}/order\n2️⃣ Pilih paket & rank\n3️⃣ Isi data akun\n4️⃣ Pilih metode bayar\n5️⃣ Selesaikan pembayaran\n\n*Layanan tersedia:*\n• Push Rank (Warrior → Mythic Glory)\n• Per Bintang\n• Gendong / Duo Boost\n\n*Mode:* Standard, Express, Premium\n\n📞 *Butuh bantuan?* Hubungi CS ETNYX:\n${csLink}\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`;
  return sendTextMessage(from, message, settings);
}

async function sendUnknownMessage(
  from: string,
  text: string,
  settings: { phoneNumberId: string; accessToken: string }
) {
  const csLink = `https://wa.me/${WA_CS}?text=${encodeURIComponent("Halo min, saya butuh bantuan")}`;

  // Reply to customer with menu + CS redirect
  const message = `Halo kak!\n\nMaaf, saya belum bisa bantu soal itu 🙏\n\nKamu bisa:\n• Ketik *menu* untuk pilihan bantuan otomatis\n• Kirim *Order ID* untuk cek status order\n• Atau hubungi CS kami langsung:\n  ${csLink}\n\n_Pesan kamu sudah diteruskan ke tim CS kami._\n\n_ETNYX - Push Rank, Tanpa Main_\n\n[ Ini adalah pesan otomatis ]\n💬 _Balas *menu* untuk bantuan otomatis_`;

  await sendTextMessage(from, message, settings);

  // Forward to Telegram alert/admin group so CS knows
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations")
      .single();
    const alertGroupId = data?.value?.telegramAlertGroupId || data?.value?.telegramAdminGroupId;
    if (alertGroupId) {
      const telegramMsg = `💬 <b>PESAN WA MASUK</b>\n\n<b>Dari:</b> +${from}\n<b>Pesan:</b> ${text.slice(0, 500)}\n\n<i>Bot tidak paham — customer perlu dibalas via WA CS.</i>`;
      await sendTelegramMessage(alertGroupId, telegramMsg);
    }
  } catch (err) {
    console.error("Failed to forward unknown WA message to Telegram:", err);
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
