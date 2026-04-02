import { createAdminClient } from "./supabase-server";

// ============ Types ============
interface OrderData {
  order_id: string;
  username: string;
  current_rank: string;
  target_rank: string;
  package: string;
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

function formatRank(rank: string): string {
  const labels: Record<string, string> = {
    warrior: "Warrior",
    elite: "Elite",
    master: "Master",
    grandmaster: "Grandmaster",
    epic: "Epic",
    legend: "Legend",
    mythic: "Mythic",
    mythicglory: "Mythic Glory",
  };
  return labels[rank?.toLowerCase()] || rank;
}

// ============ TELEGRAM ============
export async function sendTelegramMessage(
  chatId: string,
  message: string,
  botToken?: string
): Promise<boolean> {
  const settings = botToken ? { telegramBotToken: botToken } : await getIntegrationSettings();
  const token = settings.telegramBotToken;

  if (!token || !chatId) {
    console.warn("Telegram not configured. Chat ID:", chatId);
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
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

export async function notifyAdminNewOrder(order: OrderData): Promise<boolean> {
  const settings = await getIntegrationSettings();
  const chatId = settings.telegramAdminGroupId;

  if (!chatId) return false;

  const message = `
🆕 <b>ORDER BARU!</b>

📋 <b>Order ID:</b> ${order.order_id}
👤 <b>Username:</b> ${order.username}
📱 <b>WhatsApp:</b> ${order.whatsapp || "-"}

🎮 <b>Detail Order:</b>
• Rank: ${formatRank(order.current_rank)} → ${formatRank(order.target_rank)}
• Paket: ${order.package}
${order.is_express ? "⚡ EXPRESS" : ""}${order.is_premium ? " 👑 PREMIUM" : ""}

💰 <b>Total:</b> ${formatRupiah(order.price)}

📝 <b>Catatan:</b> ${order.notes || "-"}

⏳ <b>Status:</b> Menunggu Konfirmasi

🔗 Konfirmasi di Dashboard Admin
`.trim();

  return sendTelegramMessage(chatId, message);
}

export async function notifyWorkerConfirmedOrder(order: OrderData): Promise<boolean> {
  const settings = await getIntegrationSettings();
  const chatId = settings.telegramWorkerGroupId;

  if (!chatId) return false;

  const message = `
✅ <b>ORDER DIKONFIRMASI!</b>

📋 <b>Order ID:</b> ${order.order_id}
👤 <b>Username:</b> ${order.username}

🎮 <b>Detail Order:</b>
• Rank: ${formatRank(order.current_rank)} → ${formatRank(order.target_rank)}
• Paket: ${order.package}
${order.is_express ? "⚡ EXPRESS - PRIORITAS!" : ""}${order.is_premium ? " 👑 PREMIUM" : ""}

📝 <b>Catatan:</b> ${order.notes || "-"}

⚠️ Segera kerjakan order ini!
`.trim();

  return sendTelegramMessage(chatId, message);
}

// ============ WHATSAPP (Fonnte) ============
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<boolean> {
  const settings = await getIntegrationSettings();
  const token = settings.fonnteApiToken;

  if (!token || !phone) {
    console.warn("Fonnte not configured or no phone number");
    return false;
  }

  // Normalize phone number
  let normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.startsWith("0")) {
    normalizedPhone = "62" + normalizedPhone.slice(1);
  }
  if (!normalizedPhone.startsWith("62")) {
    normalizedPhone = "62" + normalizedPhone;
  }

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: normalizedPhone,
        message: message,
        countryCode: "62",
      }),
    });

    const data = await res.json();
    if (!data.status) {
      console.error("Fonnte error:", data.reason);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return false;
  }
}

export async function sendOrderConfirmationWA(order: OrderData): Promise<boolean> {
  if (!order.whatsapp) return false;

  const message = `
Halo! 👋

Terima kasih sudah order di *ETNYX*!

*📋 Detail Order:*
• Order ID: ${order.order_id}
• Rank: ${formatRank(order.current_rank)} → ${formatRank(order.target_rank)}
• Paket: ${order.package}
• Total: ${formatRupiah(order.price)}

*Status:* ⏳ Menunggu Pembayaran

Silakan selesaikan pembayaran untuk memproses order kamu.

Track order: https://etnyx.com/track?id=${order.order_id}

Butuh bantuan? Balas pesan ini! 💬

_ETNYX - Push Rank, Tanpa Main_ ⚡
`.trim();

  return sendWhatsAppMessage(order.whatsapp, message);
}

export async function sendOrderStartedWA(order: OrderData): Promise<boolean> {
  if (!order.whatsapp) return false;

  const message = `
✅ *Order Sedang Dikerjakan!*

Halo! Order kamu sudah dikonfirmasi dan sedang dalam pengerjaan oleh booster kami.

*📋 Order ID:* ${order.order_id}
*🎮 Target:* ${formatRank(order.target_rank)}

Kamu bisa track progress di:
https://etnyx.com/track?id=${order.order_id}

Jangan login ke akun selama proses joki ya! 🔒

_ETNYX - Push Rank, Tanpa Main_ ⚡
`.trim();

  return sendWhatsAppMessage(order.whatsapp, message);
}

export async function sendOrderCompletedWA(order: OrderData): Promise<boolean> {
  if (!order.whatsapp) return false;

  const message = `
🎉 *Order Selesai!*

Yeay! Order kamu sudah selesai dikerjakan.

*📋 Order ID:* ${order.order_id}
*🎮 Rank Akhir:* ${formatRank(order.target_rank)}

Silakan cek akun kamu dan ganti password untuk keamanan.

Terima kasih sudah menggunakan ETNYX! ⭐
Jangan lupa kasih testimoni ya 😊

_ETNYX - Push Rank, Tanpa Main_ ⚡
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
            <td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${formatRank(order.current_rank)} → ${formatRank(order.target_rank)}</td>
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
          <a href="https://etnyx.com/track?id=${order.order_id}" 
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
    sendOrderStartedWA(order),
  ]);
}

export async function sendOrderCompletedNotifications(order: OrderData): Promise<void> {
  await Promise.allSettled([
    sendOrderCompletedWA(order),
  ]);
}
