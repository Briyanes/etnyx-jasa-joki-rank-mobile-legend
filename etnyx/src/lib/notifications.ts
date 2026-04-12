import { createAdminClient } from "./supabase-server";
import { WHATSAPP_NUMBER } from "./constants";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";
const WA_OFFICIAL = WHATSAPP_NUMBER;

/** Disclaimer footer for bot-sent WA messages */
export function waDisclaimer(orderId: string): string {
  const csLink = `https://wa.me/${WA_OFFICIAL}?text=${encodeURIComponent(`Halo min, saya mau tanya soal order ${orderId}`)}`;
  return `\n\n---\n⚠️ _Pesan ini dikirim otomatis, jangan balas pesan ini._\nHubungi CS kami di sini:\n${csLink}`;
}

// ============ Types ============
interface OrderData {
  order_id: string;
  username: string;
  current_rank: string;
  target_rank: string;
  current_star?: number | null;
  target_star?: number | null;
  package: string;
  package_title?: string | null;
  price: number;
  whatsapp?: string;
  email?: string;
  status: string;
  is_express?: boolean;
  is_premium?: boolean;
  notes?: string;
  created_at?: string;
}

interface IntegrationSettings {
  resendApiKey?: string;
  resendFromEmail?: string;
  fonnteApiToken?: string;
  fonnteDeviceId?: string;
  telegramBotToken?: string;
  telegramAdminGroupId?: string;
  telegramWorkerGroupId?: string;
  telegramReviewGroupId?: string;
  telegramReportGroupId?: string;
  metaWaPhoneNumberId?: string;
  metaWaAccessToken?: string;
  metaWaVerifyToken?: string;
  metaWaEnabled?: boolean;
}

// ============ Helper: Get Integration Settings ============
async function getIntegrationSettings(): Promise<IntegrationSettings> {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations")
      .single();
    
    return data?.value || {};
  } catch {
    return {};
  }
}

// ============ Format Helpers ============
function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

function formatRank(rank: string, star?: number | null): string {
  const labels: Record<string, string> = {
    warrior: "Warrior",
    elite: "Elite",
    master: "Master",
    grandmaster: "Grandmaster",
    epic: "Epic",
    legend: "Legend",
    mythic: "Mythic",
    mythicgrading: "Mythic Grading",
    mythichonor: "Mythic Honor",
    mythicglory: "Mythic Glory",
    mythicimmortal: "Mythic Immortal",
  };
  const starLabels: Record<number, string> = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };
  const label = labels[rank?.toLowerCase()] || rank;
  if (star && starLabels[star]) return `${label} ${starLabels[star]}`;
  return label;
}

// For per-bintang/gendong orders (same rank), show package_title instead of "Rank → Rank"
function formatRankDisplay(order: OrderData): string {
  if (order.current_rank === order.target_rank && order.package_title) {
    return order.package_title;
  }
  return `${formatRank(order.current_rank, order.current_star)} → ${formatRank(order.target_rank, order.target_star)}`;
}

function formatTargetDisplay(order: OrderData): string {
  if (order.current_rank === order.target_rank && order.package_title) {
    return order.package_title;
  }
  return formatRank(order.target_rank, order.target_star);
}

// ============ Notification Preferences ============
export async function getNotificationPreferences(whatsapp: string): Promise<{
  whatsapp_order_updates: boolean;
  whatsapp_promotions: boolean;
  email_order_updates: boolean;
  email_promotions: boolean;
}> {
  const defaults = {
    whatsapp_order_updates: true,
    whatsapp_promotions: false,
    email_order_updates: true,
    email_promotions: true,
  };
  try {
    const supabase = await createAdminClient();
    // Find customer by phone
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("whatsapp", whatsapp)
      .single();
    if (!customer) return defaults;

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("whatsapp_order_updates, whatsapp_promotions, email_order_updates, email_promotions")
      .eq("customer_id", customer.id)
      .single();
    if (!prefs) return defaults;
    return { ...defaults, ...prefs };
  } catch {
    return defaults;
  }
}

// ============ TELEGRAM ============
export async function sendTelegramMessage(
  chatId: string,
  message: string,
  botToken?: string,
  replyMarkup?: Record<string, unknown>
): Promise<boolean> {
  const settings = botToken ? { telegramBotToken: botToken } : await getIntegrationSettings();
  const token = settings.telegramBotToken;

  if (!token || !chatId) {
    console.warn("Telegram not configured. Chat ID:", chatId);
    return false;
  }

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    };
    if (replyMarkup) body.reply_markup = replyMarkup;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram error:", data.description);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

export async function notifyAdminNewOrder(order: OrderData & { db_id?: string }): Promise<boolean> {
  const settings = await getIntegrationSettings();
  const chatId = settings.telegramAdminGroupId;

  if (!chatId) return false;

  const message = `
📢 <b>ORDER BARU!</b>

<b>Order ID:</b> ${order.order_id}
<b>Username:</b> ${order.username}
<b>WhatsApp:</b> ${order.whatsapp || "-"}

<b>Detail Order:</b>
• Rank: ${formatRankDisplay(order)}
• Paket: ${order.package}
${order.is_express ? "EXPRESS" : ""}${order.is_premium ? " PREMIUM" : ""}

<b>Total:</b> ${formatRupiah(order.price)}

<b>Catatan:</b> ${order.notes || "-"}

<b>Status:</b> Menunggu Konfirmasi
`.trim();

  // Add action buttons if we have the database ID
  const replyMarkup = order.db_id ? {
    inline_keyboard: [
      [
        { text: "Konfirmasi", callback_data: `confirm:${order.db_id}` },
        { text: "Tolak", callback_data: `reject:${order.db_id}` },
      ],
      [{ text: "Detail", callback_data: `detail:${order.db_id}` }],
    ],
  } : undefined;

  return sendTelegramMessage(chatId, message, undefined, replyMarkup);
}

export async function notifyWorkerConfirmedOrder(order: OrderData): Promise<boolean> {
  const settings = await getIntegrationSettings();
  const chatId = settings.telegramWorkerGroupId;

  if (!chatId) return false;

  const message = `
📢 <b>ORDER DIKONFIRMASI!</b>

<b>Order ID:</b> ${order.order_id}
<b>Username:</b> ${order.username}

<b>Detail Order:</b>
• Rank: ${formatRankDisplay(order)}
• Paket: ${order.package}
${order.is_express ? "EXPRESS - PRIORITAS!" : ""}${order.is_premium ? " PREMIUM" : ""}

<b>Catatan:</b> ${order.notes || "-"}

Segera kerjakan order ini!
`.trim();

  return sendTelegramMessage(chatId, message);
}

export async function notifyAdminOrderCompleted(order: OrderData & { db_id?: string }): Promise<boolean> {
  const settings = await getIntegrationSettings();
  const chatId = settings.telegramAdminGroupId;
  if (!chatId) return false;

  const message = `
📢 <b>ORDER SELESAI!</b>

<b>Order ID:</b> ${order.order_id}
<b>Username:</b> ${order.username}
<b>WhatsApp:</b> ${order.whatsapp || "-"}

<b>Detail:</b>
• Rank: ${formatRankDisplay(order)}
• Paket: ${order.package}

<b>Total:</b> ${formatRupiah(order.price)}

Review link sudah dikirim ke customer via WA.
`.trim();

  const replyMarkup = order.db_id ? {
    inline_keyboard: [
      [{ text: "Detail", callback_data: `detail:${order.db_id}` }],
    ],
  } : undefined;

  return sendTelegramMessage(chatId, message, undefined, replyMarkup);
}

// ============ WHATSAPP (Fonnte) ============

// ============ TELEGRAM: Reviews & Worker Reports ============
export async function notifyNewReview(review: {
  order_id: string;
  service_rating: number;
  service_comment?: string | null;
  worker_rating?: number | null;
  customer_name?: string | null;
  rank_from?: string | null;
  rank_to?: string | null;
  review_id?: string;
}): Promise<boolean> {
  const settings = await getIntegrationSettings();
  const reviewChatId = settings.telegramReviewGroupId;
  if (!reviewChatId) return false;

  const stars = "★".repeat(review.service_rating);
  const message = `
📢 <b>REVIEW BARU!</b>

<b>Order:</b> ${review.order_id}
<b>Customer:</b> ${review.customer_name || "-"}
<b>Rank:</b> ${review.rank_from ? formatRank(review.rank_from) : "-"} → ${review.rank_to ? formatRank(review.rank_to) : "-"}

<b>Rating Layanan:</b> ${stars} (${review.service_rating}/5)
${review.worker_rating ? `<b>Rating Worker:</b> ${"★".repeat(review.worker_rating)} (${review.worker_rating}/5)` : ""}
${review.service_comment ? `\n"${review.service_comment}"` : ""}
`.trim();

  const replyMarkup = review.review_id ? {
    inline_keyboard: [
      [
        { text: "Show", callback_data: `review_toggle:${review.review_id}:show` },
        { text: "Hide", callback_data: `review_toggle:${review.review_id}:hide` },
      ],
    ],
  } : undefined;

  // Send to review group only (not admin/new order group)
  if (reviewChatId) {
    await sendTelegramMessage(reviewChatId, message, undefined, replyMarkup);
  }

  return true;
}

export async function notifyWorkerReport(report: {
  order_id: string;
  report_type: string;
  report_detail?: string | null;
  customer_name?: string | null;
  customer_whatsapp?: string | null;
  worker_rating?: number | null;
  worker_name?: string | null;
  review_id?: string;
}): Promise<boolean> {
  const settings = await getIntegrationSettings();
  const reportChatId = settings.telegramReportGroupId;
  if (!reportChatId) return false;

  const typeLabels: Record<string, string> = {
    cheating: "Bermain curang / cheat",
    offering_services: "Menawarkan jasa di luar ETNYX",
    rude: "Kasar / tidak sopan",
    account_issue: "Masalah akun",
    other: "Lainnya",
  };

  const message = `
📢 <b>WORKER REPORT!</b>

<b>Order:</b> ${report.order_id}
<b>Worker:</b> ${report.worker_name || "Belum di-assign"}
<b>Pelapor:</b> ${report.customer_name || "-"}
<b>WA:</b> ${report.customer_whatsapp || "-"}
${report.worker_rating ? `<b>Rating Worker:</b> ${report.worker_rating}/5` : ""}

<b>Jenis Laporan:</b> ${typeLabels[report.report_type] || report.report_type}
${report.report_detail ? `\n<b>Detail:</b> ${report.report_detail}` : ""}

<b>SEGERA DITINDAKLANJUTI!</b>
`.trim();

  const replyMarkup = report.review_id ? {
    inline_keyboard: [
      [
        { text: "Resolved", callback_data: `report:${report.review_id}:resolved` },
        { text: "Dismiss", callback_data: `report:${report.review_id}:dismissed` },
      ],
    ],
  } : undefined;

  // Send to report group only (not admin/new order group)
  if (reportChatId) {
    await sendTelegramMessage(reportChatId, message, undefined, replyMarkup);
  }

  return true;
}

// ============ WHATSAPP (Meta Cloud API + Fonnte fallback) ============

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("0")) {
    normalized = "62" + normalized.slice(1);
  }
  if (!normalized.startsWith("62")) {
    normalized = "62" + normalized;
  }
  return normalized;
}

async function sendWhatsAppMeta(
  phone: string,
  message: string,
  settings: IntegrationSettings
): Promise<boolean> {
  if (!settings.metaWaEnabled || !settings.metaWaAccessToken || !settings.metaWaPhoneNumberId) {
    return false;
  }

  const normalizedPhone = normalizePhone(phone);

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${settings.metaWaPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.metaWaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: normalizedPhone,
          type: "text",
          text: { preview_url: true, body: message },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Meta WA error:", err);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Meta WA failed:", error);
    return false;
  }
}

async function sendWhatsAppFonnte(
  phone: string,
  message: string,
  url: string | undefined,
  settings: IntegrationSettings
): Promise<boolean> {
  const token = settings.fonnteApiToken;
  if (!token) return false;

  const normalizedPhone = normalizePhone(phone);

  try {
    const body: Record<string, string> = {
      target: normalizedPhone,
      message: message,
      countryCode: "62",
    };
    if (url) {
      body.url = url;
    }

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!data.status) {
      console.error("Fonnte error:", data.reason);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Fonnte WA failed:", error);
    return false;
  }
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  url?: string
): Promise<boolean> {
  if (!phone) return false;

  const settings = await getIntegrationSettings();

  // Try Meta Cloud API first (official, free tier)
  const metaSent = await sendWhatsAppMeta(phone, message, settings);
  if (metaSent) return true;

  // Fallback to Fonnte
  return sendWhatsAppFonnte(phone, message, url, settings);
}

export async function sendPaymentConfirmedWA(order: OrderData): Promise<boolean> {
  if (!order.whatsapp) return false;

  const message = `
*Pembayaran Dikonfirmasi!*

Halo! Pembayaran kamu sudah kami terima dan dikonfirmasi.

*Order ID:* ${order.order_id}
*Paket:* ${formatRankDisplay(order)}
*Total:* ${formatRupiah(order.price)}

Order kamu akan segera diproses oleh tim booster kami. Kamu akan menerima notifikasi saat pengerjaan dimulai.

Terima kasih sudah mempercayai *ETNYX*!

_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}
`.trim();

  return sendWhatsAppMessage(order.whatsapp, message);
}

export async function sendPaymentConfirmedEmail(order: OrderData): Promise<boolean> {
  if (!order.email) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0D0D1A; color: #fff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2DD4BF; margin: 0;">ETNYX</h1>
        <p style="color: #888; margin: 5px 0;">Push Rank, Tanpa Main</p>
      </div>
      <div style="background: #1A1A2E; padding: 25px; border-radius: 12px; border: 1px solid #333;">
        <h2 style="color: #fff; margin-top: 0;">Pembayaran Dikonfirmasi! ✅</h2>
        <p style="color: #ccc;">Pembayaran kamu sudah kami terima. Order akan segera diproses oleh tim booster kami.</p>
        <table style="width: 100%; color: #ccc; margin: 20px 0;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;">Order ID</td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right; font-family: monospace; color: #2DD4BF;">${order.order_id}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;">Paket</td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${formatTargetDisplay(order)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Total</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2DD4BF;">${formatRupiah(order.price)}</td></tr>
        </table>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${SITE_URL}/track/?id=${order.order_id}" style="background: linear-gradient(135deg, #6366F1, #2DD4BF); color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Track Order</a>
        </div>
        <p style="color: #888; font-size: 14px; text-align: center;">Kamu akan menerima notifikasi saat pengerjaan dimulai.</p>
      </div>
      <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">© 2026 ETNYX. All rights reserved.</p>
    </div>
  `;

  return sendEmail(order.email, `Pembayaran Dikonfirmasi - ${order.order_id}`, html);
}

export async function sendOrderConfirmationWA(order: OrderData): Promise<boolean> {
  if (!order.whatsapp) return false;

  const message = `
Halo!

Terima kasih sudah order di *ETNYX*!

*Detail Order:*
• Order ID: ${order.order_id}
• Rank: ${formatRankDisplay(order)}
• Paket: ${order.package}
• Total: ${formatRupiah(order.price)}

*Status:* Menunggu Pembayaran

Silakan selesaikan pembayaran untuk memproses order kamu.

Bayar & upload bukti di sini:
${SITE_URL}/payment/manual/?order_id=${order.order_id}

Butuh bantuan? Hubungi CS kami via link di bawah.

_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}
`.trim();

  return sendWhatsAppMessage(order.whatsapp, message, `${SITE_URL}/payment/manual/?order_id=${order.order_id}`);
}

export async function sendOrderStartedWA(order: OrderData): Promise<boolean> {
  if (!order.whatsapp) return false;

  const isGendong = order.package_title?.includes("Gendong") || order.package_title?.includes("Duo Boost");

  const message = `
*Order Sedang Dikerjakan!*

Halo! Order kamu sudah dikonfirmasi dan sedang dalam pengerjaan oleh booster kami.

*Order ID:* ${order.order_id}
*Paket:* ${formatTargetDisplay(order)}

Kamu bisa track progress di sini:
${SITE_URL}/track/?id=${order.order_id}

${isGendong ? "Booster kami akan menghubungi kamu untuk jadwal mabar." : "Jangan login ke akun selama proses joki ya!"}

_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}
`.trim();

  return sendWhatsAppMessage(order.whatsapp, message, `${SITE_URL}/track/?id=${order.order_id}`);
}

export async function sendOrderCompletedWA(order: OrderData): Promise<boolean> {
  if (!order.whatsapp) return false;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";
  const reviewLink = `${siteUrl}/review/?id=${order.order_id}`;
  const reportLink = `${siteUrl}/review/?id=${order.order_id}&report=1`;

  const isGendong = order.package_title?.includes("Gendong") || order.package_title?.includes("Duo Boost");

  const message = `
*Order Selesai!*

Yeay! Order kamu sudah selesai dikerjakan.

*Order ID:* ${order.order_id}
*Rank Akhir:* ${formatTargetDisplay(order)}

${isGendong ? "Terima kasih sudah mabar bersama booster kami!" : "Silakan cek akun kamu dan ganti password untuk keamanan."}

*Bantu kami dengan review yuk!*
${reviewLink}

*Ada masalah dengan worker?*
Laporkan di sini:
${reportLink}

Terima kasih sudah menggunakan *ETNYX*!

_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}
`.trim();

  return sendWhatsAppMessage(order.whatsapp, message, reviewLink);
}

export async function sendOrderCancelledWA(order: OrderData): Promise<boolean> {
  if (!order.whatsapp) return false;

  const message = `
*Order Dibatalkan*

Halo, order kamu telah dibatalkan.

*Order ID:* ${order.order_id}
*Username:* ${order.username}

Jika kamu merasa ini adalah kesalahan atau ingin order ulang, silakan hubungi kami via link di bawah.

_ETNYX - Push Rank, Tanpa Main_${waDisclaimer(order.order_id)}
`.trim();

  return sendWhatsAppMessage(order.whatsapp, message);
}

// ============ EMAIL (Resend) ============
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const settings = await getIntegrationSettings();
  const apiKey = settings.resendApiKey;
  const fromEmail = settings.resendFromEmail || "noreply@etnyx.com";

  if (!apiKey || !to) {
    console.warn("Resend not configured or no email");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ETNYX <${fromEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (data.error) {
      console.error("Resend error:", data.error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendOrderConfirmationEmail(order: OrderData): Promise<boolean> {
  if (!order.email) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0D0D1A; color: #fff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2DD4BF; margin: 0;">ETNYX</h1>
        <p style="color: #888; margin: 5px 0;">Push Rank, Tanpa Main</p>
      </div>
      
      <div style="background: #1A1A2E; padding: 25px; border-radius: 12px; border: 1px solid #333;">
        <h2 style="color: #fff; margin-top: 0;">Order Diterima! ✅</h2>
        
        <p style="color: #ccc;">Terima kasih sudah order di ETNYX. Berikut detail order kamu:</p>
        
        <table style="width: 100%; color: #ccc; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #333;">Order ID</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right; font-family: monospace; color: #2DD4BF;">${order.order_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #333;">Username</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${order.username}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #333;">Rank</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${formatRankDisplay(order)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #333;">Paket</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${order.package}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Total</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2DD4BF;">${formatRupiah(order.price)}</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${SITE_URL}/track/?id=${order.order_id}" 
             style="background: linear-gradient(135deg, #6366F1, #2DD4BF); color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Track Order
          </a>
        </div>
        
        <p style="color: #888; font-size: 14px; text-align: center;">
          Butuh bantuan? Hubungi kami via WhatsApp
        </p>
      </div>
      
      <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
        © 2026 ETNYX. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail(order.email, `Order Diterima - ${order.order_id}`, html);
}

// ============ COMBINED NOTIFICATIONS ============
export async function sendNewOrderNotifications(order: OrderData): Promise<void> {
  // Send all notifications in parallel
  await Promise.allSettled([
    notifyAdminNewOrder(order),
    sendOrderConfirmationWA(order),
    sendOrderConfirmationEmail(order),
  ]);
}

export async function sendOrderConfirmedNotifications(order: OrderData): Promise<void> {
  await Promise.allSettled([
    notifyWorkerConfirmedOrder(order),
    sendPaymentConfirmedWA(order),
    sendPaymentConfirmedEmail(order),
  ]);
}

export async function sendOrderCompletedNotifications(order: OrderData): Promise<void> {
  await Promise.allSettled([
    sendOrderCompletedWA(order),
    notifyAdminOrderCompleted(order),
  ]);
}
