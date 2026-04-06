"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Book, ChevronDown, ChevronRight, Users, ShoppingCart,
  CreditCard, Bell, Shield, Settings, Database, Globe,
  Server, Lock, Zap, Layers, Wallet, BarChart3,
  UserCheck, Crown, Wrench, Star,
  Gift, Bot, TrendingUp, Search,
  ClipboardList, Gamepad2, Monitor,
} from "lucide-react";

// --- Reusable Components ---
const RoleBadge = ({ role }: { role: string }) => {
  const colors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400 border-red-500/20",
    lead: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    worker: "bg-green-500/10 text-green-400 border-green-500/20",
    customer: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    public: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    auto: "bg-accent/10 text-accent border-accent/20",
  };
  return <span className={`px-2 py-0.5 rounded border text-xs font-medium ${colors[role] || colors.public}`}>{role}</span>;
};

const Table = ({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) => (
  <div className="overflow-x-auto rounded-lg border border-white/5">
    <table className="w-full text-sm">
      <thead><tr className="bg-white/[0.02] border-b border-white/10">{headers.map((h, i) => <th key={i} className="px-3 py-2.5 text-left text-text-muted font-medium text-xs">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-white/5">{rows.map((row, i) => <tr key={i} className="hover:bg-white/[0.02] transition-colors">{row.map((cell, j) => <td key={j} className="px-3 py-2 text-text text-xs">{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const Code = ({ children }: { children: string }) => (
  <code className="bg-background px-1.5 py-0.5 rounded text-accent text-xs font-mono">{children}</code>
);

const InfoBox = ({ type, children }: { type: "info" | "warning" | "success"; children: React.ReactNode }) => {
  const styles = { info: "bg-blue-500/10 border-blue-500/20 text-blue-300", warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300", success: "bg-green-500/10 border-green-500/20 text-green-300" };
  const labels = { info: "INFO", warning: "PERHATIAN", success: "OK" };
  return <div className={`rounded-lg border p-3 text-xs ${styles[type]}`}><span className="font-bold mr-1">[{labels[type]}]</span> {children}</div>;
};

const StepFlow = ({ steps }: { steps: { title: string; desc: string; badge?: string; page?: string }[] }) => (
  <div className="relative">
    {steps.map((item, i) => (
      <div key={i} className="flex gap-3 mb-4">
        <div className="flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold shrink-0">{i + 1}</div>
          {i < steps.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
        </div>
        <div className="flex-1 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-text font-medium text-sm">{item.title}</h4>
            {item.badge && <RoleBadge role={item.badge} />}
          </div>
          <p className="text-text-muted text-xs mt-0.5">{item.desc}</p>
          {item.page && <span className="text-accent/50 text-[10px] font-mono">{item.page}</span>}
        </div>
      </div>
    ))}
  </div>
);

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-background rounded-lg p-3 border border-white/5 text-center">
    <div className="text-text-muted text-[10px] uppercase tracking-wider">{label}</div>
    <div className="text-accent font-bold text-lg mt-0.5">{value}</div>
    {sub && <div className="text-text-muted text-[10px] mt-0.5">{sub}</div>}
  </div>
);

// --- Section Types ---
interface DocSection {
  id: string;
  icon: typeof Book;
  title: string;
  content: React.ReactNode;
}

interface DocCategory {
  id: string;
  label: string;
  catIcon: typeof Book;
  color: string;
  sections: DocSection[];
}

// ============================================================
// BUILD ALL CATEGORIES & SECTIONS
// ============================================================
function buildCategories(): DocCategory[] {
  return [
    // ===================== UMUM =====================
    {
      id: "general",
      label: "Umum",
      catIcon: ClipboardList,
      color: "text-gray-400",
      sections: [
        {
          id: "overview",
          icon: Globe,
          title: "Project Overview",
          content: (
            <div className="space-y-4">
              <p className="text-text text-sm leading-relaxed">
                <strong>ETNYX</strong> adalah platform jasa joki & gendong rank Mobile Legends: Bang Bang.
                Platform full-stack dengan admin dashboard, staff management, payment gateway, dan multi-channel notification.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Halaman" value="16" sub="Customer + Admin" />
                <StatCard label="API Routes" value="58+" sub="RESTful endpoints" />
                <StatCard label="Dashboard Tabs" value="14" sub="Admin CMS" />
                <StatCard label="Integrasi" value="6" sub="External services" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-background rounded-lg p-3 border border-white/5">
                  <h4 className="text-text font-medium text-sm mb-2">Tech Stack</h4>
                  <ul className="text-text-muted text-xs space-y-1">
                    <li>&#8226; <strong className="text-text">Next.js 16</strong> + React 19 (Turbopack)</li>
                    <li>&#8226; <strong className="text-text">Supabase</strong> &mdash; Database + Auth + Storage</li>
                    <li>&#8226; <strong className="text-text">Midtrans Snap</strong> &mdash; Payment Gateway</li>
                    <li>&#8226; <strong className="text-text">Vercel</strong> &mdash; Hosting &amp; Deployment</li>
                    <li>&#8226; <strong className="text-text">Tailwind CSS 4</strong> &mdash; Styling</li>
                    <li>&#8226; <strong className="text-text">TypeScript</strong> &mdash; Type Safety</li>
                  </ul>
                </div>
                <div className="bg-background rounded-lg p-3 border border-white/5">
                  <h4 className="text-text font-medium text-sm mb-2">Integrasi</h4>
                  <ul className="text-text-muted text-xs space-y-1">
                    <li>&#8226; <strong className="text-text">Telegram Bot</strong> &mdash; Interactive bot + notifikasi grup</li>
                    <li>&#8226; <strong className="text-text">Fonnte</strong> &mdash; WhatsApp notifikasi customer</li>
                    <li>&#8226; <strong className="text-text">Resend</strong> &mdash; Email transaksional</li>
                    <li>&#8226; <strong className="text-text">Web Push</strong> &mdash; Browser notifications</li>
                    <li>&#8226; <strong className="text-text">Google Analytics</strong> &mdash; Tracking</li>
                    <li>&#8226; <strong className="text-text">Meta/TikTok Pixel</strong> &mdash; Ads tracking</li>
                  </ul>
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Halaman</h4>
                <Table headers={["Halaman", "URL", "Akses"]} rows={[
                  ["Homepage", "/", <RoleBadge key="p" role="public" />],
                  ["Order Form", "/order", <RoleBadge key="p2" role="public" />],
                  ["Track Order", "/track", <RoleBadge key="p3" role="public" />],
                  ["Bio / Link Tree", "/bio", <RoleBadge key="p4" role="public" />],
                  ["Submit Review", "/review?id=xxx", <RoleBadge key="p5" role="customer" />],
                  ["Customer Dashboard", "/dashboard", <RoleBadge key="c" role="customer" />],
                  ["Admin Dashboard", "/admin/dashboard", <RoleBadge key="a" role="admin" />],
                  ["Lead Dashboard", "/admin/lead", <RoleBadge key="l" role="lead" />],
                  ["Worker Dashboard", "/admin/worker", <RoleBadge key="w" role="worker" />],
                  ["Dokumentasi (ini)", "/admin/docs", <span key="all" className="flex gap-1"><RoleBadge role="admin" /><RoleBadge role="lead" /><RoleBadge role="worker" /></span>],
                ]} />
              </div>
            </div>
          ),
        },
        {
          id: "roles",
          icon: Users,
          title: "Role & Hak Akses",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">4 role: Admin, Lead, Worker, Customer. Login melalui <Code>/admin</Code> &rarr; auto-redirect sesuai role.</p>
              <div className="space-y-3">
                <div className="bg-background rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-red-400" />
                    <h4 className="text-red-400 font-semibold text-sm">ADMIN</h4>
                    <RoleBadge role="admin" />
                  </div>
                  <p className="text-text-muted text-xs mb-2">Akses penuh ke semua fitur.</p>
                  <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                    <li>Dashboard 14 tab: Overview, Orders, Pricing, Boosters, Testi, Portfolio, Promo, Customers, Rewards, Staff, Payroll, Reviews, Reports, Settings</li>
                    <li>CRUD semua data + staff management</li>
                    <li>Konfigurasi integrasi (Midtrans, Telegram, WhatsApp, Email)</li>
                    <li>Payroll: kelola gaji, komisi, payout</li>
                    <li>Reports: P&amp;L, worker performance, export CSV</li>
                    <li>Telegram Bot: confirm/reject order langsung dari chat</li>
                  </ul>
                </div>
                <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <h4 className="text-blue-400 font-semibold text-sm">LEAD</h4>
                    <RoleBadge role="lead" />
                  </div>
                  <p className="text-text-muted text-xs mb-2">Koordinator &mdash; assign order ke worker.</p>
                  <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                    <li>Lihat semua orders + assignment status</li>
                    <li>Assign/reassign order ke worker (single &amp; bulk)</li>
                    <li>Lihat workload per worker</li>
                    <li><strong className="text-text">TIDAK BISA:</strong> settings, pricing, payroll, CMS</li>
                  </ul>
                </div>
                <div className="bg-background rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-4 h-4 text-green-400" />
                    <h4 className="text-green-400 font-semibold text-sm">WORKER</h4>
                    <RoleBadge role="worker" />
                  </div>
                  <p className="text-text-muted text-xs mb-2">Booster &mdash; mengerjakan order yang ditugaskan.</p>
                  <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                    <li>Lihat <strong>hanya</strong> order yang di-assign ke dia</li>
                    <li>Mulai/update progress/selesaikan order</li>
                    <li>Submit hasil match + upload screenshot</li>
                    <li>Lihat credentials akun customer (terenkripsi AES-256)</li>
                    <li><strong className="text-text">TIDAK BISA:</strong> lihat order orang lain, edit data apapun</li>
                  </ul>
                </div>
                <div className="bg-background rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h4 className="text-purple-400 font-semibold text-sm">CUSTOMER</h4>
                    <RoleBadge role="customer" />
                  </div>
                  <p className="text-text-muted text-xs mb-2">Pelanggan yang memesan jasa.</p>
                  <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                    <li>Order jasa, bayar via Midtrans</li>
                    <li>Track progress order</li>
                    <li>Submit review &amp; report worker</li>
                    <li>Reward points, redeem katalog</li>
                    <li>Referral system (dapatkan diskon)</li>
                  </ul>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "order-flow",
          icon: ShoppingCart,
          title: "Alur Order",
          content: (
            <div className="space-y-4">
              <StepFlow steps={[
                { title: "Customer Isi Form Order", desc: "Pilih rank awal ke tujuan, package (Paket/Per-Star/Gendong), credentials akun ML. Apply promo/referral code.", badge: "customer", page: "/order" },
                { title: "Pembayaran Midtrans", desc: "Sistem generate Snap Token, customer bayar via VA, QRIS, Gopay, OVO, dll.", badge: "customer", page: "Midtrans Snap" },
                { title: "Webhook & Auto-Confirm", desc: "Midtrans kirim callback, verifikasi signature, order status confirmed. Reward points ditambahkan.", badge: "auto", page: "/api/payment/notification" },
                { title: "Multi-Channel Notifikasi", desc: "Telegram ke Admin Group (dengan tombol Konfirmasi/Tolak), WhatsApp ke customer, Email konfirmasi.", badge: "auto" },
                { title: "Lead/Admin Assign Order", desc: "Buka Lead Dashboard, pilih worker, Assign. Worker dapat notif Telegram. Atau konfirmasi langsung dari Telegram bot.", badge: "lead", page: "/admin/lead" },
                { title: "Worker Mulai Kerja", desc: "Worker buka dashboard, klik Mulai, status in_progress. Push rank customer.", badge: "worker", page: "/admin/worker" },
                { title: "Worker Update Progress", desc: "Update progress %, current rank. Customer bisa lihat real-time di /track.", badge: "worker" },
                { title: "Worker Submit Hasil", desc: "Input: stars gained, MVP, savage, maniac, wins, durasi. Upload screenshot.", badge: "worker" },
                { title: "Worker Selesai", desc: "Klik Selesai, status completed. Auto-generate commission. Telegram notif ke admin.", badge: "worker" },
                { title: "Customer Review", desc: "Customer dapat link review via WA/Email, rating service & worker, bisa report. Auto-create testimonial jika rating 4-5 bintang.", badge: "customer", page: "/review" },
              ]} />
              <InfoBox type="warning">
                <strong>Status Flow:</strong> pending &rarr; confirmed (bayar) &rarr; in_progress (dikerjakan) &rarr; completed (selesai). Admin bisa cancel kapan saja.
              </InfoBox>
            </div>
          ),
        },
      ],
    },

    // ===================== MANAGEMENT =====================
    {
      id: "management",
      label: "Management",
      catIcon: Crown,
      color: "text-red-400",
      sections: [
        {
          id: "admin-guide",
          icon: Settings,
          title: "Dashboard Admin (14 Tab)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Admin Dashboard berisi 14 tab CMS lengkap.</p>
              <div className="space-y-2">
                {[
                  { tab: "Overview", desc: "KPI metrics: total orders, revenue, pending, completed. Chart trend 7 hari + orders/day bar chart. Refresh 30 detik." },
                  { tab: "Orders", desc: "List semua order + search + filter status. Smart action buttons per status: Follow-up Payment, Request Credentials, Notify Completed, Request Review. Copy order info. 6 template WhatsApp follow-up." },
                  { tab: "Pricing", desc: "3 mode pricing: Paket (bundle rank), Per Star (per bintang), Gendong (duo). Edit harga inline, save all." },
                  { tab: "Boosters", desc: "CRUD booster profiles: nama, WA, specialization, rating, status." },
                  { tab: "Testi", desc: "Kelola testimonial customer. Toggle featured & visibility. Tampil di homepage." },
                  { tab: "Portfolio", desc: "Upload hasil boosting. Before/After rank, gambar (Supabase Storage)." },
                  { tab: "Promo", desc: "CRUD promo code: percentage/fixed, max uses, expiry, tracking." },
                  { tab: "Customers", desc: "Database customer: email, nama, WA, total orders/spent, referral code, reward tier." },
                  { tab: "Rewards", desc: "2 sub-tab: Catalog (CRUD items: skin, diamond, dll) + Redemptions (process pending, completed/rejected)." },
                  { tab: "Staff", desc: "CRUD staff: Admin, Lead, Worker. Set role, active status, password." },
                  { tab: "Payroll", desc: "5 sub-tab: Overview (ringkasan), Commissions (auto-generated, filter worker/status), Salaries (gaji tetap), Payouts (batch pembayaran manual: Dana/OVO/Bank), Settings (commission rate, pay schedule)." },
                  { tab: "Reviews", desc: "Kelola review customer: approve/hide, worker reports (cheating/rude/etc), set report status (resolved/dismissed)." },
                  { tab: "Reports", desc: "3 sub-tab: P&L per bulan (revenue vs expenses, trend 6 bulan), Worker Performance (winrate, earnings, rating), Export CSV (8 jenis data)." },
                  { tab: "Settings", desc: "10 sub-tab: Visibilitas, Hero, Banner, FAQ, Tim, Sosial, Info Situs, Pixels, Integrasi (Midtrans/Telegram/WA/Email), General." },
                ].map((item, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 border border-white/5 flex gap-3 items-start">
                    <span className="text-accent font-bold text-xs w-5 text-center shrink-0">{i + 1}</span>
                    <div>
                      <span className="text-text font-medium text-sm">{item.tab}</span>
                      <p className="text-text-muted text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "payroll",
          icon: Wallet,
          title: "Payroll & Komisi",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Sistem gaji + komisi lengkap. Komisi auto-generated saat order selesai.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Cara Kerja Komisi</h4>
                <StepFlow steps={[
                  { title: "Order Selesai", desc: "Admin/Worker set status ke completed" },
                  { title: "Auto-Generate Commission", desc: "Sistem hitung: total_price x commission_rate (default 60%). Masuk ke tabel commissions dengan periode bi-weekly." },
                  { title: "Review di Dashboard", desc: "Admin buka Payroll, lalu Commissions. Filter by worker, periode, status." },
                  { title: "Buat Payout", desc: "Payroll, Payouts, Generate, pilih worker, pilih items, buat batch payout." },
                  { title: "Bayar Manual", desc: "Pilih payment method (Dana/OVO/BCA/dll), isi reference number, mark as paid." },
                ]} />
              </div>
              <Table headers={["Fitur", "Keterangan"]} rows={[
                ["Commission Rate", "Default 60% dari total_price. Bisa diubah di Payroll Settings"],
                ["Pay Schedule", "Bi-weekly (tgl 1-15 dan 16-akhir bulan)"],
                ["Gaji Tetap", "Untuk staff lead/admin. Set di Salaries, generate per bulan."],
                ["Payment Methods", "11 opsi: Dana, OVO, GoPay, ShopeePay, BCA, BRI, Mandiri, BNI, Jago, SeaBank, Cash"],
                ["Payment Accounts", "Setiap staff bisa punya multiple rekening/e-wallet"],
                ["Payout Approval", "Batch payout: draft, approved, paid, dengan bukti transfer"],
              ]} />
              <InfoBox type="info">
                <strong>Database:</strong> 7 tabel payroll &mdash; <Code>payroll_settings</Code>, <Code>staff_salaries</Code>, <Code>salary_records</Code>, <Code>commissions</Code>, <Code>payouts</Code>, <Code>payout_items</Code>, <Code>staff_payment_accounts</Code>
              </InfoBox>
            </div>
          ),
        },
        {
          id: "reports",
          icon: TrendingUp,
          title: "Financial Reports",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Dashboard &rarr; Reports tab. 3 sub-tab analitik.</p>
              <div className="space-y-3">
                <div className="bg-background rounded-lg p-4 border border-green-500/10">
                  <h4 className="text-green-400 font-medium text-sm mb-2">Profit &amp; Loss</h4>
                  <ul className="text-text-muted text-xs space-y-1 list-disc ml-4">
                    <li>Revenue breakdown: base price + express/premium surcharge - promo discount</li>
                    <li>Expense breakdown: komisi worker (paid/pending) + gaji staff</li>
                    <li>Net profit + profit margin %</li>
                    <li>Perbandingan vs bulan sebelumnya (growth %)</li>
                    <li>Tren 6 bulan terakhir (bar chart revenue vs expenses)</li>
                  </ul>
                </div>
                <div className="bg-background rounded-lg p-4 border border-blue-500/10">
                  <h4 className="text-blue-400 font-medium text-sm mb-2">Worker Performance</h4>
                  <ul className="text-text-muted text-xs space-y-1 list-disc ml-4">
                    <li>Per worker: orders completed, winrate %, revenue generated, earnings</li>
                    <li>Paid vs unpaid earnings</li>
                    <li>Average rating + total reviews</li>
                    <li>All-time stats vs current month</li>
                    <li>Ranking leaderboard</li>
                  </ul>
                </div>
                <div className="bg-background rounded-lg p-4 border border-purple-500/10">
                  <h4 className="text-purple-400 font-medium text-sm mb-2">Export CSV</h4>
                  <ul className="text-text-muted text-xs space-y-1 list-disc ml-4">
                    <li>8 jenis: Orders, Customers, Commissions, Salaries, Payouts, Boosters, Testimonials, Promo Codes</li>
                    <li>Komisi &amp; Gaji bisa filter per bulan</li>
                    <li>Download langsung sebagai .csv file</li>
                  </ul>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "telegram-bot",
          icon: Bot,
          title: "Telegram Bot (Interactive)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Bot interaktif &mdash; kelola order, review, report langsung dari Telegram tanpa buka dashboard.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Bot Commands</h4>
                <Table headers={["Command", "Fungsi"]} rows={[
                  [<Code key="1">/orders</Code>, "Lihat 10 order terbaru"],
                  [<Code key="2">/pending</Code>, "Order menunggu konfirmasi (+ tombol Konfirmasi)"],
                  [<Code key="3">/progress</Code>, "Order sedang dikerjakan"],
                  [<Code key="4">/completed</Code>, "Order selesai (7 hari terakhir)"],
                  [<Code key="5">/stats</Code>, "Statistik: total orders, pending, in progress, revenue bulan ini"],
                  [<Code key="6">/reviews</Code>, "5 review terbaru (+ tombol Show/Hide)"],
                  [<Code key="7">/reports</Code>, "Worker reports terbaru (+ tombol Resolved/Dismiss)"],
                  [<Code key="8">/help</Code>, "Menu bantuan"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Inline Keyboard Actions</h4>
                <Table headers={["Trigger", "Tombol", "Aksi"]} rows={[
                  ["Order baru masuk", "Konfirmasi / Tolak", "Update status langsung + kirim notif ke worker"],
                  ["Order dikonfirmasi", "Mulai Kerjakan / Detail", "Set in_progress atau lihat detail lengkap"],
                  ["Review masuk", "Show / Hide", "Toggle visibility review"],
                  ["Worker report", "Resolved / Dismiss", "Set status report"],
                  ["Detail order", "Konfirmasi / Tolak / Start", "Context-appropriate actions per status"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Setup (sekali saja)</h4>
                <ol className="text-text-muted text-xs space-y-1 list-decimal ml-4">
                  <li>Buat bot di Telegram: chat <Code>@BotFather</Code> &rarr; <Code>/newbot</Code> &rarr; copy token</li>
                  <li>Tambahkan bot ke grup Admin &amp; Worker</li>
                  <li>Masukkan token &amp; chat IDs di Dashboard &rarr; Settings &rarr; Integrations &rarr; Telegram Bot</li>
                  <li>Buka URL: <Code>{"https://etnyx.com/api/telegram/webhook?action=register"}</Code></li>
                  <li>Selesai! Bot aktif dan menerima commands.</li>
                </ol>
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Auto-Notifikasi ke Grup</h4>
                <Table headers={["Event", "Grup", "Pesan"]} rows={[
                  ["Order baru (bayar)", "Admin", "ORDER BARU! + detail + tombol konfirmasi"],
                  ["Order dikonfirmasi", "Worker", "ORDER DIKONFIRMASI! + detail order"],
                  ["Order selesai", "Admin", "ORDER SELESAI! + detail + tombol detail"],
                  ["Review masuk", "Admin", "REVIEW BARU! + rating + tombol show/hide"],
                  ["Worker report", "Admin", "WORKER REPORT! + detail + tombol resolved"],
                  ["Order di-assign", "Worker", "ORDER DITUGASKAN + worker name"],
                ]} />
              </div>
              <InfoBox type="success">
                <strong>Webhook URL:</strong> <Code>/api/telegram/webhook</Code> &mdash; Telegram mengirim update ke URL ini secara otomatis.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "reviews",
          icon: Star,
          title: "Review & Report System",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Customer bisa review layanan + worker setelah order selesai. Bisa juga report worker.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Alur Review</h4>
                <StepFlow steps={[
                  { title: "Order selesai", desc: "Customer dapat link review via WhatsApp & Email" },
                  { title: "Submit review", desc: "Rating service (1-5 bintang) + komentar, Rating worker (1-5 bintang), Report worker (opsional)" },
                  { title: "Auto-testimonial", desc: "Jika rating 4-5 bintang + ada komentar, otomatis masuk testimonial (hidden, perlu approve)" },
                  { title: "Telegram notif", desc: "Admin Group dapat notif dengan tombol Show/Hide" },
                  { title: "Admin kelola", desc: "Dashboard Reviews: approve, hide, set featured. Reports: resolved/dismissed." },
                ]} />
              </div>
              <Table headers={["Report Type", "Label"]} rows={[
                ["cheating", "Bermain curang / cheat"],
                ["offering_services", "Menawarkan jasa di luar ETNYX"],
                ["rude", "Kasar / tidak sopan"],
                ["account_issue", "Masalah akun"],
                ["other", "Lainnya"],
              ]} />
            </div>
          ),
        },
        {
          id: "rewards",
          icon: Gift,
          title: "Reward & Loyalty",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Sistem poin &amp; tier untuk customer loyal. Otomatis dapat poin saat order selesai.</p>
              <Table headers={["Tier", "Min Poin", "Diskon", "Benefit"]} rows={[
                ["Bronze", "0", "0%", "Akses dasar"],
                ["Silver", "50", "2%", "Diskon otomatis"],
                ["Gold", "200", "5%", "Diskon + prioritas"],
                ["Platinum", "500", "10%", "Diskon max + VIP"],
              ]} />
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Earning &amp; Redeem</h4>
                <ul className="text-text-muted text-xs space-y-1 list-disc ml-4">
                  <li><strong>Earning:</strong> 1 poin per Rp 10.000 yang dibelanjakan (auto saat order complete)</li>
                  <li><strong>Referral bonus:</strong> Referrer dapat bonus poin saat teman menyelesaikan order</li>
                  <li><strong>Katalog:</strong> Admin buat items (skin, diamond, dll), customer redeem dengan poin</li>
                  <li><strong>Proses:</strong> Redemption masuk ke admin, approve/reject</li>
                </ul>
              </div>
            </div>
          ),
        },
      ],
    },

    // ===================== LEAD =====================
    {
      id: "lead",
      label: "Lead",
      catIcon: Users,
      color: "text-blue-400",
      sections: [
        {
          id: "lead-guide",
          icon: UserCheck,
          title: "Panduan Lead",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Panduan untuk Lead &mdash; koordinator yang mengatur distribusi order ke worker.</p>
              <div className="space-y-3">
                {[
                  { step: "1. Login", desc: "Buka /admin, login. Otomatis redirect ke Lead Dashboard (/admin/lead)." },
                  { step: "2. Cek Order Masuk", desc: "Dashboard menampilkan: Total Orders, Belum Assign (kuning), In Progress, Completed. Search by order ID / username / game ID." },
                  { step: "3. Lihat Worker", desc: "Panel Tim Worker — semua worker aktif + jumlah order aktif. Distribusi merata." },
                  { step: "4. Assign Order", desc: "Klik order belum assign, Assign Worker, pilih worker, tulis catatan, Assign. Worker dapat notif Telegram." },
                  { step: "5. Bulk Assign", desc: "Centang beberapa order, pilih worker, Assign Selected. Efisien untuk banyak order baru." },
                  { step: "6. Order Notes", desc: "Tambahkan catatan internal. Terlihat oleh semua staff." },
                  { step: "7. Monitor Progress", desc: "Pantau status & progress setiap order. Filter by status." },
                ].map((item, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 border border-blue-500/10">
                    <h4 className="text-blue-400 font-medium text-sm">{item.step}</h4>
                    <p className="text-text-muted text-xs mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <InfoBox type="info">
                <strong>Tips:</strong> Distribusi berdasarkan skill worker (lihat history). Jangan stack terlalu banyak ke 1 worker. Gunakan Telegram untuk koordinasi cepat.
              </InfoBox>
            </div>
          ),
        },
      ],
    },

    // ===================== WORKER =====================
    {
      id: "worker",
      label: "Worker",
      catIcon: Gamepad2,
      color: "text-green-400",
      sections: [
        {
          id: "worker-guide",
          icon: Wrench,
          title: "Panduan Worker",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Panduan untuk worker (booster) yang mengerjakan order.</p>
              <div className="space-y-3">
                {[
                  { step: "1. Login", desc: "Buka /admin, masukkan email & password. Otomatis ke Worker Dashboard." },
                  { step: "2. Lihat Order", desc: "Dashboard menampilkan order yang di-assign ke kamu. 3 kategori: Menunggu, Aktif, Selesai." },
                  { step: "3. Lihat Credentials", desc: "Klik Credentials, lihat akun ML customer. Data terenkripsi AES-256, hanya bisa dilihat untuk order kamu." },
                  { step: "4. Mulai Order", desc: "Klik Mulai, status jadi in_progress. Customer bisa track real-time." },
                  { step: "5. Update Progress", desc: "Geser slider 0-100%, pilih rank yang dicapai. Customer lihat di /track." },
                  { step: "6. Submit Hasil", desc: "Isi: stars gained, MVP, savage, maniac, wins, durasi. Upload screenshot. Bisa edit/hapus dalam 30 menit." },
                  { step: "7. Selesai", desc: "Klik Selesai, status completed. Komisi auto-generated. Admin dapat notif Telegram." },
                ].map((item, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 border border-green-500/10">
                    <h4 className="text-green-400 font-medium text-sm">{item.step}</h4>
                    <p className="text-text-muted text-xs mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <InfoBox type="warning">
                <strong>Aturan Worker:</strong>
                <ul className="mt-1 space-y-0.5">
                  <li>&#8226; Hanya bisa lihat order yang di-assign ke kamu</li>
                  <li>&#8226; Submit screenshot setiap sesi bermain</li>
                  <li>&#8226; Edit/hapus submission hanya 30 menit setelah submit</li>
                  <li>&#8226; Jangan share credentials customer ke siapapun</li>
                  <li>&#8226; Komisi masuk otomatis saat order selesai (60% dari total)</li>
                </ul>
              </InfoBox>
            </div>
          ),
        },
      ],
    },

    // ===================== DEVELOPER =====================
    {
      id: "developer",
      label: "Developer",
      catIcon: Monitor,
      color: "text-accent",
      sections: [
        {
          id: "api",
          icon: Server,
          title: "API Routes (58+)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">58+ API routes. Auth via JWT cookie (HTTPOnly). Rate limited via middleware.</p>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">{"Admin API"} <Code>/api/admin/*</Code></h4>
                <Table headers={["Endpoint", "Methods", "Deskripsi"]} rows={[
                  ["/api/admin/auth", "POST/GET/DELETE", "Login/session/logout"],
                  ["/api/admin/orders", "GET/POST/PATCH", "CRUD orders + status update + auto-commission"],
                  ["/api/admin/orders/credentials", "GET", "View encrypted credentials"],
                  ["/api/admin/orders/follow-up", "POST", "Smart WA follow-up (6 templates)"],
                  ["/api/admin/stats", "GET", "KPI metrics"],
                  ["/api/admin/chart-data", "GET", "Revenue chart data"],
                  ["/api/admin/settings", "GET/PUT", "Key-value config (CMS, integrations)"],
                  ["/api/admin/testimonials", "GET/POST/PUT/DELETE", "CRUD testimonials"],
                  ["/api/admin/portfolio", "GET/POST/PUT/DELETE", "CRUD portfolio"],
                  ["/api/admin/promo-codes", "GET/POST/PUT/DELETE", "CRUD promo codes"],
                  ["/api/admin/boosters", "GET/POST/PUT/DELETE", "CRUD boosters"],
                  ["/api/admin/customers", "GET", "List customers"],
                  ["/api/admin/reviews", "GET/PATCH/DELETE", "Manage reviews & reports"],
                  ["/api/admin/rewards", "GET/POST", "Process reward redemptions"],
                  ["/api/admin/rewards/catalog", "GET/POST/PUT/DELETE", "CRUD reward catalog"],
                  ["/api/admin/reports", "GET", "P&L, trend, worker performance"],
                  ["/api/admin/export", "GET", "CSV export (8 types)"],
                  ["/api/admin/upload", "POST", "File upload to Supabase Storage"],
                  ["/api/admin/notify", "POST", "Manual notification"],
                  ["/api/admin/test-notifications", "POST", "Test notification channels"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">{"Payroll API"} <Code>/api/admin/payroll/*</Code></h4>
                <Table headers={["Endpoint", "Methods", "Deskripsi"]} rows={[
                  ["/api/admin/payroll", "GET", "Overview: unpaid commissions, unpaid salaries, total payouts"],
                  ["/api/admin/payroll/commissions", "GET", "List commissions (filter: worker, status, period)"],
                  ["/api/admin/payroll/salaries", "GET/POST", "Salary configs + records. Generate monthly records."],
                  ["/api/admin/payroll/payouts", "GET/POST", "Batch payouts lifecycle (draft to paid)"],
                  ["/api/admin/payroll/payment-accounts", "GET/POST", "Staff payment accounts (Dana/OVO/Bank)"],
                  ["/api/admin/payroll/settings", "GET/PUT", "Commission rate, pay schedule config"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">{"Staff API"} <Code>/api/staff/*</Code></h4>
                <Table headers={["Endpoint", "Methods", "Akses"]} rows={[
                  ["/api/staff/auth", "POST/GET/DELETE", "All staff"],
                  ["/api/staff/users", "GET/POST/PUT/DELETE", "Admin + Lead"],
                  ["/api/staff/orders", "GET/POST/PUT", "Role-filtered"],
                  ["/api/staff/submissions", "GET/POST/PUT/DELETE", "Worker (30min edit window)"],
                  ["/api/staff/credentials", "GET", "Worker (assigned only)"],
                  ["/api/staff/notes", "GET/POST", "All staff"],
                  ["/api/staff/upload", "POST", "All staff"],
                  ["/api/staff/reset-password", "POST/PUT", "Public (email token)"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">{"Customer API"} <Code>/api/customer/*</Code></h4>
                <Table headers={["Endpoint", "Methods", "Deskripsi"]} rows={[
                  ["/api/customer/auth", "POST/GET/DELETE", "Register/Login/Check/Logout"],
                  ["/api/customer/order", "POST", "Create order + Midtrans snap token"],
                  ["/api/customer/orders", "GET", "My order history"],
                  ["/api/customer/verify", "GET", "Email verification link"],
                  ["/api/customer/resend-verify", "POST", "Resend verification email"],
                  ["/api/customer/rewards", "GET/POST", "Points balance + redeem"],
                  ["/api/customer/rewards/catalog", "GET/POST", "Browse + redeem catalog"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">{"Public API & Webhooks"}</h4>
                <Table headers={["Endpoint", "Methods", "Deskripsi"]} rows={[
                  ["/api/payment", "POST", "Create Midtrans transaction"],
                  ["/api/payment/notification", "POST", "Midtrans webhook (signature verify)"],
                  ["/api/payment/test-connection", "POST", "Test Midtrans keys"],
                  ["/api/telegram/webhook", "POST/GET", "Telegram bot webhook + register"],
                  ["/api/track", "GET", "Public order tracking"],
                  ["/api/review", "GET/POST", "Customer review submission"],
                  ["/api/settings", "GET", "Public CMS settings"],
                  ["/api/testimonials", "GET", "Public testimonials"],
                  ["/api/portfolio", "GET", "Public portfolio"],
                  ["/api/promo", "POST", "Validate promo code"],
                  ["/api/referral", "POST/GET", "Validate referral code"],
                  ["/api/health", "GET", "Health check"],
                  ["/api/invoice", "GET", "Generate HTML invoice"],
                  ["/api/chat", "GET/POST", "Order chat messages"],
                  ["/api/push/subscribe", "POST", "Save push subscription"],
                  ["/api/push/send", "POST", "Send push notification (admin)"],
                ]} />
              </div>
            </div>
          ),
        },
        {
          id: "database",
          icon: Database,
          title: "Database Schema",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Supabase PostgreSQL. 20+ tabel. Admin operations via service role (bypass RLS).</p>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Core Tables</h4>
                <Table headers={["Tabel", "Purpose", "Key Columns"]} rows={[
                  [<strong key="1" className="text-text">orders</strong>, "Data order customer", "order_id, username, current_rank, target_rank, status, progress, total_price, assigned_worker_id"],
                  [<strong key="2" className="text-text">order_logs</strong>, "Audit trail", "order_id, action, old_value, new_value, created_by"],
                  [<strong key="3" className="text-text">customers</strong>, "Data pelanggan", "email, name, whatsapp, referral_code, reward_points, reward_tier"],
                  [<strong key="4" className="text-text">staff_users</strong>, "Users internal (RBAC)", "email, name, password_hash, role (admin/lead/worker)"],
                  [<strong key="5" className="text-text">order_assignments</strong>, "Assignment order ke worker", "order_id, assigned_to, assigned_by"],
                  [<strong key="6" className="text-text">worker_submissions</strong>, "Hasil kerja booster", "order_id, worker_id, stars_gained, mvp_count, screenshots"],
                  [<strong key="7" className="text-text">settings</strong>, "Konfigurasi key-value", "key (string), value (JSONB)"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Content Tables</h4>
                <Table headers={["Tabel", "Purpose"]} rows={[
                  [<strong key="1" className="text-text">testimonials</strong>, "Review customer (featured/visible)"],
                  [<strong key="2" className="text-text">portfolio</strong>, "Showcase hasil kerja + images"],
                  [<strong key="3" className="text-text">boosters</strong>, "Booster profiles"],
                  [<strong key="4" className="text-text">promo_codes</strong>, "Kode diskon (percentage/fixed)"],
                  [<strong key="5" className="text-text">reviews</strong>, "Service + worker rating, reports"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Payroll Tables</h4>
                <Table headers={["Tabel", "Purpose"]} rows={[
                  [<strong key="1" className="text-text">payroll_settings</strong>, "Commission rate, pay schedule, payment methods"],
                  [<strong key="2" className="text-text">staff_salaries</strong>, "Salary config per staff (amount, frequency)"],
                  [<strong key="3" className="text-text">salary_records</strong>, "Monthly salary records"],
                  [<strong key="4" className="text-text">commissions</strong>, "Auto-generated per completed order"],
                  [<strong key="5" className="text-text">payouts</strong>, "Batch payout (draft to paid)"],
                  [<strong key="6" className="text-text">payout_items</strong>, "Items in payout (commission/salary refs)"],
                  [<strong key="7" className="text-text">staff_payment_accounts</strong>, "Worker e-wallet/bank accounts"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Reward Tables</h4>
                <Table headers={["Tabel", "Purpose"]} rows={[
                  [<strong key="1" className="text-text">reward_catalog</strong>, "Items available for redemption"],
                  [<strong key="2" className="text-text">reward_redemptions</strong>, "Customer redemption requests"],
                  [<strong key="3" className="text-text">reward_transactions</strong>, "Points earning/spending history"],
                  [<strong key="4" className="text-text">referrals</strong>, "Referral tracking"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Other Tables</h4>
                <Table headers={["Tabel", "Purpose"]} rows={[
                  [<strong key="1" className="text-text">admin_audit_log</strong>, "Admin action audit trail"],
                  [<strong key="2" className="text-text">push_subscriptions</strong>, "Web push notification subscriptions"],
                  [<strong key="3" className="text-text">chat_messages</strong>, "Order chat messages"],
                ]} />
              </div>
              <InfoBox type="info">
                <strong>Schema Files:</strong> v8 (storage), v9 (order logs), v10 (rewards), v11 (staff), v12 (reviews), v13 (payroll), v14 (payment methods). Run sequentially via Supabase SQL Editor.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "notifications",
          icon: Bell,
          title: "Notification System",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">4 channel + interactive Telegram bot. Konfigurasi di Dashboard &rarr; Settings &rarr; Integrations.</p>
              <Table headers={["Channel", "Provider", "Penerima", "Events"]} rows={[
                ["Telegram Admin", "Bot API (webhook)", "Admin Group", "Order baru (+ tombol), selesai, review, report"],
                ["Telegram Worker", "Bot API", "Worker Group", "Order dikonfirmasi, order di-assign"],
                ["WhatsApp", "Fonnte API", "Customer", "Konfirmasi bayar, mulai dikerjakan, selesai, follow-up"],
                ["Email", "Resend", "Customer", "Konfirmasi bayar, invoice, verification, password reset"],
                ["Web Push", "VAPID", "Subscribers", "Manual push dari admin"],
              ]} />
              <InfoBox type="success">
                <strong>Test Notifications:</strong> POST <Code>/api/admin/test-notifications</Code> &mdash; test per channel: telegram_admin, telegram_worker, whatsapp, email.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "payment",
          icon: CreditCard,
          title: "Payment Gateway",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Midtrans Snap API. Sandbox/Production toggle dari dashboard.</p>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Alur Teknis</h4>
                <ol className="text-text-muted text-xs space-y-1 list-decimal ml-4">
                  <li>Frontend POST ke <Code>/api/customer/order</Code> dengan data order</li>
                  <li>Backend buat Snap Token via <Code>{"snap.createTransaction()"}</Code></li>
                  <li>Return <Code>snap_url</Code> &rarr; customer redirect / popup</li>
                  <li>Customer bayar &rarr; Midtrans POST webhook ke <Code>/api/payment/notification</Code></li>
                  <li>Verifikasi: <Code>{"SHA512(order_id + status_code + gross_amount + serverKey)"}</Code></li>
                  <li>Update order status &rarr; trigger notifikasi multi-channel</li>
                </ol>
              </div>
              <Table headers={["Setting", "Lokasi"]} rows={[
                ["Server Key", "Dashboard > Settings > Integrations"],
                ["Client Key", "Dashboard > Settings > Integrations"],
                ["Environment", "Toggle Sandbox / Production"],
                ["Payment Channels", "Enable/disable VA, Gopay, QRIS, dll"],
                ["Notification URL", "Set di Midtrans Dashboard"],
              ]} />
            </div>
          ),
        },
        {
          id: "pricing",
          icon: BarChart3,
          title: "Pricing System",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">3 mode pricing, dikelola dari Dashboard &rarr; Pricing tab.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-background rounded-lg p-3 border border-white/5">
                  <h4 className="text-text font-medium text-sm mb-1">Paket</h4>
                  <p className="text-text-muted text-[11px]">Bundle rank A ke B. Harga tetap.</p>
                </div>
                <div className="bg-background rounded-lg p-3 border border-white/5">
                  <h4 className="text-text font-medium text-sm mb-1">Per Star</h4>
                  <p className="text-text-muted text-[11px]">Harga per bintang, tiap tier beda.</p>
                </div>
                <div className="bg-background rounded-lg p-3 border border-white/5">
                  <h4 className="text-text font-medium text-sm mb-1">Gendong</h4>
                  <p className="text-text-muted text-[11px]">Duo &mdash; main bareng booster.</p>
                </div>
              </div>
              <Table headers={["Modifier", "Multiplier", "Keterangan"]} rows={[
                ["Express", "1.2x", "Pengerjaan diprioritaskan"],
                ["Premium", "1.3x", "High WR booster + hero request"],
              ]} />
            </div>
          ),
        },
        {
          id: "security",
          icon: Shield,
          title: "Security",
          content: (
            <div className="space-y-4">
              <Table headers={["Layer", "Mekanisme", "Detail"]} rows={[
                ["Auth", "JWT (JOSE)", "HTTPOnly cookie, expire 24h"],
                ["Password", "Bcrypt (12 rounds)", "Hash stored, never plaintext"],
                ["Rate Limiting", "Sliding window", "100 req/60s, 10 req/5min auth"],
                ["Input", "Sanitize + DOMPurify", "XSS, SQLi, template injection blocking"],
                ["Credentials", "AES-256-GCM", "Game login encrypted at rest"],
                ["Middleware", "Pattern matching", "Block path traversal, bot paths, injection"],
                ["RLS", "Supabase", "Row Level Security on all tables"],
                ["Headers", "CSP, HSTS, X-Frame", "next.config.ts"],
                ["Audit", "logAdminAction()", "Admin actions logged to admin_audit_log"],
                ["Signature", "SHA-512", "Midtrans payment webhook verification"],
              ]} />
            </div>
          ),
        },
        {
          id: "env",
          icon: Lock,
          title: "Environment Variables",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Set di Vercel &rarr; Settings &rarr; Environment Variables.</p>
              <Table headers={["Variable", "Wajib", "Keterangan"]} rows={[
                ["NEXT_PUBLIC_SUPABASE_URL", "Ya", "URL Supabase"],
                ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Ya", "Anon key"],
                ["SUPABASE_SERVICE_ROLE_KEY", "Ya", "Service role (JANGAN expose)"],
                ["JWT_SECRET", "Ya", "Customer JWT (min 32 char)"],
                ["ADMIN_JWT_SECRET", "Ya", "Staff JWT"],
                ["ADMIN_EMAIL", "Ya", "Admin login email"],
                ["ADMIN_PASSWORD_HASH", "Ya", "Bcrypt hash"],
                ["ENCRYPTION_KEY", "Ya", "AES-256 key (32 char)"],
                ["NEXT_PUBLIC_SITE_URL", "Ya", "Production URL"],
                ["MIDTRANS_SERVER_KEY", "Opsional", "Bisa set dari Dashboard"],
                ["RESEND_API_KEY", "Opsional", "Bisa set dari Dashboard"],
                ["FONNTE_API_TOKEN", "Opsional", "Bisa set dari Dashboard"],
                ["PUBLIC_VAPID_KEY", "Opsional", "Web push"],
                ["PRIVATE_VAPID_KEY", "Opsional", "Web push"],
              ]} />
              <InfoBox type="success">
                <strong>Tip:</strong> Midtrans, Telegram, Fonnte, Resend keys bisa dikelola dari Dashboard Integrations tanpa redeploy.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "deployment",
          icon: Zap,
          title: "Deployment",
          content: (
            <div className="space-y-4">
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Deploy Flow</h4>
                <ol className="text-text-muted text-xs space-y-1 list-decimal ml-4">
                  <li>Push ke branch <Code>main</Code></li>
                  <li>Vercel auto-build: <Code>{"cd etnyx && npm run build"}</Code></li>
                  <li>Output deploy ke Vercel Edge</li>
                  <li>URL: <Code>etnyx.vercel.app</Code> (atau custom domain)</li>
                </ol>
              </div>
              <Table headers={["Command", "Fungsi"]} rows={[
                [<Code key="1">npm run dev</Code>, "Dev server (Turbopack, port 3000)"],
                [<Code key="2">npm run build</Code>, "Production build"],
                [<Code key="3">git push origin main</Code>, "Trigger Vercel deploy"],
              ]} />
            </div>
          ),
        },
        {
          id: "file-structure",
          icon: Layers,
          title: "File Structure",
          content: (
            <div className="space-y-4">
              <pre className="bg-background rounded-lg p-4 border border-white/5 text-text-muted text-xs font-mono whitespace-pre overflow-x-auto leading-relaxed">{`etnyx/src/
\u251C\u2500\u2500 app/
\u2502   \u251C\u2500\u2500 layout.tsx              # Root layout + SEO
\u2502   \u251C\u2500\u2500 page.tsx                # Homepage (9 sections)
\u2502   \u251C\u2500\u2500 globals.css             # Tailwind + theme
\u2502   \u251C\u2500\u2500 robots.ts / sitemap.ts  # SEO
\u2502   \u2502
\u2502   \u251C\u2500\u2500 (customer)/             # Customer routes
\u2502   \u2502   \u251C\u2500\u2500 login / register / dashboard
\u2502   \u2502   \u2514\u2500\u2500 bio / privacy / terms
\u2502   \u2502
\u2502   \u251C\u2500\u2500 admin/                  # Staff panel
\u2502   \u2502   \u251C\u2500\u2500 page.tsx            # Login (all roles)
\u2502   \u2502   \u251C\u2500\u2500 dashboard/          # Admin (page + PayrollTab + ReportsTab + SettingsTab)
\u2502   \u2502   \u251C\u2500\u2500 lead/               # Lead dashboard
\u2502   \u2502   \u251C\u2500\u2500 worker/             # Worker dashboard
\u2502   \u2502   \u2514\u2500\u2500 docs/               # This docs page
\u2502   \u2502
\u2502   \u251C\u2500\u2500 order/ track/ review/ payment/  # Public pages
\u2502   \u2502
\u2502   \u2514\u2500\u2500 api/                    # 58+ API routes
\u2502       \u251C\u2500\u2500 admin/              # 20 admin endpoints
\u2502       \u2502   \u2514\u2500\u2500 payroll/        # 6 payroll endpoints
\u2502       \u251C\u2500\u2500 staff/              # 8 staff endpoints
\u2502       \u251C\u2500\u2500 customer/           # 7 customer endpoints
\u2502       \u251C\u2500\u2500 telegram/webhook/   # Interactive bot
\u2502       \u2514\u2500\u2500 payment/ track/ review/ ...  # Public endpoints
\u2502
\u251C\u2500\u2500 components/                 # 32+ components
\u2502   \u251C\u2500\u2500 sections/               # 9 homepage sections
\u2502   \u251C\u2500\u2500 layout/                 # Navbar, Footer, FloatingCTA
\u2502   \u2514\u2500\u2500 (standalone)            # ThemeToggle, Portfolio, Chat, etc
\u2502
\u251C\u2500\u2500 lib/                        # Utilities & auth
\u2502   \u251C\u2500\u2500 admin-auth.ts           # Admin JWT verify
\u2502   \u251C\u2500\u2500 staff-auth.ts           # Staff RBAC verify
\u2502   \u251C\u2500\u2500 notifications.ts        # Telegram + WA + Email + Push
\u2502   \u251C\u2500\u2500 encryption.ts           # AES-256-GCM
\u2502   \u251C\u2500\u2500 validation.ts           # Input sanitization
\u2502   \u251C\u2500\u2500 audit-log.ts            # Admin audit logging
\u2502   \u251C\u2500\u2500 supabase-server.ts      # Server clients
\u2502   \u251C\u2500\u2500 constants.ts            # Ranks, tiers, config
\u2502   \u251C\u2500\u2500 email.ts                # Resend service
\u2502   \u2514\u2500\u2500 i18n/                   # ID + EN translations
\u2502
\u251C\u2500\u2500 types/ utils/ contexts/     # Types, helpers, providers
\u2514\u2500\u2500 middleware.ts                # Rate limiting + security`}</pre>
            </div>
          ),
        },
      ],
    },
  ];
}

// ============================================================
// MAIN DOCS PAGE
// ============================================================
export default function DocsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const categories = buildCategories();
  const allSections = categories.flatMap(c => c.sections);

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/auth");
      if (!res.ok) { router.push("/admin"); return false; }
      return true;
    } catch { router.push("/admin"); return false; }
  }, [router]);

  useEffect(() => {
    checkAuth().then((ok) => { if (ok) setLoading(false); });
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Image src="/logo/circle-landscape.webp" alt="ETNYX" width={140} height={40} priority />
          <div className="mt-6 w-48 h-1.5 bg-surface rounded-full overflow-hidden mx-auto">
            <div className="h-full gradient-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  const currentSection = allSections.find(s => s.id === activeSection) || allSections[0];
  const currentCategory = categories.find(c => c.sections.some(s => s.id === activeSection));

  const filteredCategories = searchQuery
    ? categories.map(c => ({
        ...c,
        sections: c.sections.filter(s =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(c => c.sections.length > 0)
    : categories;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 z-30 bg-surface border-r border-white/5 transition-all duration-200 ${sidebarOpen ? "w-72" : "w-0 -translate-x-full"} overflow-y-auto`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-accent" />
              <h1 className="text-text font-bold text-sm">ETNYX DOCS</h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">v2.0</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-text-muted hover:text-text p-1">
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dokumentasi..."
              className="w-full bg-background/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        <nav className="py-2">
          {filteredCategories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-white/[0.02] transition-colors"
              >
                <span className={`flex items-center gap-2 ${cat.color}`}>
                  <cat.catIcon className="w-4 h-4" />
                  {cat.label}
                </span>
                <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${collapsedCategories[cat.id] ? "-rotate-90" : ""}`} />
              </button>

              {!collapsedCategories[cat.id] && cat.sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSection(s.id); setSearchQuery(""); }}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-4 py-2 text-xs transition-all ${
                    activeSection === s.id
                      ? "text-accent bg-accent/10 border-r-2 border-accent"
                      : "text-text-muted hover:text-text hover:bg-white/[0.03]"
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-left truncate">{s.title}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button onClick={() => router.push("/admin/dashboard")} className="flex items-center gap-2 text-text-muted hover:text-text text-xs transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/5">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-200 ${sidebarOpen ? "ml-72" : "ml-0"}`}>
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-3 flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-text-muted hover:text-text p-1">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              {currentCategory && <currentCategory.catIcon className="w-3.5 h-3.5 text-text-muted" />}
              <span className="text-text-muted text-xs">{currentCategory?.label}</span>
              <ChevronRight className="w-3 h-3 text-text-muted/50" />
              <currentSection.icon className="w-4 h-4 text-accent" />
              <h2 className="text-text font-semibold text-sm">{currentSection.title}</h2>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 max-w-4xl">
          {currentSection.content}
        </div>

        <div className="px-6 pb-8 max-w-4xl">
          <div className="flex justify-between border-t border-white/5 pt-4">
            {(() => {
              const idx = allSections.findIndex(s => s.id === activeSection);
              const prev = idx > 0 ? allSections[idx - 1] : null;
              const next = idx < allSections.length - 1 ? allSections[idx + 1] : null;
              return (
                <>
                  {prev ? (
                    <button onClick={() => setActiveSection(prev.id)} className="flex items-center gap-2 text-text-muted hover:text-accent text-xs transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" /> {prev.title}
                    </button>
                  ) : <div />}
                  {next ? (
                    <button onClick={() => setActiveSection(next.id)} className="flex items-center gap-2 text-text-muted hover:text-accent text-xs transition-colors">
                      {next.title} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-white/5">
          <p className="text-text-muted/40 text-[10px] text-center">
            ETNYX Documentation v2.0 &mdash; {allSections.length} sections across {categories.length} categories
          </p>
        </footer>
      </main>
    </div>
  );
}
