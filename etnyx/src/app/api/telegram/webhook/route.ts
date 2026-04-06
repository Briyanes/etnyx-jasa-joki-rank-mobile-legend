import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// ---- Types ----
interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: CallbackQuery;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string; title?: string };
  text?: string;
  date: number;
}

interface CallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

// ---- Helpers ----
async function getSettings() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "integrations")
    .single();
  return data?.value || {};
}

async function tgApi(method: string, body: Record<string, unknown>) {
  const settings = await getSettings();
  const token = settings.telegramBotToken;
  if (!token) return null;

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function reply(chatId: number, text: string, extra?: Record<string, unknown>) {
  return tgApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

async function answerCallback(callbackId: string, text: string) {
  return tgApi("answerCallbackQuery", {
    callback_query_id: callbackId,
    text,
    show_alert: true,
  });
}

async function editMessage(chatId: number, messageId: number, text: string, replyMarkup?: unknown) {
  return tgApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup || undefined,
  });
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

function formatRank(r: string): string {
  const m: Record<string, string> = { warrior: "Warrior", elite: "Elite", master: "Master", grandmaster: "Grandmaster", epic: "Epic", legend: "Legend", mythic: "Mythic", mythicglory: "Mythic Glory", mythicgrading: "Mythic Grading", mythichonor: "Mythic Honor", mythicimmortal: "Mythic Immortal" };
  return m[r?.toLowerCase()] || r;
}

// ============ COMMAND HANDLERS ============
async function handleCommand(message: TelegramMessage) {
  const text = message.text?.trim() || "";
  const chatId = message.chat.id;

  if (text === "/start" || text === "/help") {
    return reply(chatId, `
🤖 <b>ETNYX Bot</b>

<b>📋 Commands:</b>
/orders — Lihat 10 order terbaru
/pending — Order yang belum dikonfirmasi
/progress — Order sedang dikerjakan
/completed — Order selesai (7 hari terakhir)
/stats — Statistik ringkas
/reviews — Review terbaru
/reports — Worker reports terbaru
/reviewstats — Rekap rating & review semua worker
/help — Tampilkan menu ini

<b>🔔 Notifikasi Otomatis:</b>
• Order baru → tombol ✅ Konfirmasi / ❌ Tolak
• Review masuk → tombol untuk approve/hide
• Report worker → alert langsung

⚡ <i>ETNYX - Push Rank, Tanpa Main</i>
`.trim());
  }

  if (text === "/orders") {
    return handleOrdersList(chatId, "all", 10);
  }

  if (text === "/pending") {
    return handleOrdersList(chatId, "pending", 10);
  }

  if (text === "/progress") {
    return handleOrdersList(chatId, "in_progress", 10);
  }

  if (text === "/completed") {
    return handleOrdersList(chatId, "completed", 10);
  }

  if (text === "/stats") {
    return handleStats(chatId);
  }

  if (text === "/reviews") {
    return handleReviews(chatId);
  }

  if (text === "/reports") {
    return handleReports(chatId);
  }

  if (text === "/reviewstats") {
    return handleReviewStats(chatId);
  }

  // Unknown command
  if (text.startsWith("/")) {
    return reply(chatId, "❓ Command tidak dikenal. Ketik /help untuk menu.");
  }
}

async function handleOrdersList(chatId: number, status: string, limit: number) {
  const supabase = await createAdminClient();
  
  let query = supabase
    .from("orders")
    .select("id, order_id, username, current_rank, target_rank, package, total_price, status, is_express, is_premium, assigned_worker_name, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  // For completed, only last 7 days
  if (status === "completed") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query = query.gte("created_at", weekAgo.toISOString());
  }

  const { data: orders, error } = await query;

  if (error || !orders?.length) {
    const labels: Record<string, string> = { all: "semua", pending: "pending", in_progress: "in progress", completed: "selesai" };
    return reply(chatId, `📋 Tidak ada order ${labels[status] || status} saat ini.`);
  }

  const statusEmoji: Record<string, string> = { pending: "⏳", confirmed: "✅", in_progress: "🔄", completed: "✅", cancelled: "❌", refunded: "💸" };

  let msg = `📋 <b>Orders${status !== "all" ? ` (${status})` : ""}</b>\n\n`;

  for (const o of orders) {
    const emoji = statusEmoji[o.status] || "📦";
    msg += `${emoji} <code>${o.order_id}</code>\n`;
    msg += `   👤 ${o.username} • ${formatRank(o.current_rank)} → ${formatRank(o.target_rank)}\n`;
    msg += `   💰 ${formatRupiah(o.total_price)}${o.is_express ? " ⚡" : ""}${o.is_premium ? " 👑" : ""}\n`;
    if (o.assigned_worker_name) msg += `   🎮 Worker: ${o.assigned_worker_name}\n`;
    msg += `\n`;
  }

  // Add action buttons for pending orders
  if (status === "pending" && orders.length > 0) {
    const buttons = orders.slice(0, 5).map(o => ([{
      text: `✅ Konfirmasi ${o.order_id}`,
      callback_data: `confirm:${o.id}`,
    }]));
    return reply(chatId, msg.trim(), {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  return reply(chatId, msg.trim());
}

async function handleStats(chatId: number) {
  const supabase = await createAdminClient();
  
  // Get basic counts
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: inProgressOrders },
    { count: completedThisMonth },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed").gte("created_at", firstOfMonth),
    supabase.from("orders").select("total_price").eq("status", "completed").gte("created_at", firstOfMonth),
  ]);

  const monthRevenue = revenueData?.reduce((s, o) => s + (o.total_price || 0), 0) || 0;

  const msg = `
📊 <b>Statistik ETNYX</b>

📦 <b>Total Orders:</b> ${totalOrders || 0}
⏳ <b>Pending:</b> ${pendingOrders || 0}
🔄 <b>In Progress:</b> ${inProgressOrders || 0}
✅ <b>Selesai Bulan Ini:</b> ${completedThisMonth || 0}

💰 <b>Revenue Bulan Ini:</b> ${formatRupiah(monthRevenue)}

📅 <i>${now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</i>
`.trim();

  return reply(chatId, msg);
}

async function handleReviews(chatId: number) {
  const supabase = await createAdminClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, order_id, customer_name, service_rating, service_comment, worker_rating, is_visible, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!reviews?.length) {
    return reply(chatId, "⭐ Belum ada review.");
  }

  let msg = "⭐ <b>Review Terbaru</b>\n\n";
  for (const r of reviews) {
    const stars = "⭐".repeat(r.service_rating);
    msg += `${stars} <b>${r.customer_name || "Anonim"}</b>\n`;
    msg += `   📋 ${r.order_id || "-"}\n`;
    if (r.service_comment) msg += `   💬 "${r.service_comment}"\n`;
    msg += `   ${r.is_visible ? "👁 Visible" : "🙈 Hidden"}\n\n`;
  }

  // Add toggle visibility buttons
  const buttons = reviews.map(r => ([{
    text: `${r.is_visible ? "🙈 Hide" : "👁 Show"} ${r.order_id || r.id.slice(0, 8)}`,
    callback_data: `review_toggle:${r.id}:${r.is_visible ? "hide" : "show"}`,
  }]));

  return reply(chatId, msg.trim(), {
    reply_markup: { inline_keyboard: buttons },
  });
}

async function handleReports(chatId: number) {
  const supabase = await createAdminClient();
  const { data: reports } = await supabase
    .from("reviews")
    .select("id, order_id, customer_name, worker_rating, report_type, report_detail, report_status, created_at")
    .not("report_type", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!reports?.length) {
    return reply(chatId, "📝 Tidak ada worker report.");
  }

  const typeLabels: Record<string, string> = {
    cheating: "🎮 Cheat", offering_services: "🚫 Jasa Luar", rude: "😤 Kasar",
    account_issue: "🔐 Akun", other: "❓ Lain",
  };

  let msg = "🚨 <b>Worker Reports</b>\n\n";
  for (const r of reports) {
    msg += `⚠️ <b>${typeLabels[r.report_type] || r.report_type}</b> — ${r.customer_name || "Anonim"}\n`;
    msg += `   📋 ${r.order_id || "-"}\n`;
    if (r.report_detail) msg += `   📝 ${r.report_detail.substring(0, 100)}\n`;
    msg += `   Status: ${r.report_status || "pending"}\n\n`;
  }

  // Add action buttons for pending reports
  const pending = reports.filter(r => !r.report_status || r.report_status === "pending");
  if (pending.length > 0) {
    const buttons = pending.flatMap(r => ([
      [
        { text: `✅ Resolved ${r.order_id || r.id.slice(0, 8)}`, callback_data: `report:${r.id}:resolved` },
        { text: `❌ Dismiss`, callback_data: `report:${r.id}:dismissed` },
      ],
    ]));
    return reply(chatId, msg.trim(), {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  return reply(chatId, msg.trim());
}

async function handleReviewStats(chatId: number) {
  const supabase = await createAdminClient();

  // Get all reviews with worker info
  const { data: reviews } = await supabase
    .from("reviews")
    .select("worker_id, service_rating, worker_rating, has_worker_report, report_type, report_status")
    .not("worker_id", "is", null);

  // Get worker names
  const { data: workers } = await supabase
    .from("staff_users")
    .select("id, name")
    .eq("role", "worker");

  if (!reviews?.length || !workers?.length) {
    return reply(chatId, "📊 Belum ada data review worker.");
  }

  const workerMap = new Map(workers.map(w => [w.id, w.name]));

  // Aggregate per worker
  const stats: Record<string, {
    name: string;
    totalReviews: number;
    avgService: number;
    avgWorker: number;
    sumService: number;
    sumWorker: number;
    workerRated: number;
    reports: number;
    reportsPending: number;
  }> = {};

  for (const r of reviews) {
    const wId = r.worker_id;
    if (!stats[wId]) {
      stats[wId] = {
        name: workerMap.get(wId) || "Unknown",
        totalReviews: 0,
        avgService: 0,
        avgWorker: 0,
        sumService: 0,
        sumWorker: 0,
        workerRated: 0,
        reports: 0,
        reportsPending: 0,
      };
    }
    const s = stats[wId];
    s.totalReviews += 1;
    s.sumService += r.service_rating || 0;
    if (r.worker_rating) {
      s.sumWorker += r.worker_rating;
      s.workerRated += 1;
    }
    if (r.has_worker_report) {
      s.reports += 1;
      if (!r.report_status || r.report_status === "pending") {
        s.reportsPending += 1;
      }
    }
  }

  // Calculate averages and sort by avg service desc
  const sorted = Object.values(stats)
    .map(s => ({
      ...s,
      avgService: s.totalReviews > 0 ? s.sumService / s.totalReviews : 0,
      avgWorker: s.workerRated > 0 ? s.sumWorker / s.workerRated : 0,
    }))
    .sort((a, b) => b.avgService - a.avgService);

  let msg = "📊 <b>Rekap Review Worker</b>\n\n";

  for (const w of sorted) {
    const serviceStars = "⭐".repeat(Math.round(w.avgService));
    const workerStars = w.workerRated > 0 ? "⭐".repeat(Math.round(w.avgWorker)) : "-";
    const reportBadge = w.reports > 0 ? ` 🚨${w.reports}` : "";
    const pendingBadge = w.reportsPending > 0 ? ` (⏳${w.reportsPending} pending)` : "";

    msg += `👤 <b>${w.name}</b>${reportBadge}${pendingBadge}\n`;
    msg += `   Layanan: ${serviceStars} (${w.avgService.toFixed(1)}/5) — ${w.totalReviews} review\n`;
    msg += `   Worker: ${workerStars}${w.workerRated > 0 ? ` (${w.avgWorker.toFixed(1)}/5)` : ""}\n\n`;
  }

  // Overall summary
  const totalReviews = sorted.reduce((sum, w) => sum + w.totalReviews, 0);
  const totalReports = sorted.reduce((sum, w) => sum + w.reports, 0);
  const overallAvg = totalReviews > 0
    ? sorted.reduce((sum, w) => sum + w.sumService, 0) / totalReviews
    : 0;

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📈 <b>Total:</b> ${totalReviews} review, Avg ${overallAvg.toFixed(1)}/5\n`;
  msg += `🚨 <b>Reports:</b> ${totalReports} total`;

  return reply(chatId, msg.trim());
}

// ============ CALLBACK QUERY HANDLERS ============
async function handleCallback(query: CallbackQuery) {
  const data = query.data || "";
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;
  const userName = query.from.first_name + (query.from.last_name ? ` ${query.from.last_name}` : "");

  if (!chatId || !messageId) {
    return answerCallback(query.id, "Error: pesan tidak valid");
  }

  // ---- CONFIRM ORDER ----
  if (data.startsWith("confirm:")) {
    const orderId = data.split(":")[1];
    return handleConfirmOrder(query.id, chatId, messageId, orderId, userName);
  }

  // ---- REJECT ORDER ----
  if (data.startsWith("reject:")) {
    const orderId = data.split(":")[1];
    return handleRejectOrder(query.id, chatId, messageId, orderId, userName);
  }

  // ---- VIEW ORDER DETAIL ----
  if (data.startsWith("detail:")) {
    const orderId = data.split(":")[1];
    return handleOrderDetail(query.id, chatId, orderId);
  }

  // ---- MARK ORDER IN PROGRESS ----
  if (data.startsWith("start:")) {
    const orderId = data.split(":")[1];
    return handleStartOrder(query.id, chatId, messageId, orderId, userName);
  }

  // ---- TOGGLE REVIEW VISIBILITY ----
  if (data.startsWith("review_toggle:")) {
    const parts = data.split(":");
    const reviewId = parts[1];
    const action = parts[2]; // "show" or "hide"
    return handleReviewToggle(query.id, chatId, messageId, reviewId, action, userName);
  }

  // ---- REPORT STATUS ----
  if (data.startsWith("report:")) {
    const parts = data.split(":");
    const reportId = parts[1];
    const status = parts[2];
    return handleReportStatus(query.id, chatId, messageId, reportId, status, userName);
  }

  return answerCallback(query.id, "Unknown action");
}

async function handleConfirmOrder(callbackId: string, chatId: number, messageId: number, orderId: string, userName: string) {
  const supabase = await createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return answerCallback(callbackId, "❌ Order tidak ditemukan");
  }

  if (order.status !== "pending") {
    return answerCallback(callbackId, `Order sudah ${order.status}`);
  }

  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", orderId);

  if (updateErr) {
    return answerCallback(callbackId, "❌ Gagal mengkonfirmasi order");
  }

  // Send confirmed notifications
  try {
    const { sendOrderConfirmedNotifications } = await import("@/lib/notifications");
    sendOrderConfirmedNotifications({
      order_id: order.order_id,
      username: order.username,
      current_rank: order.current_rank,
      target_rank: order.target_rank,
      package: order.package,
      price: order.price || order.total_price,
      whatsapp: order.whatsapp,
      email: order.email,
      status: "confirmed",
      is_express: order.is_express,
      is_premium: order.is_premium,
      notes: order.notes,
    }).catch(console.error);
  } catch {
    // non-blocking
  }

  // Update the original message
  const updated = `
✅ <b>ORDER DIKONFIRMASI!</b>

📋 <b>Order:</b> ${order.order_id}
👤 <b>Username:</b> ${order.username}
🎮 ${formatRank(order.current_rank)} → ${formatRank(order.target_rank)}
💰 ${formatRupiah(order.total_price)}

✅ Dikonfirmasi oleh <b>${userName}</b>
`.trim();

  await editMessage(chatId, messageId, updated, {
    inline_keyboard: [
      [{ text: "🔄 Mulai Kerjakan", callback_data: `start:${orderId}` }],
      [{ text: "📋 Detail", callback_data: `detail:${orderId}` }],
    ],
  });

  return answerCallback(callbackId, "✅ Order dikonfirmasi!");
}

async function handleRejectOrder(callbackId: string, chatId: number, messageId: number, orderId: string, userName: string) {
  const supabase = await createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return answerCallback(callbackId, "❌ Order tidak ditemukan");
  }

  if (order.status === "cancelled") {
    return answerCallback(callbackId, "Order sudah dibatalkan");
  }

  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  if (updateErr) {
    return answerCallback(callbackId, "❌ Gagal membatalkan order");
  }

  const updated = `
❌ <b>ORDER DITOLAK</b>

📋 <b>Order:</b> ${order.order_id}
👤 <b>Username:</b> ${order.username}
🎮 ${formatRank(order.current_rank)} → ${formatRank(order.target_rank)}
💰 ${formatRupiah(order.total_price)}

❌ Ditolak oleh <b>${userName}</b>
`.trim();

  await editMessage(chatId, messageId, updated);
  return answerCallback(callbackId, "❌ Order ditolak");
}

async function handleStartOrder(callbackId: string, chatId: number, messageId: number, orderId: string, userName: string) {
  const supabase = await createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return answerCallback(callbackId, "❌ Order tidak ditemukan");
  }

  if (order.status !== "confirmed") {
    return answerCallback(callbackId, `Status order: ${order.status}`);
  }

  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: "in_progress" })
    .eq("id", orderId);

  if (updateErr) {
    return answerCallback(callbackId, "❌ Gagal update status");
  }

  const updated = `
🔄 <b>ORDER IN PROGRESS</b>

📋 <b>Order:</b> ${order.order_id}
👤 <b>Username:</b> ${order.username}
🎮 ${formatRank(order.current_rank)} → ${formatRank(order.target_rank)}
💰 ${formatRupiah(order.total_price)}

🔄 Dimulai oleh <b>${userName}</b>
`.trim();

  await editMessage(chatId, messageId, updated, {
    inline_keyboard: [
      [{ text: "📋 Detail", callback_data: `detail:${orderId}` }],
    ],
  });
  return answerCallback(callbackId, "🔄 Order dimulai!");
}

async function handleOrderDetail(callbackId: string, chatId: number, orderId: string) {
  const supabase = await createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return answerCallback(callbackId, "❌ Order tidak ditemukan");
  }

  const statusEmoji: Record<string, string> = { pending: "⏳", confirmed: "✅", in_progress: "🔄", completed: "✅", cancelled: "❌" };

  const msg = `
📋 <b>DETAIL ORDER</b>

🆔 <b>Order ID:</b> <code>${order.order_id}</code>
${statusEmoji[order.status] || "📦"} <b>Status:</b> ${order.status}

👤 <b>Username:</b> ${order.username}
📱 <b>WhatsApp:</b> ${order.whatsapp || "-"}
📧 <b>Email:</b> ${order.email || "-"}

🎮 <b>Rank:</b> ${formatRank(order.current_rank)} → ${formatRank(order.target_rank)}
📦 <b>Paket:</b> ${order.package}
${order.is_express ? "⚡ <b>EXPRESS</b>" : ""}${order.is_premium ? " 👑 <b>PREMIUM</b>" : ""}

💰 <b>Harga Dasar:</b> ${formatRupiah(order.price || 0)}
💰 <b>Total:</b> ${formatRupiah(order.total_price)}
${order.promo_code ? `🎟 <b>Promo:</b> ${order.promo_code} (-${formatRupiah(order.discount_amount || 0)})` : ""}

${order.assigned_worker_name ? `🎮 <b>Worker:</b> ${order.assigned_worker_name}` : ""}
📝 <b>Catatan:</b> ${order.notes || "-"}

🕐 <b>Dibuat:</b> ${new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
`.trim();

  // Add context-appropriate buttons
  const buttons: { text: string; callback_data: string }[][] = [];
  if (order.status === "pending") {
    buttons.push([
      { text: "✅ Konfirmasi", callback_data: `confirm:${orderId}` },
      { text: "❌ Tolak", callback_data: `reject:${orderId}` },
    ]);
  }
  if (order.status === "confirmed") {
    buttons.push([{ text: "🔄 Mulai Kerjakan", callback_data: `start:${orderId}` }]);
  }

  await reply(chatId, msg, buttons.length > 0 ? { reply_markup: { inline_keyboard: buttons } } : undefined);
  return answerCallback(callbackId, "📋 Detail order");
}

async function handleReviewToggle(callbackId: string, chatId: number, messageId: number, reviewId: string, action: string, userName: string) {
  const supabase = await createAdminClient();
  const isVisible = action === "show";

  const { error } = await supabase
    .from("reviews")
    .update({ is_visible: isVisible })
    .eq("id", reviewId);

  if (error) {
    return answerCallback(callbackId, "❌ Gagal update review");
  }

  await answerCallback(callbackId, `${isVisible ? "👁 Review ditampilkan" : "🙈 Review disembunyikan"} oleh ${userName}`);
  
  // Refresh the reviews list
  return handleReviews(chatId);
}

async function handleReportStatus(callbackId: string, chatId: number, messageId: number, reportId: string, status: string, userName: string) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("reviews")
    .update({ report_status: status })
    .eq("id", reportId);

  if (error) {
    return answerCallback(callbackId, "❌ Gagal update report");
  }

  const label = status === "resolved" ? "✅ Resolved" : "❌ Dismissed";
  await answerCallback(callbackId, `${label} oleh ${userName}`);
  
  // Refresh the reports list
  return handleReports(chatId);
}

// ============ WEBHOOK ENDPOINT ============
export async function POST(request: Request) {
  try {
    // Verify it's from Telegram (check bot token in URL or use secret)
    const update: TelegramUpdate = await request.json();

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    // Handle messages (commands)
    if (update.message?.text) {
      await handleCommand(update.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// GET: Register webhook (one-time call)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action !== "register") {
    return NextResponse.json({ error: "Use ?action=register to set up webhook" });
  }

  const settings = await getSettings();
  const token = settings.telegramBotToken;

  if (!token) {
    return NextResponse.json({ error: "Bot token not configured in Settings → Integrations" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";
  const webhookUrl = `${siteUrl}/api/telegram/webhook`;

  // Set webhook
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    }),
  });
  const data = await res.json();

  // Set bot commands
  await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        { command: "orders", description: "Lihat 10 order terbaru" },
        { command: "pending", description: "Order menunggu konfirmasi" },
        { command: "progress", description: "Order sedang dikerjakan" },
        { command: "completed", description: "Order selesai (7 hari)" },
        { command: "stats", description: "Statistik ringkas" },
        { command: "reviews", description: "Review terbaru" },
        { command: "reports", description: "Worker reports" },
        { command: "help", description: "Menu bantuan" },
      ],
    }),
  });

  return NextResponse.json({
    success: data.ok,
    webhook_url: webhookUrl,
    telegram_response: data,
  });
}
