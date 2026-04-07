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
  Megaphone, Target, MousePointerClick, MessageCircle,
  Clock, FileText, AlertTriangle, HelpCircle, Rocket,
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
                <StatCard label="API Routes" value="60+" sub="RESTful endpoints" />
                <StatCard label="Dashboard Tabs" value="15" sub="Admin CMS" />
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
                    <li>&#8226; <strong className="text-text">Google Analytics 4</strong> &mdash; Website Analytics</li>
                    <li>&#8226; <strong className="text-text">Meta/TikTok/Google Pixel</strong> &mdash; Conversion tracking</li>
                    <li>&#8226; <strong className="text-text">Meta CAPI</strong> &mdash; Server-side conversion API</li>
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
                    <li>Dashboard 15 tab: Overview, Orders, Pricing, Boosters, Testi, Portfolio, Promo, Customers, Rewards, Staff, Payroll, Reviews, Reports, Ads, Settings</li>
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
                  <p className="text-text-muted text-xs mb-2">Koordinator &mdash; manage tim worker masing-masing.</p>
                  <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                    <li>Lihat semua orders + assignment status</li>
                    <li>Assign/reassign order ke <strong>worker tim sendiri</strong> (single &amp; bulk)</li>
                    <li>Lihat workload per worker <strong>dalam tim</strong></li>
                    <li>Worker list otomatis difilter berdasarkan <Code>lead_id</Code></li>
                    <li><strong className="text-text">TIDAK BISA:</strong> settings, pricing, payroll, CMS, lihat worker tim lain</li>
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
                    <li>Track progress order + lihat hasil boosting (MVP, Savage, screenshot)</li>
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
                { title: "Pilih Metode Bayar", desc: "2 opsi: Transfer Manual (BCA, BRI, BNI, Mandiri, Jago, DANA, GoPay, OVO, ShopeePay, LinkAja, QRIS) atau Midtrans Auto (VA, QRIS, GoPay, ShopeePay, CC).", badge: "customer", page: "/order (step 3)" },
                { title: "A) Transfer Manual", desc: "Auto-redirect ke /payment/manual — lihat daftar rekening + upload bukti transfer. Admin approve/reject bukti.", badge: "customer", page: "/payment/manual" },
                { title: "B) Midtrans Auto", desc: "Snap Token di-generate, customer bayar via popup/redirect. Webhook otomatis confirm.", badge: "customer", page: "Midtrans Snap" },
                { title: "Pembayaran Dikonfirmasi", desc: "Manual: admin approve bukti. Midtrans: webhook auto-confirm. Status: confirmed, payment: paid. WA 'Pembayaran Dikonfirmasi' + Telegram ke Worker Group.", badge: "auto", page: "/api/payment/notification" },
                { title: "Multi-Channel Notifikasi", desc: "Telegram ke Admin Group (dengan tombol Konfirmasi/Tolak), WhatsApp 'Pembayaran Dikonfirmasi' ke customer, Telegram ke Worker Group.", badge: "auto" },
                { title: "Lead/Admin Assign Order", desc: "Buka Lead Dashboard, pilih worker, Assign. Worker dapat notif Telegram. Atau konfirmasi langsung dari Telegram bot.", badge: "lead", page: "/admin/lead" },
                { title: "Worker Mulai Kerja", desc: "Worker buka dashboard, klik Mulai, status in_progress. WA 'Sedang Dikerjakan' ke customer. Push rank customer.", badge: "worker", page: "/admin/worker" },
                { title: "Worker Update Progress", desc: "Update progress %, current rank. Customer bisa lihat real-time di /track.", badge: "worker" },
                { title: "Worker Submit Hasil", desc: "Input: stars gained, MVP, savage, maniac, wins, durasi. Upload screenshot. Customer bisa lihat langsung di /track.", badge: "worker" },
                { title: "Worker Selesai", desc: "Klik Selesai, status completed. Auto-generate commission. Telegram notif ke admin. WA 'Order Selesai' + link review ke customer.", badge: "worker" },
                { title: "Customer Review", desc: "Customer dapat link review via WA/Email, rating service & worker, bisa report. Auto-create testimonial jika rating 4-5 bintang.", badge: "customer", page: "/review" },
              ]} />
              <InfoBox type="info">
                <strong>Dual Payment:</strong> Transfer Manual muncul di /payment/manual setelah order dibuat. Midtrans Auto muncul jika Server Key dikonfigurasi di Settings &rarr; Integrations.
              </InfoBox>
              <InfoBox type="warning">
                <strong>Status Flow:</strong> pending &rarr; confirmed (bayar dikonfirmasi) &rarr; in_progress (dikerjakan) &rarr; completed (selesai). Admin bisa cancel kapan saja.
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
          title: "Dashboard Admin (15 Tab)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Admin Dashboard berisi 15 tab CMS lengkap.</p>
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
                  { tab: "Staff", desc: "CRUD staff: Admin, Lead, Worker. Set role, active status, password. Assign worker ke lead (tim hierarchy via lead_id)." },
                  { tab: "Payroll", desc: "5 sub-tab: Overview (ringkasan), Commissions (auto-generated, filter worker/status), Salaries (gaji tetap), Payouts (batch pembayaran manual: Dana/OVO/Bank), Settings (commission rate, pay schedule)." },
                  { tab: "Reviews", desc: "Kelola review customer: approve/hide, worker reports (cheating/rude/etc), set report status (resolved/dismissed)." },
                  { tab: "Reports", desc: "3 sub-tab: P&L per bulan (revenue vs expenses, trend 6 bulan), Worker Performance (winrate, earnings, rating), Export CSV (8 jenis data)." },
                  { tab: "Ads", desc: "Ad Performance dashboard: Total Spend, Revenue, Profit/Loss, ROAS, CPA. Per-platform breakdown, campaign drill-down, ad spend log." },
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
          id: "conversion-tracking",
          icon: MousePointerClick,
          title: "Conversion Tracking & Pixels",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Full-funnel conversion tracking ke 3 platform sekaligus. Semua dikelola dari Dashboard &rarr; Settings &rarr; Pixels.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Conversion Funnel</h4>
                <StepFlow steps={[
                  { title: "PageView", desc: "Otomatis di setiap halaman (Meta fbq, TikTok ttq.page)", badge: "auto" },
                  { title: "ViewContent", desc: "Customer buka halaman /order", page: "/order" },
                  { title: "AddToCart", desc: "Customer pilih paket atau klik Lanjut dari step 1", page: "/order (step 1 → 2)" },
                  { title: "InitiateCheckout", desc: "Customer submit order (step 4 Konfirmasi)", page: "/order (step 4)" },
                  { title: "Purchase", desc: "Setelah bayar via Midtrans, redirect ke success page", page: "/payment/success" },
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Event Mapping per Platform</h4>
                <Table headers={["Event", "Meta Pixel (fbq)", "Google (gtag)", "TikTok (ttq)"]} rows={[
                  ["PageView", "PageView", "page_view", "page"],
                  ["ViewContent", "ViewContent", "view_item", "ViewContent"],
                  ["AddToCart", "AddToCart", "add_to_cart", "AddToCart"],
                  ["InitiateCheckout", "InitiateCheckout", "begin_checkout", "InitiateCheckout"],
                  ["Purchase", "Purchase", "purchase + conversion", "CompletePayment"],
                  ["Lead", "Lead", "generate_lead", "SubmitForm"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Pixel Dashboard Settings</h4>
                <Table headers={["Pixel", "Toggle", "Fields"]} rows={[
                  ["Google Tag Manager", "isGtmEnabled", "GTM Container ID (GTM-XXXXXXX)"],
                  ["Meta (Facebook) Pixel", "isMetaEnabled", "Pixel ID + Access Token (untuk CAPI)"],
                  ["Google Ads", "isGoogleAdsEnabled", "Google Ads ID (AW-xxx) + Conversion Label"],
                  ["Google Analytics 4", "isGoogleAnalyticsEnabled", "Measurement ID (G-xxx)"],
                  ["TikTok Pixel", "isTiktokEnabled", "Pixel ID"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Meta CAPI (Server-Side)</h4>
                <ul className="text-text-muted text-xs space-y-1 list-disc ml-4">
                  <li>Server-side Purchase event via Meta Conversions API</li>
                  <li>Trigger: payment webhook setelah berhasil bayar</li>
                  <li>PII hashing: SHA-256 (email, phone)</li>
                  <li>Event deduplication via event_id</li>
                  <li>File: <Code>lib/meta-capi.ts</Code></li>
                </ul>
              </div>
              <InfoBox type="warning">
                <strong>CSP:</strong> Domain tracking sudah di-whitelist di <Code>next.config.ts</Code> (script-src, connect-src, frame-src). Jika pixel tidak load, cek apakah customer pakai ad blocker.
              </InfoBox>
              <InfoBox type="info">
                <strong>File:</strong> <Code>lib/tracking.ts</Code> (client events), <Code>lib/meta-capi.ts</Code> (server CAPI), <Code>components/TrackingPixels.tsx</Code> (pixel loader)
              </InfoBox>
            </div>
          ),
        },
        {
          id: "utm-attribution",
          icon: Target,
          title: "UTM Attribution & Ad Performance",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Track dari mana customer datang (UTM), click IDs (fbclid/gclid/ttclid), dan hitung ROI/ROAS per platform.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">UTM Capture Flow</h4>
                <StepFlow steps={[
                  { title: "Customer klik iklan", desc: "URL berisi ?utm_source=meta&utm_medium=cpc&utm_campaign=promo_april&fbclid=xxx" },
                  { title: "UTM disimpan di sessionStorage", desc: "captureUtmParams() dipanggil saat page load (homepage + order page)" },
                  { title: "Submit order", desc: "UTM params dikirim bersama data order ke backend" },
                  { title: "Tersimpan di DB", desc: "Kolom utm_source, utm_medium, utm_campaign, fbclid, gclid, ttclid di tabel orders" },
                  { title: "Attribution stats", desc: "Dashboard Ads tab menampilkan revenue per source/campaign" },
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">UTM Fields Tersimpan</h4>
                <Table headers={["Field", "Contoh", "Keterangan"]} rows={[
                  ["utm_source", "meta, google, tiktok", "Platform iklan"],
                  ["utm_medium", "cpc, cpm, social", "Tipe traffic"],
                  ["utm_campaign", "promo_april", "Nama campaign"],
                  ["utm_content", "creative_a", "Variant ad creative"],
                  ["utm_term", "joki ml murah", "Keyword (search ads)"],
                  ["fbclid", "auto dari Meta", "Facebook click ID"],
                  ["gclid", "auto dari Google", "Google click ID"],
                  ["ttclid", "auto dari TikTok", "TikTok click ID"],
                  ["referrer_url", "auto", "HTTP referrer"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Ads Tab Dashboard</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                  <StatCard label="Total Spend" value="Rp X" sub="Manual input" />
                  <StatCard label="Revenue" value="Rp X" sub="From attributed orders" />
                  <StatCard label="Profit/Loss" value="+/- X" sub="Revenue - Spend" />
                  <StatCard label="ROAS" value="X.Xx" sub="Return on Ad Spend" />
                  <StatCard label="CPA" value="Rp X" sub="Cost per Acquisition" />
                </div>
                <ul className="text-text-muted text-xs space-y-1 list-disc ml-4">
                  <li>Per-platform breakdown (Meta, Google, TikTok, Other)</li>
                  <li>Campaign drill-down: revenue, orders, CPA per campaign</li>
                  <li>Ad Spend log: input manual spend, impressions, clicks per tanggal &amp; platform</li>
                </ul>
              </div>
              <InfoBox type="info">
                <strong>Schema:</strong> Run <Code>supabase-schema-v15.sql</Code> di Supabase SQL Editor untuk menambahkan kolom UTM di orders + tabel ad_spend.
              </InfoBox>
              <InfoBox type="success">
                <strong>API:</strong> <Code>GET/POST/DELETE /api/admin/ads</Code> &mdash; CRUD ad spend + attribution stats.
              </InfoBox>
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
                  [<Code key="8">/reviewstats</Code>, "Rekap rating & report per worker"],
                  [<Code key="9">/help</Code>, "Menu bantuan"],
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
                  <li>Masukkan token &amp; chat IDs di Dashboard &rarr; Settings &rarr; Integrations &rarr; Telegram Bot (Admin, Worker, Review, Report group)</li>
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
                  ["Review masuk", "Admin + Review", "REVIEW BARU! + rating + tombol show/hide"],
                  ["Worker report", "Admin + Review", "WORKER REPORT! + detail + tombol resolved"],
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
              <p className="text-text-muted text-sm">Customer bisa review layanan + worker setelah order selesai. Report worker selalu tersedia di halaman review.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Alur Lengkap Review</h4>
                <StepFlow steps={[
                  { title: "Order selesai", desc: "Admin set status completed → sistem kirim WhatsApp ke customer dengan link review: etnyx.com/review?id=ORDER_ID", badge: "auto" },
                  { title: "Customer buka link", desc: "Halaman review load info order, validasi token, cek belum pernah review", badge: "customer", page: "/review?id=xxx&token=xxx" },
                  { title: "Rating service", desc: "Rating 1-5 bintang + komentar (maks 1000 karakter) + nama (opsional untuk testimonial)", badge: "customer" },
                  { title: "Rating worker (opsional)", desc: "Muncul jika ada worker assigned. Rating 1-5 bintang + komentar worker", badge: "customer" },
                  { title: "Report worker (opsional)", desc: "Checkbox 'Saya ingin melaporkan worker' — SELALU tersedia walau tanpa worker. Pilih tipe laporan + detail", badge: "customer" },
                  { title: "Auto-testimonial", desc: "Jika rating service ≥ 4 + ada komentar → auto-create testimonial (hidden, admin harus approve)", badge: "auto" },
                  { title: "Telegram Review Group", desc: "Notifikasi review baru + rating stars + tombol Show/Hide ke grup Admin + Review", badge: "auto" },
                  { title: "Telegram Report Group", desc: "Jika ada report → notifikasi ke grup Admin + Report. Menampilkan NAMA WORKER + tipe laporan + tombol Resolved/Dismiss", badge: "auto" },
                  { title: "Admin kelola", desc: "Dashboard Reviews: approve/hide testimonial, set featured. Report: set status resolved/dismissed", badge: "admin" },
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Report Types</h4>
                <Table headers={["Type", "Label", "Emoji"]} rows={[
                  ["cheating", "Bermain curang / cheat", "🎮"],
                  ["offering_services", "Menawarkan jasa di luar ETNYX", "🚫"],
                  ["rude", "Kasar / tidak sopan", "😤"],
                  ["account_issue", "Masalah akun (diamankan, dll)", "🔐"],
                  ["other", "Lainnya", "❓"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Telegram Report Notification</h4>
                <pre className="text-text-muted text-[11px] font-mono bg-white/[0.02] p-3 rounded">{`🚨🚨🚨 WORKER REPORT! 🚨🚨🚨

📋 Order: ORD-XXXX
🔧 Worker: Budi ← nama worker otomatis
👤 Pelapor: Customer Name
📱 WA: 08xxx
⭐ Rating Worker: 2/5

⚠️ Jenis Laporan: 🎮 Bermain curang
📝 Detail: Player menggunakan cheat...

⚡ SEGERA DITINDAKLANJUTI!
[✅ Resolved] [❌ Dismiss]`}</pre>
              </div>
              <InfoBox type="info">
                Report worker selalu visible meskipun order tidak punya worker assigned. Nama worker otomatis di-lookup dari <Code>staff_users</Code> berdasarkan <Code>assigned_worker_id</Code>.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "rewards",
          icon: Gift,
          title: "Reward, Referral & Loyalty",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Sistem poin, tier, referral, dan katalog reward. Otomatis dapat poin saat order selesai.</p>
              <Table headers={["Tier", "Min Poin", "Diskon", "Benefit"]} rows={[
                ["Bronze", "0", "0%", "Akses dasar"],
                ["Silver", "50", "2%", "Diskon otomatis"],
                ["Gold", "200", "5%", "Diskon + prioritas"],
                ["Platinum", "500", "10%", "Diskon max + VIP"],
              ]} />
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Earning &amp; Redeem</h4>
                <ul className="text-text-muted text-xs space-y-1 list-disc ml-4">
                  <li><strong>Earning:</strong> 1 poin per Rp 10.000 yang dibelanjakan (auto saat order complete via RPC <Code>award_reward_points</Code>)</li>
                  <li><strong>Referral bonus:</strong> Referrer dapat bonus poin saat teman menyelesaikan order</li>
                  <li><strong>Katalog:</strong> Admin buat items (skin, diamond, dll), customer redeem dengan poin</li>
                  <li><strong>Proses:</strong> Redemption masuk ke admin, approve/reject</li>
                </ul>
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Referral System</h4>
                <StepFlow steps={[
                  { title: "Customer register", desc: "Otomatis dapat referral_code unik (alfanumerik, case-insensitive)", badge: "auto" },
                  { title: "Share ke teman", desc: "Customer share kode ke teman. Teman input saat order.", badge: "customer" },
                  { title: "Validasi kode", desc: "Sistem cek: kode valid, bukan self-referral (cek email + WA dengan normalisasi ±62/08), belum pernah dipakai customer yang sama", badge: "auto" },
                  { title: "Diskon 10%", desc: "Teman yang pakai kode dapat flat diskon 10% di order", badge: "auto" },
                  { title: "Bonus poin referrer", desc: "Saat order teman selesai → referrer dapat poin: floor(total_order / 10.000), minimum 1 poin", badge: "auto" },
                ]} />
                <InfoBox type="warning">
                  <strong>Anti-abuse:</strong> Self-referral diblokir via email + nomor WA (normalisasi: 08 ↔ 628, strip simbol). Satu customer tidak bisa pakai kode referral yang sama 2x.
                </InfoBox>
              </div>
            </div>
          ),
        },
        {
          id: "status-logic",
          icon: Zap,
          title: "Order Status & Auto-Actions",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Setiap perubahan status order memicu aksi otomatis. Berikut detail lengkap apa yang terjadi di setiap transisi.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Status Flow</h4>
                <div className="flex items-center gap-2 flex-wrap text-xs mb-4">
                  <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">pending</span>
                  <span className="text-text-muted">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">confirmed</span>
                  <span className="text-text-muted">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">in_progress</span>
                  <span className="text-text-muted">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">completed</span>
                </div>
                <Table headers={["Transisi", "Trigger", "Aksi Otomatis"]} rows={[
                  [<span key="t1" className="whitespace-nowrap"><strong className="text-yellow-400">pending</strong> → <strong className="text-blue-400">confirmed</strong></span>, "Bayar via Midtrans / Admin konfirmasi", <ul key="a1" className="list-disc ml-3 space-y-0.5"><li>Telegram ke Admin Group (+ tombol Assign)</li><li>WhatsApp ke customer (konfirmasi bayar)</li><li>Email ke customer (invoice)</li><li>Reward points dicatat (pending)</li></ul>],
                  [<span key="t2" className="whitespace-nowrap"><strong className="text-blue-400">confirmed</strong> → <strong className="text-accent">in_progress</strong></span>, "Worker klik Mulai / Admin assign", <ul key="a2" className="list-disc ml-3 space-y-0.5"><li>Telegram ke Worker Group</li><li>WhatsApp ke customer (order mulai dikerjakan)</li><li>Customer bisa track via /track</li></ul>],
                  [<span key="t3" className="whitespace-nowrap"><strong className="text-accent">in_progress</strong> → <strong className="text-green-400">completed</strong></span>, "Worker klik Selesai / Admin set", <ul key="a3" className="list-disc ml-3 space-y-0.5"><li>WhatsApp ke customer (selesai + link review)</li><li>Telegram ke Admin Group</li><li><strong>Auto-generate commission</strong> (60% × total_price)</li><li><strong>Award reward points</strong> ke customer (1 poin/Rp10K)</li><li><strong>Referral bonus</strong> jika ada referrer (poin ke referrer)</li><li>Commission period: bi-weekly (tgl 1-15 atau 16-akhir)</li></ul>],
                  [<span key="t4" className="whitespace-nowrap">Semua → <strong className="text-red-400">cancelled</strong></span>, "Admin cancel", <ul key="a4" className="list-disc ml-3 space-y-0.5"><li>WhatsApp ke customer (order dibatalkan)</li><li>Telegram ke Admin Group</li></ul>],
                ]} />
              </div>
              <InfoBox type="warning">
                <strong>Commission logic:</strong> Auto-generate hanya untuk order dengan <Code>assigned_worker_id</Code>. Rate diambil dari <Code>payroll_settings</Code> (default 60%). Period dihitung: tgl 1-15 = &quot;1-15 Bulan&quot;, tgl 16+ = &quot;16-akhir Bulan&quot;.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "wa-templates",
          icon: MessageCircle,
          title: "WhatsApp Follow-up Templates",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">7 template WhatsApp yang bisa dikirim dari Dashboard &rarr; Orders &rarr; Smart Actions. Kirim via Fonnte API.</p>
              <div className="space-y-3">
                {[
                  { action: "follow_up_payment", title: "Follow-up Payment", desc: "Reminder order belum bayar. Berisi Order ID, rank, harga, daftar rekening aktif (bank + e-wallet), link upload bukti transfer.", when: "Status: pending" },
                  { action: "follow_up_credentials", title: "Request Credentials", desc: "Minta akun ML customer setelah bayar. Berisi peringatan keamanan akun.", when: "Status: confirmed" },
                  { action: "notify_started", title: "Notify Started", desc: "Info order mulai dikerjakan. Target rank, link track, peringatan jangan login.", when: "Status: in_progress" },
                  { action: "follow_up_progress", title: "Progress Update", desc: "Update progress %, rank saat ini, link track. Peringatan jangan login.", when: "Status: in_progress" },
                  { action: "notify_completed", title: "Notify Completed", desc: "Order selesai! Minta ganti password + link review.", when: "Status: completed" },
                  { action: "request_review", title: "Request Review", desc: "Follow-up minta review, link review + terima kasih.", when: "Status: completed" },
                  { action: "reactivation", title: "Reactivation", desc: "Win-back untuk order stalled/lama. Tanya apakah ingin lanjut.", when: "Order tidak aktif" },
                ].map((item, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 border border-white/5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-text font-medium text-sm">{item.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-text-muted">{item.when}</span>
                    </div>
                    <p className="text-text-muted text-xs mt-1">{item.desc}</p>
                    <code className="text-accent/50 text-[10px] font-mono">{item.action}</code>
                  </div>
                ))}
              </div>
              <InfoBox type="info">
                Semua template otomatis include: Order ID, info rank, link tracking, branding ETNYX footer. Emoji dihapus untuk kompatibilitas link WhatsApp. API: <Code>POST /api/admin/orders/follow-up</Code>
              </InfoBox>
            </div>
          ),
        },
        {
          id: "customer-auth",
          icon: Users,
          title: "Customer Auth Flow",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Alur registrasi, login, dan sesi customer.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Registrasi</h4>
                <StepFlow steps={[
                  { title: "Customer isi form register", desc: "Email, nama, password, nomor WA. Validasi format + cek email duplikat.", badge: "customer", page: "/register" },
                  { title: "Hash password", desc: "Bcrypt 12 rounds. Simpan hash, never plaintext.", badge: "auto" },
                  { title: "Auto-generate referral code", desc: "Kode alfanumerik unik, disimpan di tabel customers.", badge: "auto" },
                  { title: "Create JWT", desc: "HS256, expire 7 hari. Payload: id, email, name.", badge: "auto" },
                  { title: "Set HTTPOnly cookie", desc: "Cookie customer_token, secure (production), sameSite: lax.", badge: "auto" },
                  { title: "Email verifikasi", desc: "Link verifikasi dikirim via Resend. Customer klik untuk aktivasi.", badge: "auto" },
                ]} />
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Login</h4>
                <StepFlow steps={[
                  { title: "Input email + password", desc: "Email case-insensitive lookup di tabel customers.", badge: "customer", page: "/login" },
                  { title: "Password verify", desc: "Coba bcrypt dulu. Jika gagal → fallback SHA-256+salt (legacy migration).", badge: "auto" },
                  { title: "Update last_login_at", desc: "Catat waktu login terakhir.", badge: "auto" },
                  { title: "JWT + Cookie", desc: "Sama seperti registrasi. Return customer data + total_orders + total_spent.", badge: "auto" },
                ]} />
              </div>
              <InfoBox type="info">
                <strong>Password Migration:</strong> Sistem support 2 format hash: bcrypt (baru) dan SHA-256 + salt &quot;etnyx-salt&quot; (legacy). Login otomatis coba keduanya untuk backward compatibility.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "promo-system",
          icon: Megaphone,
          title: "Promo & Diskon System",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Sistem kode promo yang dikelola dari Dashboard &rarr; Promo tab.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Validasi Promo Code</h4>
                <StepFlow steps={[
                  { title: "Customer input kode", desc: "Di form order, masukkan kode promo.", badge: "customer", page: "/order" },
                  { title: "Validasi via RPC", desc: "Backend panggil validate_promo_code(code, order_amount) di Supabase.", badge: "auto" },
                  { title: "Cek syarat", desc: "Kode aktif? Belum expired? Max uses belum tercapai? Min order amount?", badge: "auto" },
                  { title: "Hitung diskon", desc: "Percentage: (order × %) capped max_discount. Fixed: langsung amount tetap.", badge: "auto" },
                  { title: "Apply ke order", desc: "Diskon ditampilkan di summary. Tersimpan di order record.", badge: "auto" },
                ]} />
              </div>
              <Table headers={["Tipe", "Contoh", "Logika"]} rows={[
                ["Percentage", "DISKON20 (20%)", "order_amount × 20%, max capped ke max_discount"],
                ["Fixed", "HEMAT50K (Rp50.000)", "Flat Rp50.000 off, tidak melebihi total"],
              ]} />
              <Table headers={["Field Promo", "Keterangan"]} rows={[
                ["code", "Kode unik (uppercase)"],
                ["discount_type", "percentage atau fixed"],
                ["discount_value", "Nilai diskon (% atau Rp)"],
                ["max_discount", "Batas maks diskon (untuk percentage)"],
                ["max_uses", "Maks penggunaan total (0 = unlimited)"],
                ["min_order", "Minimum order amount"],
                ["valid_until", "Tanggal kadaluarsa"],
                ["is_active", "Toggle aktif/nonaktif"],
              ]} />
            </div>
          ),
        },
        {
          id: "chat-system",
          icon: MessageCircle,
          title: "Order Chat System",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Chat antara customer dan admin per order. Polling-based (bukan real-time).</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Cara Kerja Chat</h4>
                <StepFlow steps={[
                  { title: "Customer buka order detail", desc: "Chat muncul di halaman tracking/dashboard. Load 50 pesan terakhir.", badge: "customer", page: "/track atau /dashboard" },
                  { title: "Kirim pesan", desc: "Pesan disanitasi, disimpan ke tabel chat_messages. sender_type: customer/admin.", badge: "customer" },
                  { title: "Admin balas", desc: "Admin melihat chat di order detail di Dashboard. Bisa balas langsung.", badge: "admin" },
                  { title: "Read status", desc: "Otomatis: pesan admin = read. Pesan customer = unread sampai admin buka.", badge: "auto" },
                ]} />
              </div>
              <Table headers={["Fitur", "Detail"]} rows={[
                ["Auth", "Admin: JWT admin. Customer: JWT customer. Masing-masing hanya bisa akses order miliknya."],
                ["Limit", "50 pesan per query (ascending by created_at)"],
                ["Read status", "PATCH /api/chat — mark pesan lawan sebagai read"],
                ["Sanitize", "Input disanitasi via sanitizeInput() untuk XSS prevention"],
                ["Storage", "Tabel chat_messages: order_id, customer_id, sender_type, message, is_read, created_at"],
              ]} />
              <InfoBox type="warning">
                Chat bukan real-time. Customer dan admin perlu refresh untuk melihat pesan baru. Tidak ada WebSocket/SSE.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "sdm",
          icon: TrendingUp,
          title: "SDM & Skalabilitas",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Berdasarkan fitur automasi yang sudah dibangun di ETNYX, berikut rekomendasi SDM:</p>

              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3">Minimum: 3 Orang</h4>
                <Table headers={["Role", "Jumlah", "Tugas"]} rows={[
                  ["Owner/Admin", "1", "Settings, pricing, payroll, promo, approve review/report, financial reports, ads"],
                  ["CS/Lead", "1", "Assign order ke worker, follow-up WA customer, handle chat, monitor progress"],
                  ["Worker (Booster)", "1+", "Kerjakan order, submit hasil, update progress"],
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-blue-400 font-semibold text-sm mb-3">Rekomendasi Skala: 5-7 Orang</h4>
                <Table headers={["Role", "Jumlah", "Kenapa"]} rows={[
                  ["Admin", "1", "Cukup 1, semua bisa dikelola dari dashboard + Telegram"],
                  ["CS/Lead", "1-2", "1 orang bisa handle ~20-30 order/hari. Tambah 1 jika >30 order/hari atau mau 24 jam"],
                  ["Worker", "3-4", "1 worker bisa handle ~2-3 order/hari (tergantung rank gap). Target 10+ order/hari butuh minimal 3-4"],
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">Kenapa Bisa Sedikit?</h4>
                <p className="text-text-muted text-xs mb-2">Sistem sudah otomasi banyak hal:</p>
                <ul className="text-text-muted text-xs space-y-1 ml-4 list-disc">
                  <li><strong className="text-text">Pembayaran</strong> &rarr; auto-confirm via Midtrans webhook</li>
                  <li><strong className="text-text">Notifikasi</strong> &rarr; auto WA + Telegram + Email</li>
                  <li><strong className="text-text">Assign order</strong> &rarr; bisa langsung dari Telegram (tidak perlu buka dashboard)</li>
                  <li><strong className="text-text">Komisi</strong> &rarr; auto-generate saat order selesai</li>
                  <li><strong className="text-text">Review</strong> &rarr; auto-notify + auto-testimonial</li>
                  <li><strong className="text-text">Tracking</strong> &rarr; customer track sendiri + lihat achievement &amp; screenshot real-time</li>
                  <li><strong className="text-text">Follow-up</strong> &rarr; 7 template WA tinggal klik</li>
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-accent/20">
                <h4 className="text-accent font-semibold text-sm mb-3">Skenario Berdasarkan Volume</h4>
                <Table headers={["Order/Hari", "Admin", "CS/Lead", "Worker", "Total SDM"]} rows={[
                  ["1-10", "1 (rangkap CS)", "—", "1-2", "2-3"],
                  ["10-30", "1", "1", "3-4", "5-6"],
                  ["30-50", "1", "2", "5-7", "8-10"],
                  ["50+", "1", "2-3", "8+", "11+"],
                ]} />
              </div>

              <InfoBox type="info">
                <strong>Tim Hierarchy:</strong> Setiap Lead mengelola tim worker sendiri via <Code>lead_id</Code>. Lead hanya bisa lihat &amp; assign ke worker timnya. Admin bisa assign worker ke lead manapun via Staff tab.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "team-management",
          icon: Users,
          title: "Team Management & Hierarchy",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Struktur organisasi ETNYX: Admin → Lead → Worker. Setiap level punya akses dan tanggung jawab berbeda.</p>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Hierarki Tim</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-red-500/20">
                    <Crown className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <h5 className="text-red-400 font-medium text-sm">Admin (Owner)</h5>
                      <p className="text-text-muted text-xs">Full access. Kelola settings, pricing, payroll, staff, promo, reports, ads. Satu-satunya yang bisa CRUD staff.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center"><ChevronDown className="w-4 h-4 text-text-muted" /></div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-500/20">
                    <UserCheck className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <h5 className="text-blue-400 font-medium text-sm">Lead (Koordinator)</h5>
                      <p className="text-text-muted text-xs">Assign order ke worker tim sendiri. Monitor progress. Follow-up customer via WA template.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center"><ChevronDown className="w-4 h-4 text-text-muted" /></div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/20">
                    <Wrench className="w-5 h-5 text-green-400 shrink-0" />
                    <div>
                      <h5 className="text-green-400 font-medium text-sm">Worker (Booster)</h5>
                      <p className="text-text-muted text-xs">Kerjakan order assigned. Update progress. Submit hasil + screenshot. Komisi otomatis.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Cara Buat &amp; Kelola Tim</h4>
                <StepFlow steps={[
                  { title: "Buat akun Lead", desc: "Dashboard > Staff tab > Tambah Staff > Role: Lead. Set nama, email, password.", badge: "admin" },
                  { title: "Buat akun Worker", desc: "Dashboard > Staff tab > Tambah Staff > Role: Worker. Set nama, email, password.", badge: "admin" },
                  { title: "Assign Worker ke Lead", desc: "Dashboard > Staff tab > Edit Worker > pilih Lead di dropdown. Worker otomatis masuk tim Lead tersebut.", badge: "admin" },
                  { title: "Lead lihat tim", desc: "Lead login > otomatis lihat hanya worker di timnya. Assign order hanya ke worker timnya.", badge: "lead" },
                  { title: "Re-assign worker", desc: "Admin bisa pindahkan worker ke lead lain kapan saja via Staff tab.", badge: "admin" },
                ]} />
              </div>

              <Table headers={["Aksi", "Admin", "Lead", "Worker"]} rows={[
                ["Lihat semua orders", "Ya", "Ya (semua)", "Hanya assigned"],
                ["Assign order ke worker", "Ya (semua worker)", "Ya (tim sendiri)", "Tidak"],
                ["Bulk assign", "Ya", "Ya", "Tidak"],
                ["Kelola staff", "Ya (CRUD)", "Tidak", "Tidak"],
                ["Mulai/selesaikan order", "Ya", "Tidak", "Ya (assigned saja)"],
                ["Submit hasil & screenshot", "Tidak", "Tidak", "Ya"],
                ["Lihat credentials akun", "Ya", "Tidak", "Ya (assigned saja)"],
                ["Follow-up WA", "Ya", "Ya", "Tidak"],
                ["Payroll & komisi", "Ya", "Tidak", "Tidak"],
                ["Settings & pricing", "Ya", "Tidak", "Tidak"],
                ["Lihat docs", "Ya", "Ya", "Ya"],
              ]} />

              <InfoBox type="info">
                <strong>Scalable:</strong> Satu lead bisa handle 3-5 worker. Jika tim tambah besar, tambah lead baru dan distribusikan worker.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "faq",
          icon: HelpCircle,
          title: "FAQ & Troubleshooting",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Pertanyaan yang sering muncul dan cara mengatasinya.</p>

              {[
                { q: "Customer bilang belum terima WA notifikasi?", a: "Cek Fonnte API token di Settings > Integrations. Cek nomor WA customer sudah benar (format 628xxx). Test via POST /api/admin/test-notifications." },
                { q: "Telegram bot tidak merespon command?", a: "Cek bot token di Settings > Integrations. Pastikan webhook terdaftar: buka /api/telegram/webhook?action=register. Cek bot sudah ditambahkan ke grup." },
                { q: "Link di WA tidak bisa diklik (tidak biru)?", a: "Pastikan URL ada di baris sendiri (tidak nempel emoji/teks lain). URL harus punya trailing slash sebelum query params, contoh: /track/?id=xxx bukan /track?id=xxx." },
                { q: "Midtrans payment tidak auto-confirm?", a: "Cek Server Key di Settings > Integrations. Pastikan Notification URL di Midtrans Dashboard mengarah ke /api/payment/notification. Cek environment (Sandbox vs Production)." },
                { q: "Worker tidak bisa lihat order?", a: "Pastikan order sudah di-assign ke worker tersebut. Worker hanya bisa lihat order yang ditugaskan via lead/admin." },
                { q: "Commission tidak muncul setelah order selesai?", a: "Komisi auto-generate saat status diubah ke completed DAN ada assigned_worker_id. Cek di Payroll > Commissions." },
                { q: "Customer tidak bisa bayar via Midtrans?", a: "Cek Midtrans Server Key & Client Key sudah benar dan aktif. Toggle Sandbox/Production sesuai environment." },
                { q: "Bagaimana reset password staff?", a: "Admin bisa reset lewat Staff tab > Edit > isi password baru. Atau staff bisa via halaman login > Lupa Password (email reset link via Resend)." },
                { q: "Order stuck di pending lama?", a: "Kirim follow-up WA via Dashboard > Orders > Follow-up Payment. Template include daftar rekening + link upload bukti." },
                { q: "Review tidak muncul di homepage?", a: "Review otomatis hidden saat dibuat. Admin harus approve/show di Reviews tab > toggle visibility. Hanya rating 4-5 yang auto-create testimonial." },
                { q: "Mau tambah rekening bank/e-wallet baru?", a: "Dashboard > Settings > Rekening tab. Tambah rekening baru dengan nama, nomor, nama pemilik. Toggle aktif/nonaktif." },
                { q: "Bagaimana test semua notifikasi channel?", a: "POST /api/admin/test-notifications — support: telegram_admin, telegram_worker, telegram_completed, telegram_review, telegram_report, whatsapp, email." },
              ].map((item, i) => (
                <div key={i} className="bg-background rounded-lg p-3 border border-white/5">
                  <h4 className="text-accent font-medium text-sm">{item.q}</h4>
                  <p className="text-text-muted text-xs mt-1">{item.a}</p>
                </div>
              ))}
            </div>
          ),
        },
      ],
    },
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
        {
          id: "sop-lead",
          icon: ClipboardList,
          title: "SOP Harian Lead",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Checklist harian untuk Lead. Lakukan setiap hari untuk memastikan operasional lancar.</p>

              <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-blue-400 font-semibold text-sm mb-3">Pagi (08:00 - 10:00)</h4>
                <ul className="space-y-2">
                  {[
                    "Login ke Lead Dashboard — cek order baru yang masuk semalam",
                    "Cek Telegram — ada notifikasi order baru / payment confirmed?",
                    "Assign order yang belum di-assign ke worker yang available",
                    "Cek workload per worker — pastikan distribusi merata",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-blue-400 font-semibold text-sm mb-3">Siang (12:00 - 14:00)</h4>
                <ul className="space-y-2">
                  {[
                    "Monitor progress order yang sedang dikerjakan",
                    "Follow-up worker yang progress-nya lambat via Telegram",
                    "Kirim WA progress update ke customer jika perlu (template: follow_up_progress)",
                    "Cek order yang payment belum masuk — kirim follow-up payment",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-blue-400 font-semibold text-sm mb-3">Malam (20:00 - 22:00)</h4>
                <ul className="space-y-2">
                  {[
                    "Cek order selesai hari ini — pastikan worker sudah submit hasil + screenshot",
                    "Pastikan customer sudah dikirim WA notifikasi selesai + link review",
                    "Review report masuk — eskalasi ke admin jika perlu",
                    "Brief worker untuk order besok jika ada yang urgent/express",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <InfoBox type="info">
                <strong>Tip:</strong> Gunakan Telegram untuk koordinasi cepat dengan worker. Dashboard untuk monitoring data dan follow-up customer via WA template.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "lead-rules",
          icon: AlertTriangle,
          title: "Do's & Don'ts Lead",
          content: (
            <div className="space-y-4">
              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">{"DO's (Lakukan)"}</h4>
                <ul className="space-y-1.5 text-text-muted text-xs">
                  {[
                    "Distribusikan order merata ke semua worker aktif",
                    "Assign order secepat mungkin setelah payment confirmed (target < 30 menit)",
                    "Follow-up customer yang belum bayar dalam 24 jam via WA template",
                    "Monitor progress worker & ingatkan yang lambat melalui Telegram",
                    "Gunakan bulk assign untuk efisiensi saat order banyak",
                    "Catat notes di order jika ada info penting untuk worker/admin",
                    "Cek workload worker sebelum assign — lihat jumlah order aktif di panel Tim Worker",
                    "Eskalasi ke Admin jika ada masalah yang tidak bisa ditangani sendiri",
                    "Respon cepat via Telegram — customer expect fast service",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-400 shrink-0">{"✓"}</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3">{"DON'Ts (Jangan)"}</h4>
                <ul className="space-y-1.5 text-text-muted text-xs">
                  {[
                    "Jangan stack >3 order aktif ke 1 worker (kecuali gap rank kecil)",
                    "Jangan assign ke worker yang sedang offline / tidak responsif",
                    "Jangan abaikan customer report — eskalasi ke Admin segera",
                    "Jangan ubah pricing atau settings (bukan hak akses Lead)",
                    "Jangan share credentials customer ke pihak lain",
                    "Jangan biarkan order belum di-assign lebih dari 1 jam saat jam kerja",
                    "Jangan hapus notes yang ditulis staff lain",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 shrink-0">{"✗"}</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <InfoBox type="warning">
                <strong>Eskalasi ke Admin jika:</strong> Worker tidak merespon &gt; 2 jam, customer komplain keras, order stuck &gt; 24 jam tanpa progress, ada report misconduct worker, masalah teknis/payment.
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
        {
          id: "sop-worker",
          icon: ClipboardList,
          title: "SOP Harian Worker",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Panduan langkah demi langkah untuk setiap order. Ikuti dengan disiplin.</p>

              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">Sebelum Mulai Kerja</h4>
                <ul className="space-y-2">
                  {[
                    "Login ke Worker Dashboard — cek ada order baru yang di-assign",
                    "Cek Telegram — ada notifikasi assignment baru?",
                    "Klik 'Credentials' untuk lihat akun ML customer (terenkripsi AES-256)",
                    "Pastikan akun bisa login dengan baik sebelum klik 'Mulai'",
                    "Jika akun bermasalah, laporkan ke Lead/Admin via Telegram segera",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-green-500/10 text-green-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">Selama Pengerjaan</h4>
                <ul className="space-y-2">
                  {[
                    "Klik 'Mulai' di dashboard — customer otomatis dapat WA 'Sedang Dikerjakan'",
                    "Update progress % setiap selesai beberapa match (customer bisa track real-time)",
                    "Submit hasil match: stars gained, MVP, savage, maniac, wins, durasi",
                    "Upload screenshot setiap sesi bermain (WAJIB sebagai bukti)",
                    "Jangan login dari device lain — risiko akun banned customer",
                    "Jika ada masalah (akun locked, maintenance ML), lapor ke Lead segera",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-green-500/10 text-green-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">Setelah Selesai</h4>
                <ul className="space-y-2">
                  {[
                    "Submit semua hasil akhir + screenshot terakhir",
                    "Klik 'Selesai' — customer dapat WA 'Order Selesai' + link review",
                    "Komisi masuk otomatis ke sistem payroll (60% dari total_price)",
                    "Logout dari akun ML customer — jangan simpan credentials di device",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-green-500/10 text-green-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <InfoBox type="info">
                <strong>Edit Submission:</strong> Kamu bisa edit/hapus submission dalam 30 menit setelah submit. Setelah itu, minta Admin untuk koreksi.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "worker-rules",
          icon: AlertTriangle,
          title: "Aturan & Sanksi",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Aturan wajib yang harus dipatuhi semua worker. Pelanggaran akan dikenakan sanksi bertingkat.</p>

              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3">Aturan Wajib</h4>
                <Table headers={["No", "Aturan", "Keterangan"]} rows={[
                  ["1", "Jangan share credentials customer", "Data login hanya untuk pengerjaan order. Dilarang menyebarkan ke siapapun."],
                  ["2", "Jangan tawarkan jasa di luar ETNYX", "Dilarang menghubungi customer untuk menawarkan jasa pribadi."],
                  ["3", "Jangan minta kontak pribadi customer", "Semua komunikasi melalui sistem ETNYX."],
                  ["4", "Wajib upload screenshot", "Setiap sesi bermain harus ada bukti screenshot yang di-upload."],
                  ["5", "Submit hasil yang jujur", "Jangan manipulasi data match (stars, MVP, dll)."],
                  ["6", "Jangan gunakan cheat/hack", "Akun customer bisa kena banned. Tanggung jawab penuh worker."],
                  ["7", "Selesaikan order tepat waktu", "Jangan biarkan order stuck tanpa progress > 24 jam."],
                  ["8", "Jangan login dari banyak device", "Risiko banned akun. Gunakan 1 device saja per order."],
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-yellow-500/20">
                <h4 className="text-yellow-400 font-semibold text-sm mb-3">Tingkatan Sanksi</h4>
                <Table headers={["Level", "Sanksi", "Contoh Pelanggaran"]} rows={[
                  ["Peringatan 1", "Teguran tertulis via Telegram", "Lupa upload screenshot, progress lambat tanpa alasan jelas"],
                  ["Peringatan 2", "Tidak dapat order baru selama 3 hari", "Order terlambat selesai, tidak responsif > 24 jam, repeat minor"],
                  ["Peringatan 3", "Suspend akun 1 minggu + potong komisi", "Customer report valid (kasar, tidak profesional), major offense"],
                  ["Pemutusan", "Akun di-nonaktifkan permanen", "Share credentials, tawarkan jasa luar, gunakan cheat, repeat offender"],
                ]} />
              </div>

              <InfoBox type="warning">
                <strong>Customer bisa report worker!</strong> Saat order selesai, customer dapat link review yang bisa digunakan untuk report. Laporan valid yang terbukti bisa langsung ke sanksi. Customer yang report valid bahkan bisa dapat skin gratis.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "worker-earnings",
          icon: Wallet,
          title: "Komisi & Penghasilan",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Penjelasan lengkap sistem komisi dan pembayaran worker.</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard label="Commission Rate" value="60%" sub="Dari total harga order" />
                <StatCard label="Pay Period" value="Bi-weekly" sub="Tgl 1-15 & 16-akhir bulan" />
                <StatCard label="Min. Payout" value="Rp 0" sub="Tidak ada minimum" />
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Cara Hitung Komisi</h4>
                <StepFlow steps={[
                  { title: "Order selesai", desc: "Worker klik 'Selesai' di dashboard. Status berubah ke completed." },
                  { title: "Auto-generate commission", desc: "Sistem hitung: total_price × 60% = komisi. Masuk ke tabel commissions otomatis." },
                  { title: "Period otomatis", desc: "Tgl 1-15 = periode pertama bulan itu. Tgl 16-akhir bulan = periode kedua." },
                  { title: "Admin proses payout", desc: "Admin buat batch payout di Payroll tab sesuai jadwal (per 2 minggu)." },
                  { title: "Pembayaran ke worker", desc: "Admin bayar via Dana/OVO/BCA/dll ke rekening/e-wallet worker yang terdaftar." },
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Contoh Perhitungan</h4>
                <Table headers={["Order", "Total Harga", "Komisi (60%)", "Status"]} rows={[
                  ["ETX-ABC123", "Rp 150.000", "Rp 90.000", "Pending payout"],
                  ["ETX-DEF456", "Rp 300.000", "Rp 180.000", "Pending payout"],
                  ["ETX-GHI789", "Rp 80.000", "Rp 48.000", "Paid"],
                ]} />
                <p className="text-text-muted text-xs mt-2"><strong>Total pending:</strong> Rp 270.000 | <strong>Total paid:</strong> Rp 48.000</p>
              </div>

              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Payment Methods Tersedia</h4>
                <p className="text-text-muted text-xs">Admin bisa bayar ke rekening/e-wallet yang terdaftar: Dana, OVO, GoPay, ShopeePay, BCA, BRI, Mandiri, BNI, Jago, SeaBank, atau Cash.</p>
                <p className="text-text-muted text-xs mt-1">Pastikan kamu sudah mendaftarkan rekening/e-wallet di profil. Tanyakan ke Admin untuk setup.</p>
              </div>

              <InfoBox type="info">
                <strong>Tips:</strong> Semakin banyak order selesai, semakin besar komisi. Express order (1.2x harga) otomatis berarti komisi lebih besar juga.
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
              <p className="text-text-muted text-sm">63+ API routes. Auth via JWT cookie (HTTPOnly). Rate limited via middleware.</p>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">{"Admin API"} <Code>/api/admin/*</Code></h4>
                <Table headers={["Endpoint", "Methods", "Deskripsi"]} rows={[
                  ["/api/admin/auth", "POST/GET/DELETE", "Login/session/logout"],
                  ["/api/admin/orders", "GET/POST/PATCH", "CRUD orders + status update + auto-commission"],
                  ["/api/admin/orders/credentials", "GET", "View encrypted credentials"],
                  ["/api/admin/orders/follow-up", "POST", "Smart WA follow-up (7 templates + info rekening)"],
                  ["/api/admin/payment-proof", "PATCH", "Approve/reject bukti transfer manual"],
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
                  ["/api/admin/ads", "GET/POST/DELETE", "Ad spend CRUD + attribution stats (ROAS, CPA)"],
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
                  ["/api/payment/manual", "POST", "Upload bukti transfer manual"],
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
                <h4 className="text-text font-medium text-sm mb-2">Tracking & Attribution Tables</h4>
                <Table headers={["Tabel/Kolom", "Purpose"]} rows={[
                  [<strong key="1" className="text-text">orders.utm_*</strong>, "UTM attribution: source, medium, campaign, content, term"],
                  [<strong key="2" className="text-text">orders.fbclid/gclid/ttclid</strong>, "Platform click IDs (Meta, Google, TikTok)"],
                  [<strong key="3" className="text-text">orders.referrer_url</strong>, "HTTP referrer URL"],
                  [<strong key="4" className="text-text">ad_spend</strong>, "Manual ad spend per date/platform/campaign: spend, impressions, clicks"],
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
                <strong>Schema Files:</strong> v8 (storage), v9 (order logs), v10 (rewards), v11 (staff), v12 (reviews), v13 (payroll), v14 (payment methods), v15 (UTM attribution &amp; ad spend). Run sequentially via Supabase SQL Editor.
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
              <p className="text-text-muted text-sm">5 channel + interactive Telegram bot. Konfigurasi di Dashboard &rarr; Settings &rarr; Integrations.</p>
              <Table headers={["Channel", "Provider", "Penerima", "Events"]} rows={[
                ["Telegram Admin", "Bot API (webhook)", "Admin Group", "Order baru (+ tombol Konfirmasi/Tolak), selesai, review, report"],
                ["Telegram Review", "Bot API", "Review Group", "Review customer baru (+ tombol Show/Hide)"],
                ["Telegram Report", "Bot API", "Report Group", "Laporan worker + nama worker (+ tombol Resolved/Dismiss)"],
                ["Telegram Worker", "Bot API", "Worker Group", "Pembayaran dikonfirmasi, order di-assign"],
                ["WhatsApp", "Fonnte API", "Customer", "Order dibuat, pembayaran dikonfirmasi, sedang dikerjakan, selesai, follow-up (7 template)"],
                ["Email", "Resend", "Customer", "Konfirmasi bayar, invoice, verification, password reset"],
                ["Web Push", "VAPID", "Subscribers", "Manual push dari admin"],
              ]} />
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Notification Trigger Map</h4>
                <Table headers={["Event", "Telegram", "WhatsApp", "Email"]} rows={[
                  ["Order dibuat (belum bayar)", "Admin: ORDER BARU! + tombol Konfirmasi/Tolak", "Konfirmasi order + info rekening + link upload bukti", "Invoice"],
                  ["Bayar dikonfirmasi (confirmed)", "Worker: ORDER DIKONFIRMASI!", "Pembayaran Dikonfirmasi + track link + reminder keamanan", "Payment confirmed"],
                  ["Order di-assign ke worker", "Worker: ORDER DITUGASKAN", "—", "—"],
                  ["Mulai dikerjakan (in_progress)", "—", "Sedang Dikerjakan + jangan login + track link", "—"],
                  ["Order selesai (completed)", "Admin: ORDER SELESAI!", "Selesai + ganti password + link review", "—"],
                  ["Review masuk", "Admin + Review: REVIEW BARU! + Show/Hide", "—", "—"],
                  ["Worker di-report", "Admin + Report: WORKER REPORT! + nama worker + Resolved/Dismiss", "—", "—"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Telegram 4 Grup</h4>
                <Table headers={["Grup", "Setting Key", "Fungsi"]} rows={[
                  ["Admin", "telegramAdminGroupId", "Semua notifikasi order + review + report"],
                  ["Worker", "telegramWorkerGroupId", "Order dikonfirmasi, order di-assign"],
                  ["Review", "telegramReviewGroupId", "Khusus review baru (skip jika sama dengan Admin)"],
                  ["Report", "telegramReportGroupId", "Khusus report worker (skip jika sama dengan Admin)"],
                ]} />
                <p className="text-text-muted text-[11px] mt-2">Jika Review/Report group ID sama dengan Admin → tidak double-send. Sistem auto-skip duplikat.</p>
              </div>
              <InfoBox type="success">
                <strong>Test Notifications:</strong> POST <Code>/api/admin/test-notifications</Code> &mdash; test per channel: telegram_admin, telegram_worker, telegram_completed, telegram_review, telegram_report, whatsapp, email.
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
              <p className="text-text-muted text-sm">Dual payment system: Transfer Manual + Midtrans Auto. Toggle dari Settings &rarr; Integrations.</p>

              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">Transfer Manual</h4>
                <StepFlow steps={[
                  { title: "Customer pilih Transfer Manual", desc: "Di form order step 3, pilih 'Transfer Manual'.", page: "/order (step 3)" },
                  { title: "Auto-redirect ke halaman bayar", desc: "Setelah submit, auto-redirect ke /payment/manual?order_id=XXX. Tampil daftar rekening aktif.", page: "/payment/manual" },
                  { title: "Customer transfer & upload bukti", desc: "Transfer ke salah satu rekening, upload foto bukti via form upload.", badge: "customer" },
                  { title: "Admin approve/reject bukti", desc: "Di dashboard Orders tab, admin review bukti transfer lalu approve atau reject.", badge: "admin" },
                  { title: "WA Pembayaran Dikonfirmasi", desc: "Setelah approve: status confirmed + paid, WA ke customer + Telegram ke Worker Group.", badge: "auto" },
                ]} />
                <Table headers={["Rekening Tersedia", "Kelola"]} rows={[
                  ["BCA, BRI, BNI, Mandiri, Jago", "Dashboard > Settings > Rekening"],
                  ["DANA, GoPay, OVO, ShopeePay, LinkAja", "Dashboard > Settings > Rekening"],
                  ["QRIS (upload gambar)", "Dashboard > Settings > Rekening"],
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-blue-400 font-semibold text-sm mb-3">Midtrans Auto</h4>
                <StepFlow steps={[
                  { title: "Frontend POST ke /api/customer/order", desc: "Kirim data order + payment_method: midtrans" },
                  { title: "Backend generate Snap Token", desc: "Via snap.createTransaction() — return snap_url" },
                  { title: "Customer bayar via popup/redirect", desc: "VA, QRIS, GoPay, ShopeePay, Kartu Kredit" },
                  { title: "Webhook auto-confirm", desc: "Midtrans POST ke /api/payment/notification — SHA-512 signature verification", page: "/api/payment/notification" },
                  { title: "Status update + notifikasi", desc: "Order confirmed + paid, WA 'Pembayaran Dikonfirmasi', Telegram Worker Group" },
                ]} />
                <InfoBox type="info">
                  Midtrans muncul otomatis jika Server Key diisi di Settings &rarr; Integrations. Bisa toggle Sandbox/Production.
                </InfoBox>
              </div>

              <Table headers={["Setting", "Lokasi"]} rows={[
                ["Server Key / Client Key", "Dashboard > Settings > Integrations"],
                ["Rekening Transfer Manual", "Dashboard > Settings > Rekening"],
                ["Environment", "Toggle Sandbox / Production"],
                ["Payment Channels", "Enable/disable VA, GoPay, QRIS, dll"],
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
          title: "Security & Encryption",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Multi-layer security: auth, encryption, rate limiting, middleware, CSP.</p>
              <Table headers={["Layer", "Mekanisme", "Detail"]} rows={[
                ["Auth", "JWT (JOSE)", "HTTPOnly cookie, expire 24h (staff) / 7d (customer)"],
                ["Password", "Bcrypt (12 rounds)", "Hash stored, never plaintext. Legacy SHA-256 fallback."],
                ["Rate Limiting", "Sliding window", "100 req/60s general, 10 req/5min auth endpoints"],
                ["Input", "Sanitize + DOMPurify", "XSS, SQLi, template injection blocking"],
                ["Credentials", "AES-256-GCM", "Game login encrypted at rest, auth tag verified"],
                ["Middleware", "Pattern matching", "Block path traversal, bot paths, injection attempts"],
                ["RLS", "Supabase", "Row Level Security on all tables"],
                ["Headers", "CSP, HSTS, X-Frame", "next.config.ts — whitelist tracking domains"],
                ["Audit", "logAdminAction()", "Admin actions logged to admin_audit_log"],
                ["Signature", "SHA-512", "Midtrans payment webhook verification"],
              ]} />
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">🔐 Credential Encryption (AES-256-GCM)</h4>
                <p className="text-text-muted text-xs mb-3">Akun game ML (login + password) dienkripsi sebelum disimpan di database.</p>
                <StepFlow steps={[
                  { title: "Key Derivation", desc: "ENCRYPTION_KEY (env var, min 16 char) → SHA-256 hash → 32-byte key" },
                  { title: "Encrypt", desc: "Random 12-byte IV + AES-256-GCM cipher → Format: IV:AuthTag:Ciphertext (hex)" },
                  { title: "Stored", desc: "account_login & account_password tersimpan terenkripsi di tabel orders" },
                  { title: "Decrypt", desc: "Worker buka credentials → coba derived key, fallback legacy padded key. Auth tag diverifikasi." },
                ]} />
                <InfoBox type="info">
                  <strong>Legacy support:</strong> Data lama yang dienkripsi dengan key padding (bukan SHA-256) tetap bisa didekripsi. Sistem otomatis fallback.
                </InfoBox>
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">🛡️ Middleware Security Details</h4>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Rate Limiting</h5>
                    <Table headers={["Scope", "Limit", "Window"]} rows={[
                      ["General API (/api/*)", "100 requests", "60 detik per IP"],
                      ["Auth endpoints", "10 requests", "5 menit per IP"],
                    ]} />
                    <p className="text-text-muted text-[11px] mt-1">IP dari x-forwarded-for. In-memory sliding window (reset saat cold start). Return 429 + Retry-After header.</p>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Pattern Blocking (400 Bad Request)</h5>
                    <ul className="text-text-muted text-[11px] space-y-0.5 ml-3 list-disc">
                      <li><strong>Path traversal:</strong> <Code>{".."}</Code></li>
                      <li><strong>XSS:</strong> <Code>{"<script"}</Code>, <Code>{"javascript:"}</Code>, event handlers (<Code>{"on*="}</Code>), encoded scripts</li>
                      <li><strong>Template injection:</strong> <Code>{"${...}"}</Code></li>
                      <li><strong>SQL injection:</strong> <Code>union select</Code>, <Code>insert into</Code>, <Code>delete from</Code>, <Code>drop table</Code></li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Bot/Scanner Blocking (404)</h5>
                    <p className="text-text-muted text-[11px]">Auto-block: <Code>/wp-admin</Code>, <Code>/wp-login</Code>, <Code>/phpmyadmin</Code>, <Code>/.env</Code>, <Code>/.git</Code>, <Code>/config</Code>, <Code>/backup</Code>, <Code>/shell</Code>, <Code>/cmd</Code>, <Code>/eval</Code>, dll. Route <Code>/admin</Code> tetap boleh.</p>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">HTTP Method Validation</h5>
                    <p className="text-text-muted text-[11px]">Hanya <Code>GET, POST, PUT, DELETE, PATCH, OPTIONS</Code> yang diizinkan di /api/*. Method lain ditolak.</p>
                  </div>
                </div>
              </div>
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
\u2502   \u2502   \u251C\u2500\u2500 dashboard/          # Admin (page + PayrollTab + ReportsTab + SettingsTab + AdsTab)
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
\u2502   \u251C\u2500\u2500 tracking.ts             # Client-side conversion events
\u2502   \u251C\u2500\u2500 meta-capi.ts            # Server-side Meta CAPI
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

    // ===================== ROADMAP =====================
    {
      id: "roadmap",
      label: "Roadmap",
      catIcon: Rocket,
      color: "text-orange-400",
      sections: [
        {
          id: "roadmap-overview",
          icon: Rocket,
          title: "Development Roadmap",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Rencana pengembangan fitur ETNYX ke depan. Prioritas bisa berubah sesuai kebutuhan bisnis dan feedback tim.</p>

              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">DONE</span>
                  <h4 className="text-green-400 font-semibold text-sm">Phase 1 &mdash; Core Platform (v1.0 - v2.2)</h4>
                </div>
                <ul className="text-text-muted text-xs space-y-1.5 ml-4">
                  {[
                    "Full ordering system: 3 mode (Paket, Per Star, Gendong) + promo code + referral",
                    "Dual payment: Transfer Manual (11 rekening) + Midtrans Auto (VA, QRIS, e-wallet)",
                    "Staff management RBAC: Admin, Lead, Worker + tim hierarchy via lead_id",
                    "15-tab admin dashboard + Lead dashboard + Worker dashboard",
                    "Multi-channel notification: Telegram 4 grup, WhatsApp (Fonnte), Email (Resend), Web Push",
                    "Interactive Telegram bot: 9 commands + inline keyboard (konfirmasi/tolak/assign)",
                    "Security: AES-256-GCM encrypted credentials, rate limiting, CSP, middleware blocking",
                    "Payroll: auto commission 60%, salary, batch payout, 11 payment methods",
                    "Reward system: points, 4 tiers (Bronze-Platinum), referral, reward catalog",
                    "Review & report system: rating service + worker, auto-testimonial, worker report",
                    "Full-funnel conversion tracking: Meta Pixel, GA4, GTM, TikTok, Google Ads, Meta CAPI",
                    "UTM attribution + Ad Performance dashboard (ROAS, CPA per platform/campaign)",
                    "Customer dashboard: order history, reward points, referral code",
                    "Order tracking real-time + worker submissions + screenshot gallery",
                    "Order chat system (polling-based) + internal order notes",
                    "WA messages: clean formatting, links clickable, trailing slash fix",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-400 shrink-0">{"✓"}</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-medium">PLANNING</span>
                  <h4 className="text-yellow-400 font-semibold text-sm">Phase 2 &mdash; Optimization &amp; Automation</h4>
                </div>
                <ul className="text-text-muted text-xs space-y-1.5 ml-4">
                  {[
                    "Auto-assign: order otomatis ke worker berdasarkan skill, rating, dan workload",
                    "Real-time chat: WebSocket/SSE, ganti polling saat ini",
                    "Worker earnings dashboard: lihat pending earnings + riwayat komisi langsung",
                    "Auto follow-up scheduler: otomatis kirim WA jika belum bayar dalam X jam",
                    "Dashboard analytics lanjutan: retention rate, repeat order, churn prediction",
                    "PWA improvements: offline support, push notif dari browser",
                    "Multi-bahasa full (saat ini ID + EN partial)",
                    "WhatsApp Business API integration (upgrade dari Fonnte)",
                    "Bulk order import via CSV untuk admin",
                    "Order priority queue: express order otomatis muncul di atas daftar",
                    "Notification preferences: customer bisa pilih channel (WA/email/push)",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-400 shrink-0">{"○"}</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">FUTURE</span>
                  <h4 className="text-purple-400 font-semibold text-sm">Phase 3 &mdash; Scale &amp; Expand</h4>
                </div>
                <ul className="text-text-muted text-xs space-y-1.5 ml-4">
                  {[
                    "Multi-game support: PUBG Mobile, Genshin Impact, Valorant, Honor of Kings",
                    "Marketplace model: worker self-register + verifikasi + profile public",
                    "Customer loyalty advanced: daily check-in, missions, limited-time reward",
                    "Payment gateway tambahan: Xendit, Stripe (international)",
                    "Mobile app native (React Native) untuk customer + worker",
                    "AI-powered dynamic pricing berdasarkan demand & supply",
                    "Worker leaderboard public: showcase top boosters di homepage",
                    "Subscription model: langganan bulanan maintenance rank",
                    "Public API: integrasi dengan platform/partner lain",
                    "Multi-tenant / whitelabel: jual platform ke brand joki lain",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-purple-400 shrink-0">{"◇"}</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <InfoBox type="info">
                <strong>Request fitur?</strong> Sampaikan ke Admin / Developer via Telegram. Roadmap di-update berkala berdasarkan prioritas bisnis dan feedback tim.
              </InfoBox>
            </div>
          ),
        },
      ],
    },

    // ===================== CHANGELOG =====================
    {
      id: "changelog",
      label: "Changelog",
      catIcon: Clock,
      color: "text-yellow-400",
      sections: [
        {
          id: "changelog-latest",
          icon: FileText,
          title: "Update Terbaru",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Riwayat update fitur, perbaikan bug, dan perubahan workflow. Diurutkan dari yang terbaru.</p>

              <div className="bg-background rounded-lg p-4 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-medium">v2.2</span>
                  <h4 className="text-yellow-400 font-semibold text-sm">7 April 2026 (Update)</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Docs Major Update</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">Team Management &amp; Hierarchy</strong> &mdash; Panduan lengkap hierarki Admin → Lead → Worker, cara buat tim, permission matrix</li>
                      <li><strong className="text-text">SOP Harian Lead</strong> &mdash; Checklist pagi/siang/malam untuk koordinator</li>
                      <li><strong className="text-text">{"Do's & Don'ts Lead"}</strong> &mdash; Aturan yang harus dan tidak boleh dilakukan Lead</li>
                      <li><strong className="text-text">SOP Harian Worker</strong> &mdash; Step-by-step sebelum, selama, dan setelah pengerjaan</li>
                      <li><strong className="text-text">Aturan &amp; Sanksi Worker</strong> &mdash; 8 aturan wajib + 4 tingkatan sanksi bertingkat</li>
                      <li><strong className="text-text">Komisi &amp; Penghasilan Worker</strong> &mdash; Cara hitung komisi, contoh perhitungan, payment methods</li>
                      <li><strong className="text-text">FAQ &amp; Troubleshooting</strong> &mdash; 12 pertanyaan umum + solusi (WA, Telegram, Midtrans, dll)</li>
                      <li><strong className="text-text">Development Roadmap</strong> &mdash; 3 phase: Done, Planning, Future</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">WhatsApp Link Fix</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li>Semua emoji dihapus dari pesan WA (mengganggu deteksi link WhatsApp)</li>
                      <li>Semua URL sekarang di baris sendiri (tidak nempel teks/emoji)</li>
                      <li>Trailing slash ditambahkan sebelum query params: <Code>{"/track/?id=xxx"}</Code></li>
                      <li>Fix berlaku untuk 4 auto-notification + 5 follow-up templates</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">WA Number &amp; Dynamic Config</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li>Nomor WA admin diubah ke <Code>081515141452</Code></li>
                      <li>WhatsApp floating button sekarang ambil nomor dari Settings &rarr; Social Links (dinamis)</li>
                      <li>Footer juga ambil nomor dari settings API</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Notifikasi Improvements</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li>Semua judul notifikasi Telegram sekarang pakai prefix speaker emoji</li>
                      <li>WA order selesai include peringatan worker misconduct + reward skin gratis untuk report valid</li>
                      <li>Teks &quot;skin gratis&quot; dihapus dari follow-up messages (hanya di pesan selesai)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-text-muted font-medium">v2.1</span>
                  <h4 className="text-text-muted font-semibold text-sm">7 April 2026</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Dual Payment System</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">Transfer Manual</strong> &mdash; BCA, BRI, BNI, Mandiri, Jago, DANA, GoPay, OVO, ShopeePay, LinkAja, QRIS</li>
                      <li>Halaman <Code>/payment/manual</Code> &mdash; auto-redirect setelah order, daftar rekening aktif + upload bukti</li>
                      <li>Admin approve/reject bukti transfer dari Dashboard</li>
                      <li>Follow-up WA payment sekarang include daftar rekening + link upload bukti</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Perbaikan Alur Notifikasi</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">WA baru: Pembayaran Dikonfirmasi</strong> &mdash; Dikirim setelah admin approve bukti / Midtrans auto-confirm. Berisi detail order, link tracking, reminder keamanan</li>
                      <li><strong className="text-text">WA Sedang Dikerjakan</strong> &mdash; Sekarang hanya dikirim saat worker mulai kerja (bukan saat bayar)</li>
                      <li>Fix: Telegram &quot;ORDER BARU!&quot; hanya dikirim 1x saat order dibuat (tidak lagi double saat bayar)</li>
                      <li>Fix: Telegram confirm dari bot sekarang kirim WA &quot;Pembayaran Dikonfirmasi&quot; (bukan &quot;Sedang Dikerjakan&quot;)</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Bug Fixes</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li>Fix: <Code>confirmed_at</Code> dan <Code>completed_at</Code> timestamp sekarang otomatis diisi saat status berubah</li>
                      <li>Fix: Field <Code>price</Code> dan <Code>email</Code> di notifikasi tidak lagi undefined (mapping ke kolom DB yang benar)</li>
                      <li>Fix: Midtrans webhook sekarang set <Code>confirmed_at</Code> + kirim notifikasi yang benar</li>
                      <li>Mobile UI payment page diperbaiki &mdash; steps compact, cards lebih rapi</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">API Baru</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><Code>POST /api/payment/manual</Code> &mdash; Upload bukti transfer manual</li>
                      <li><Code>PATCH /api/admin/payment-proof</Code> &mdash; Admin approve/reject bukti transfer</li>
                      <li>Test notifications sekarang support: <Code>telegram_completed</Code>, <Code>telegram_review</Code>, <Code>telegram_report</Code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-text-muted font-medium">v2.0</span>
                  <h4 className="text-text-muted font-semibold text-sm">Release Awal</h4>
                </div>
                <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                  <li>Full platform: order, payment (Midtrans), staff management (RBAC), reward system</li>
                  <li>15-tab admin dashboard, lead &amp; worker dashboards</li>
                  <li>Multi-channel notification: Telegram 4 grup, WhatsApp, Email, Push</li>
                  <li>Conversion tracking: Meta Pixel, GA4, GTM, TikTok, Google Ads, Meta CAPI</li>
                  <li>UTM attribution &amp; ad performance dashboard</li>
                  <li>Payroll: komisi auto, gaji, batch payout</li>
                  <li>Security: AES-256 encrypted credentials, rate limiting, CSP, RLS</li>
                  <li>Customer dashboard: order history, reward points, referral</li>
                  <li>Order chat system, real-time tracking, review &amp; report</li>
                </ul>
              </div>
            </div>
          ),
        },
        {
          id: "workflow-summary",
          icon: Zap,
          title: "Ringkasan Workflow Terkini",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Workflow lengkap per role setelah update terakhir.</p>

              <div className="bg-background rounded-lg p-4 border border-purple-500/20">
                <h4 className="text-purple-400 font-semibold text-sm mb-3">Customer Workflow</h4>
                <StepFlow steps={[
                  { title: "Buka /order", desc: "Pilih rank, package, isi credentials, pilih metode bayar" },
                  { title: "Transfer Manual", desc: "Auto-redirect ke /payment/manual — lihat rekening — transfer — upload bukti" },
                  { title: "Atau Midtrans Auto", desc: "Bayar via VA/QRIS/GoPay/ShopeePay langsung dari popup" },
                  { title: "Terima WA 'Pembayaran Dikonfirmasi'", desc: "Setelah admin approve / auto-confirm. Berisi link tracking." },
                  { title: "Track progress di /track", desc: "Lihat status, progress %, achievement worker, screenshot" },
                  { title: "Terima WA 'Order Selesai'", desc: "Ganti password, submit review di link yang dikirim" },
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3">Admin Workflow</h4>
                <StepFlow steps={[
                  { title: "Terima Telegram 'ORDER BARU!'", desc: "Notif ke admin group saat customer order. Tombol Konfirmasi/Tolak." },
                  { title: "Approve bukti transfer (manual)", desc: "Dashboard > Orders > klik order > approve bukti. Auto: WA + Telegram worker." },
                  { title: "Atau confirm dari Telegram", desc: "Klik tombol Konfirmasi di Telegram = approve + notif ke customer + worker." },
                  { title: "Assign ke worker", desc: "Dashboard > Orders / Lead Dashboard > pilih worker > Assign." },
                  { title: "Monitor progress", desc: "Dashboard overview, worker submissions, follow-up WA jika perlu." },
                  { title: "Review & report", desc: "Telegram notif masuk > approve/hide review > resolve/dismiss report." },
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">Worker Workflow</h4>
                <StepFlow steps={[
                  { title: "Terima Telegram 'ORDER DIKONFIRMASI'", desc: "Notif ke worker group saat pembayaran dikonfirmasi." },
                  { title: "Terima assignment", desc: "Telegram 'ORDER DITUGASKAN' + muncul di worker dashboard." },
                  { title: "Mulai kerja", desc: "Klik 'Mulai' di dashboard. Customer dapat WA 'Sedang Dikerjakan'." },
                  { title: "Update progress", desc: "Update %, submit match results + screenshot." },
                  { title: "Selesai", desc: "Klik 'Selesai'. Auto: commission, Telegram admin, WA customer." },
                ]} />
              </div>
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
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">v2.2</span>
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
            ETNYX Documentation v2.2 &mdash; {allSections.length} sections across {categories.length} categories
          </p>
        </footer>
      </main>
    </div>
  );
}
