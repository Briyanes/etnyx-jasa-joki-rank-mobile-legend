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
  Flame, CheckSquare2, Ban, CalendarDays, ShieldCheck,
  Lightbulb,
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
                <StatCard label="Halaman" value="18" sub="Customer + Admin" />
                <StatCard label="API Routes" value="65+" sub="RESTful endpoints" />
                <StatCard label="Dashboard Tabs" value="15" sub="Admin CMS" />
                <StatCard label="Integrasi" value="7" sub="External services" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-background rounded-lg p-3 border border-white/5">
                  <h4 className="text-text font-medium text-sm mb-2">Tech Stack</h4>
                  <ul className="text-text-muted text-xs space-y-1">
                    <li>&#8226; <strong className="text-text">Next.js 16</strong> + React 19 (Turbopack)</li>
                    <li>&#8226; <strong className="text-text">Supabase</strong> &mdash; Database + Auth + Storage</li>
                    <li>&#8226; <strong className="text-text">iPaymu</strong> &mdash; Payment Gateway</li>
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
                    <li>&#8226; <strong className="text-text">ML Account API</strong> &mdash; Cek akun ML (nickname lookup)</li>
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
                  ["Login", "/login", <RoleBadge key="p6" role="public" />],
                  ["Register", "/register", <RoleBadge key="p7" role="public" />],
                  ["Reset Password", "/reset-password", <RoleBadge key="p8" role="public" />],
                  ["Payment Manual", "/payment/manual", <RoleBadge key="p9" role="customer" />],
                  ["Payment Success", "/payment/success", <RoleBadge key="p10" role="customer" />],
                  ["Submit Review", "/review?id=xxx", <RoleBadge key="p5" role="customer" />],
                  ["Customer Dashboard", "/dashboard", <RoleBadge key="c" role="customer" />],
                  ["Privacy Policy", "/privacy", <RoleBadge key="pp" role="public" />],
                  ["Terms of Service", "/terms", <RoleBadge key="tos" role="public" />],
                  ["Admin Dashboard", "/admin/dashboard", <RoleBadge key="a" role="admin" />],
                  ["Lead Dashboard", "/admin/lead", <RoleBadge key="l" role="lead" />],
                  ["Worker Dashboard", "/admin/worker", <RoleBadge key="w" role="worker" />],
                  ["Admin Docs", "/admin/docs", <span key="all" className="flex gap-1"><RoleBadge role="admin" /><RoleBadge role="lead" /><RoleBadge role="worker" /></span>],
                  ["Sitemap", "/sitemap.xml", <RoleBadge key="sm" role="public" />],
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
                    <li>Konfigurasi integrasi (iPaymu, Telegram, WhatsApp, Email)</li>
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
                    <li>Order jasa, bayar via iPaymu</li>
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
                { title: "Pilih Metode Bayar", desc: "2 opsi: Transfer Manual (BCA, BRI, BNI, Mandiri, Jago, DANA, GoPay, OVO, ShopeePay, LinkAja, QRIS) atau iPaymu Auto (VA, QRIS, GoPay, ShopeePay, CC).", badge: "customer", page: "/order (step 3)" },
                { title: "A) Transfer Manual", desc: "Auto-redirect ke /payment/manual — lihat daftar rekening + upload bukti transfer. Admin approve/reject bukti.", badge: "customer", page: "/payment/manual" },
                { title: "B) iPaymu Auto", desc: "Payment URL di-generate, customer bayar via popup/redirect. Webhook otomatis confirm. Jika iPaymu gagal/trouble, otomatis fallback ke manual transfer + WA dikirim ke customer dengan info rekening & link upload bukti.", badge: "customer", page: "iPaymu" },
                { title: "Pembayaran Dikonfirmasi", desc: "Manual: admin cek bukti transfer + cek credential login → klik Konfirmasi Bayar. iPaymu: webhook auto-confirm. Status: confirmed, payment: paid. WA 'Pembayaran Dikonfirmasi' + Telegram ke Worker Group.", badge: "auto", page: "/api/payment/notification" },
                { title: "Multi-Channel Notifikasi", desc: "Telegram ke Admin Group (dengan tombol Konfirmasi/Tolak), WhatsApp 'Pembayaran Dikonfirmasi' ke customer, Telegram ke Worker Group.", badge: "auto" },
                { title: "Lead/Admin Assign Order", desc: "Buka Lead Dashboard, pilih worker, Assign. Worker dapat notif Telegram. PENTING: Worker hanya bisa di-assign setelah pembayaran dikonfirmasi (payment_status = paid).", badge: "lead", page: "/admin/lead" },
                { title: "Worker Mulai Kerja", desc: "Worker buka dashboard, klik Mulai, status in_progress. WA 'Sedang Dikerjakan' ke customer. Push rank customer.", badge: "worker", page: "/admin/worker" },
                { title: "Worker Update Progress", desc: "Update progress %, current rank. Customer bisa lihat real-time di /track.", badge: "worker" },
                { title: "Worker Submit Hasil", desc: "Input: stars gained, MVP, savage, maniac, wins, durasi. Upload screenshot. Customer bisa lihat langsung di /track.", badge: "worker" },
                { title: "Worker Selesai", desc: "Klik Selesai, status completed. Auto-generate commission. Telegram notif ke admin. WA 'Order Selesai' + link review ke customer.", badge: "worker" },
                { title: "Customer Review", desc: "Customer dapat link review via WA/Email, rating service & worker, bisa report. Auto-create testimonial jika rating 4-5 bintang.", badge: "customer", page: "/review" },
              ]} />
              <InfoBox type="info">
                <strong>Dual Payment:</strong> Transfer Manual muncul di /payment/manual setelah order dibuat. iPaymu Auto muncul jika API Key dikonfigurasi di Settings &rarr; Integrations. Jika iPaymu gagal/trouble saat order dibuat, otomatis fallback ke manual transfer dan WA follow-up dikirim ke customer.
              </InfoBox>
              <InfoBox type="warning">
                <strong>Status Flow:</strong> pending &rarr; confirmed (bayar dikonfirmasi) &rarr; in_progress (dikerjakan) &rarr; completed (selesai). Admin bisa cancel kapan saja.
              </InfoBox>
              <InfoBox type="success">
                <strong>Worker Assignment Lock:</strong> Worker hanya bisa di-assign setelah pembayaran dikonfirmasi. Dropdown assign worker otomatis disabled untuk order yang belum paid.
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
                  { tab: "Pricing", desc: "3 mode pricing: Paket (bundle rank), Per Star (per bintang), Gendong (duo). Edit harga inline, save all. Season Pricing auto-scheduler: harga otomatis berubah sesuai fase season ML." },
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
                  { tab: "Settings", desc: "10 sub-tab: Visibilitas, Hero, Banner, FAQ, Tim, Sosial, Info Situs, Pixels, Integrasi (iPaymu/Telegram/WA/Email), General." },
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
          id: "settings-guide",
          icon: Settings,
          title: "Settings Tab (10 Sub-Tab)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Dashboard &rarr; Settings berisi 10 sub-tab untuk mengontrol seluruh konfigurasi platform. Setiap perubahan langsung tersimpan ke database <Code>settings</Code> (key-value JSONB).</p>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">1. Visibilitas &mdash; Kontrol Homepage Sections</h4>
                <p className="text-text-muted text-xs mb-2"><strong>Fungsi:</strong> Toggle show/hide 9 section di homepage. Visitor tidak akan melihat section yang dimatikan.</p>
                <Table headers={["Section", "Default", "Keterangan"]} rows={[
                  ["Hero", "On", "Banner utama: headline, subheadline, tombol CTA"],
                  ["Pricing", "On", "Tampilan harga paket ke customer"],
                  ["Why Choose Us", "On", "Keunggulan layanan ETNYX"],
                  ["Team Showcase", "On", "Profil booster featured"],
                  ["Testimonials", "On", "Review customer (yang di-approve admin)"],
                  ["Portfolio", "On", "Showcase hasil boosting (before/after)"],
                  ["Tracking", "On", "Info fitur tracking real-time"],
                  ["FAQ", "On", "Pertanyaan yang sering ditanyakan"],
                  ["CTA", "On", "Tombol call-to-action terakhir"],
                ]} />
                <p className="text-text-muted text-[11px] mt-2"><strong>Cara kerja:</strong> Disimpan ke key <Code>section_visibility</Code>. Homepage fetch saat load → section yang false tidak di-render. Navbar juga auto-hide menu item untuk section hidden.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">2. Hero &mdash; Banner Utama Homepage</h4>
                <Table headers={["Field", "Contoh", "Keterangan"]} rows={[
                  ["Headline", "Push Rank, Tanpa Main.", "Teks utama. Koma = baris baru di tampilan. Bisa multi-line."],
                  ["Subheadline", "Jasa joki ML terpercaya...", "Teks deskripsi di bawah headline"],
                  ["CTA Primary", "Order Sekarang", "Tombol utama (link ke /order)"],
                  ["CTA Secondary", "Cek Harga", "Tombol kedua (scroll ke pricing)"],
                  ["isVisible", "on/off", "Toggle tampilkan hero section"],
                ]} />
                <p className="text-text-muted text-[11px] mt-2"><strong>Disimpan ke:</strong> <Code>hero</Code> key. Customer melihat ini sebagai hal pertama saat buka website.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">3. Banner &mdash; Promo Banner</h4>
                <p className="text-text-muted text-xs mb-2"><strong>Fungsi:</strong> Banner kecil di atas navbar. Untuk mengumumkan promo atau info penting.</p>
                <Table headers={["Field", "Contoh"]} rows={[
                  ["Text", "🔥 Diskon 20% untuk order pertama!"],
                  ["Link", "/order"],
                  ["isVisible", "on/off"],
                ]} />
                <p className="text-text-muted text-[11px] mt-2"><strong>Cara kerja:</strong> Disimpan ke <Code>promo_banner</Code>. Customer klik banner → redirect ke link. Ada countdown timer yang persist lewat localStorage.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">4. FAQ &mdash; Kelola Pertanyaan</h4>
                <p className="text-text-muted text-xs mb-2"><strong>Fungsi:</strong> CRUD item FAQ. Tampil di homepage section FAQ.</p>
                <ul className="text-text-muted text-xs space-y-1 ml-4 list-disc">
                  <li><strong>Tambah FAQ:</strong> Klik &ldquo;Tambah FAQ&rdquo; → isi question &amp; answer</li>
                  <li><strong>Reorder:</strong> Gunakan tombol ↑↓ untuk pindah urutan</li>
                  <li><strong>Hapus:</strong> Klik ikon hapus per item</li>
                  <li><strong>Simpan:</strong> Klik Simpan untuk update semua sekaligus</li>
                </ul>
                <p className="text-text-muted text-[11px] mt-2"><strong>Disimpan ke:</strong> <Code>faq_items</Code> (array JSON). Jika kosong, homepage tampilkan FAQ default built-in.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">5. Tim &mdash; Redirect ke Boosters</h4>
                <p className="text-text-muted text-xs">Data booster sekarang dikelola dari tab <strong>Boosters</strong> di dashboard utama (CRUD: nama, WA, specialization, rating, status). Tab ini hanya menampilkan pesan redirect.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">6. Sosial &mdash; Link Media Sosial</h4>
                <Table headers={["Field", "Format", "Tampil di"]} rows={[
                  ["Instagram", "URL profil", "Footer + bio page"],
                  ["Facebook", "URL page", "Footer + bio page"],
                  ["TikTok", "URL profil", "Footer + bio page"],
                  ["YouTube", "URL channel", "Footer + bio page"],
                  ["WhatsApp", "62xxxxxxxxx", "Footer + floating button"],
                ]} />
                <p className="text-text-muted text-[11px] mt-2"><strong>Disimpan ke:</strong> <Code>social_links</Code>. WhatsApp number juga dipakai floating chat button &amp; footer otomatis.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">7. Info Situs &mdash; Identitas Brand</h4>
                <Table headers={["Field", "Contoh", "Dipakai untuk"]} rows={[
                  ["Nama Situs", "ETNYX", "Logo text, meta title, email sender name"],
                  ["Nama Perusahaan", "ETNYX Digital", "Footer, invoice, legal pages"],
                  ["Email Support", "cs@etnyx.com", "Footer, contact info, from email"],
                  ["Tagline (ID)", "Jasa Joki ML #1...", "SEO meta description (Indonesian)"],
                  ["Tagline (EN)", "#1 Trusted ML Boosting...", "SEO meta description (English)"],
                ]} />
                <p className="text-text-muted text-[11px] mt-2"><strong>Disimpan ke:</strong> <Code>site_info</Code>. Dipakai di SEO, email template, footer, dan invoice.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">8. Pixels &mdash; Tracking &amp; Analytics</h4>
                <p className="text-text-muted text-xs mb-2"><strong>Fungsi:</strong> Toggle &amp; konfigurasi 5 platform tracking tanpa edit kode.</p>
                <Table headers={["Platform", "Toggle", "Field"]} rows={[
                  ["Google Tag Manager", "isGtmEnabled", "GTM Container ID (GTM-XXXXXXX)"],
                  ["Meta Pixel", "isMetaEnabled", "Pixel ID + Access Token (CAPI)"],
                  ["Google Ads", "isGoogleAdsEnabled", "Ads ID (AW-xxx) + Conversion Label"],
                  ["Google Analytics 4", "isGoogleAnalyticsEnabled", "Measurement ID (G-xxx)"],
                  ["TikTok Pixel", "isTiktokEnabled", "Pixel ID (CXXXXXXX)"],
                ]} />
                <p className="text-text-muted text-[11px] mt-2"><strong>Cara kerja:</strong> Disimpan ke <Code>tracking_pixels</Code>. Component <Code>TrackingPixels.tsx</Code> load script hanya jika enabled. Events (PageView, Purchase, dll) fire otomatis ke semua platform aktif. Lihat section &ldquo;Conversion Tracking&rdquo; untuk detail events.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">9. Integrasi &mdash; Payment &amp; Notification APIs</h4>
                <p className="text-text-muted text-xs mb-2">Semua API keys disimpan ke <Code>integrations</Code>. Bisa diubah tanpa redeploy.</p>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">A. iPaymu (Payment Gateway)</h5>
                    <ul className="text-text-muted text-[11px] space-y-0.5 ml-3 list-disc">
                      <li>Toggle Sandbox ↔ Production (uang asli!)</li>
                      <li>Merchant ID, Server Key, Client Key</li>
                      <li>Pilih channel: BCA, BNI, Mandiri, Permata, GoPay, ShopeePay, DANA, OVO, CC, QRIS, Alfamart/Indomaret</li>
                      <li>Tombol &ldquo;Test Connection&rdquo; untuk validasi credential</li>
                      <li>Auto-display webhook URL untuk di-set di iPaymu Dashboard</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">B. Rekening Transfer Manual</h5>
                    <ul className="text-text-muted text-[11px] space-y-0.5 ml-3 list-disc">
                      <li>11 opsi: BCA, BRI, BNI, Mandiri, Jago, DANA, GoPay, OVO, ShopeePay, LinkAja, QRIS</li>
                      <li>Per rekening: nomor, nama pemilik, toggle aktif</li>
                      <li>QRIS: upload gambar QR code</li>
                      <li>Bisa tambah custom rekening/e-wallet</li>
                      <li>Rekening aktif otomatis tampil di halaman payment manual + follow-up WA</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">C. Resend (Email)</h5>
                    <ul className="text-text-muted text-[11px] space-y-0.5 ml-3 list-disc">
                      <li>API Key + From Email</li>
                      <li>Dipakai: konfirmasi bayar, invoice, verifikasi email, password reset</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">D. Fonnte (WhatsApp)</h5>
                    <ul className="text-text-muted text-[11px] space-y-0.5 ml-3 list-disc">
                      <li>API Token + Device ID (opsional)</li>
                      <li>Dipakai: 7 template WA otomatis + follow-up + semua notifikasi customer</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">E. Telegram Bot</h5>
                    <ul className="text-text-muted text-[11px] space-y-0.5 ml-3 list-disc">
                      <li>Bot Token + 4 Group IDs (Admin, Worker, Review, Report)</li>
                      <li>Dipakai: notifikasi interaktif + 9 bot commands</li>
                      <li>Setup: buat bot di @BotFather → tambah ke grup → isi Chat ID → register webhook</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">F. Cek Akun ML (Custom API)</h5>
                    <ul className="text-text-muted text-[11px] space-y-0.5 ml-3 list-disc">
                      <li>URL custom untuk lookup nickname ML (opsional)</li>
                      <li>Jika tidak di-set, sistem pakai 2 free API publik sebagai fallback</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">10. General &mdash; Export &amp; Konfigurasi</h4>
                <p className="text-text-muted text-xs">Fitur export data dan konfigurasi environment. Export CSV tersedia juga di Reports tab (lebih lengkap).</p>
              </div>

              <InfoBox type="info">
                <strong>Semua settings disimpan instant.</strong> Klik Simpan → POST/PUT ke <Code>/api/admin/settings</Code> → response langsung. Tidak perlu redeploy. Homepage &amp; order page otomatis ambil data terbaru saat load.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "homepage-cms",
          icon: Globe,
          title: "Homepage CMS & Sections",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Homepage terdiri dari 9 section dinamis + navbar/footer. Semua konten bisa dikelola dari Dashboard tanpa edit kode.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Cara Kerja CMS Homepage</h4>
                <StepFlow steps={[
                  { title: "Visitor buka homepage", desc: "Browser request ke etnyx.com" },
                  { title: "Fetch settings dari DB", desc: "Parallel fetch: section_visibility, hero, promo_banner, faq_items, social_links, site_info, tracking_pixels" },
                  { title: "Render sections", desc: "Hanya section yang visibility = true yang di-render. Setiap section dibungkus ScrollAnimation (fade-in saat scroll)." },
                  { title: "Dynamic content", desc: "Hero text, FAQ items, testimonials, portfolio → semua dari database. Pricing → dari pricing_catalog." },
                  { title: "Navbar sync", desc: "Menu items otomatis hide jika section-nya hidden. Smooth scroll ke section masing-masing." },
                ]} />
              </div>
              <Table headers={["Section", "Sumber Data", "Dikelola dari"]} rows={[
                ["Hero Banner", "hero (settings)", "Settings → Hero"],
                ["Promo Banner", "promo_banner (settings)", "Settings → Banner"],
                ["Pricing", "pricing_catalog + season_pricing", "Dashboard → Pricing tab"],
                ["Why Choose Us", "Hardcoded (bisa di-hide)", "Settings → Visibilitas"],
                ["Team Showcase", "boosters (tabel)", "Dashboard → Boosters tab"],
                ["Testimonials", "testimonials (tabel, visible=true)", "Dashboard → Testi tab"],
                ["Portfolio", "portfolio (tabel)", "Dashboard → Portfolio tab"],
                ["FAQ", "faq_items (settings)", "Settings → FAQ"],
                ["CTA", "Hardcoded + social_links", "Settings → Visibilitas + Sosial"],
                ["Footer", "social_links + site_info", "Settings → Sosial + Info Situs"],
              ]} />
              <InfoBox type="info">
                <strong>Perubahan instan:</strong> Edit di dashboard → simpan → refresh homepage → konten berubah. Tidak ada cache delay. Pricing section juga menampilkan label season pricing jika aktif.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "price-calculation",
          icon: BarChart3,
          title: "Cara Hitung Harga Order",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Formula lengkap perhitungan harga dari base price hingga total akhir yang dibayar customer.</p>
              <div className="bg-background rounded-lg p-4 border border-accent/20">
                <h4 className="text-accent font-semibold text-sm mb-3">Formula Harga</h4>
                <div className="bg-background rounded-lg p-3 border border-white/10 font-mono text-xs text-text space-y-1.5">
                  <p>1. <strong className="text-blue-400">Base Price</strong> = harga paket / (perStar × jumlah bintang) / (gendong × jumlah bintang)</p>
                  <p>2. <strong className="text-red-400">Season Multiplier</strong> = base × multiplier fase aktif (jika season pricing ON)</p>
                  <p>3. <strong className="text-yellow-400">Express</strong> = +20% dari harga setelah season (jika dipilih)</p>
                  <p>4. <strong className="text-purple-400">Premium</strong> = +30% dari harga setelah season (jika dipilih)</p>
                  <p>5. <strong className="text-green-400">Diskon Promo</strong> = kurangi amount promo code (% atau fixed)</p>
                  <p>6. <strong className="text-green-400">Diskon Member</strong> = kurangi tier discount (Silver 2%, Gold 5%, Plat 10%)</p>
                  <p>7. <strong className="text-accent">TOTAL</strong> = hasil akhir setelah semua perhitungan</p>
                </div>
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Contoh Perhitungan</h4>
                <Table headers={["Step", "Hitung", "Hasil"]} rows={[
                  ["Base (Paket Epic I → Legend V)", "Rp 150.000", "Rp 150.000"],
                  ["Season: Early Season (×1.25)", "150.000 × 1.25", "Rp 187.500"],
                  ["Express (+20%)", "187.500 × 0.20 = 37.500", "Rp 225.000"],
                  ["Premium (+30%)", "187.500 × 0.30 = 56.250", "Rp 281.250"],
                  ["Promo DISKON20 (20%, max 50K)", "−50.000", "Rp 231.250"],
                  ["Member Gold (5%)", "−11.562", "Rp 219.688"],
                ]} />
                <p className="text-text-muted text-[11px] mt-2">Express &amp; Premium dihitung dari harga <strong>setelah</strong> season multiplier, bukan base original.</p>
              </div>
              <Table headers={["Mode", "Cara Hitung Base Price"]} rows={[
                ["Paket", "Harga tetap per paket (Rp X dari pricing_catalog)"],
                ["Per Star", "Harga per bintang tier × jumlah star. Contoh: Epic = Rp 8.000/star × 15 star = Rp 120.000"],
                ["Gendong", "Harga per bintang tier × jumlah star (lebih mahal dari Per Star karena duo)"],
              ]} />
              <InfoBox type="warning">
                <strong>Di halaman order &amp; homepage:</strong> Jika season pricing aktif, semua harga yang ditampilkan sudah dikalikan multiplier fase aktif. Customer melihat harga final, bukan harga dasar.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "admin-action-buttons",
          icon: Zap,
          title: "Order Action Buttons",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Tombol aksi yang muncul di setiap order berdasarkan status. Dashboard &rarr; Orders tab.</p>

              <div className="bg-background rounded-lg p-4 border border-yellow-500/20">
                <h4 className="text-yellow-400 font-semibold text-sm mb-3">{"PENDING"} &mdash; Menunggu Bayar</h4>
                <Table headers={["Tombol", "Warna", "Aksi", "WA ke Customer"]} rows={[
                  ["Lihat Bukti Transfer", "Kuning", "Buka modal bukti transfer (hanya muncul untuk transfer manual)", "—"],
                  ["Konfirmasi Bayar", "Hijau", "Status → confirmed, payment → paid. Hanya muncul untuk order MANUAL TRANSFER. Order iPaymu otomatis di-confirm via webhook.", "\"Pembayaran Dikonfirmasi\" + link track"],
                  ["Menunggu iPaymu", "Biru", "Label status untuk order iPaymu yang belum dibayar. Tidak bisa diklik — menunggu webhook otomatis.", "—"],
                  ["Follow Up Bayar", "Biru", "Kirim WA reminder bayar", "\"Reminder pembayaran\" + rekening + link upload bukti"],
                  ["Cancel", "Merah", "Status → cancelled", "\"Order Dibatalkan\" + info hubungi kami"],
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-blue-400 font-semibold text-sm mb-3">{"CONFIRMED"} &mdash; Sudah Bayar</h4>
                <Table headers={["Tombol", "Warna", "Aksi", "WA ke Customer"]} rows={[
                  ["Mulai Kerjakan", "Accent", "Status → in_progress", "\"Sedang Dikerjakan\" + link track"],
                  ["Credentials", "Kuning", "Lihat akun ML customer (AES-256 encrypted)", "—"],
                  ["Minta Credentials", "Biru", "Kirim WA minta data login akun ML", "\"Minta data login\" + instruksi"],
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-accent/20">
                <h4 className="text-accent font-semibold text-sm mb-3">{"IN PROGRESS"} &mdash; Sedang Dikerjakan</h4>
                <Table headers={["Tombol", "Warna", "Aksi", "WA ke Customer"]} rows={[
                  ["Selesaikan", "Hijau", "Status → completed + auto commission 60%", "\"Order Selesai\" + link review + warning worker"],
                  ["Credentials", "Kuning", "Lihat akun ML customer", "—"],
                  ["Update Progress WA", "Biru", "Kirim WA update progress %", "\"Update progress\" + % + link track"],
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">{"COMPLETED"} &mdash; Selesai</h4>
                <Table headers={["Tombol", "Warna", "Aksi", "WA ke Customer"]} rows={[
                  ["Minta Review", "Kuning", "Kirim WA minta review", "\"Terima kasih\" + link review"],
                  ["Kirim Notif Selesai", "Biru", "Kirim ulang notif selesai", "\"Order Selesai\" (ulang)"],
                  ["Reopen Order", "Oranye", "Status → in_progress (buka kembali)", "—"],
                ]} />
              </div>

              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3">{"CANCELLED"} &mdash; Dibatalkan</h4>
                <Table headers={["Tombol", "Warna", "Aksi", "WA ke Customer"]} rows={[
                  ["Reaktivasi", "Accent", "Status → pending (aktifkan kembali)", "—"],
                  ["Follow Up WA", "Biru", "Kirim WA reactivation", "\"Mau lanjut order?\""],
                ]} />
              </div>

              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">Tombol Universal (Semua Status)</h4>
                <Table headers={["Tombol", "Aksi"]} rows={[
                  ["WA (hijau kecil)", "Buka WhatsApp manual ke customer dengan template sapaan"],
                  ["Copy", "Copy info order ke clipboard (ID, username, rank, dll)"],
                ]} />
              </div>

              <InfoBox type="warning">
                <strong>Urutan penting!</strong> Untuk order manual transfer: Lihat bukti transfer + cek credential login dulu sebelum klik Konfirmasi Bayar. Jangan konfirmasi tanpa verifikasi. Untuk order iPaymu: konfirmasi otomatis via webhook, tidak perlu manual.
              </InfoBox>
              <InfoBox type="info">
                <strong>Assign Worker:</strong> Dropdown assign worker otomatis disabled/terkunci sampai pembayaran dikonfirmasi (payment_status = paid). Ini berlaku untuk semua metode pembayaran.
              </InfoBox>

              <div className="bg-background rounded-lg p-4 border border-accent/20 mt-4">
                <h4 className="text-accent font-semibold text-sm mb-3">Akses Tombol per Role</h4>
                <p className="text-text-muted text-xs mb-3">Berikut tombol yang bisa diklik oleh masing-masing role. Tombol di luar akses role tidak muncul di dashboard.</p>
                <Table headers={["Tombol / Aksi", "Admin", "Lead", "Worker"]} rows={[
                  ["Lihat Bukti Transfer", "Ya", "Ya", "—"],
                  ["Konfirmasi Bayar", "Ya", "Ya", "—"],
                  ["Follow Up Bayar", "Ya", "Ya", "—"],
                  ["Cancel Order", "Ya", "—", "—"],
                  ["Mulai Kerjakan", "Ya", "Ya", "—"],
                  ["Credentials (lihat)", "Ya", "Ya", "Ya"],
                  ["Minta Credentials", "Ya", "Ya", "—"],
                  ["Selesaikan Order", "Ya", "Ya", "Ya"],
                  ["Update Progress WA", "Ya", "Ya", "—"],
                  ["Minta Review", "Ya", "Ya", "—"],
                  ["Kirim Notif Selesai", "Ya", "Ya", "—"],
                  ["Reopen Order", "Ya", "—", "—"],
                  ["Reaktivasi", "Ya", "—", "—"],
                  ["Assign Worker (hanya setelah paid)", "Ya", "Ya", "—"],
                  ["WA Manual", "Ya", "Ya", "Ya"],
                  ["Copy Info", "Ya", "Ya", "Ya"],
                ]} />
                <InfoBox type="info">
                  <strong>Worker</strong> hanya bisa mengakses order yang di-assign ke mereka. Tombol utama worker: <strong>Credentials</strong> (lihat akun), <strong>Selesaikan</strong> (mark complete), <strong>WA Manual</strong>, dan <strong>Copy Info</strong>.
                </InfoBox>
              </div>
            </div>
          ),
        },
        {
          id: "sop-admin",
          icon: ClipboardList,
          title: "SOP Harian Admin",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Checklist harian untuk Admin/Owner. Pastikan semua operasional berjalan lancar.</p>

              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3">Pagi (08:00 - 10:00)</h4>
                <ul className="space-y-2">
                  {[
                    "Cek Telegram — ada ORDER BARU atau BUKTI TRANSFER BARU semalam?",
                    "Buka Dashboard > Orders — filter status 'pending'. Verifikasi bukti transfer yang masuk",
                    "Konfirmasi pembayaran yang sudah valid (Lihat Bukti > Konfirmasi Bayar)",
                    "Cek apakah ada order confirmed yang belum di-assign ke worker",
                    "Pastikan Lead sudah assign order — jika belum, assign sendiri atau hubungi Lead",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-red-500/10 text-red-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3">Siang (12:00 - 14:00)</h4>
                <ul className="space-y-2">
                  {[
                    "Monitor order in_progress — cek progress % worker. Adakah yang stuck?",
                    "Follow-up customer yang status pending > 6 jam via WA (Follow Up Bayar)",
                    "Cek Dashboard Overview — KPI hari ini: orders masuk, revenue, completion",
                    "Cek Telegram Review/Report group — ada review atau laporan worker baru?",
                    "Approve/hide review + resolve/dismiss report jika ada",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-red-500/10 text-red-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3">Malam (20:00 - 22:00)</h4>
                <ul className="space-y-2">
                  {[
                    "Cek order completed hari ini — pastikan worker sudah submit hasil + screenshot",
                    "Kirim 'Minta Review' ke customer yang belum review (order selesai > 24 jam)",
                    "Review laporan Ads (jika ada campaign berjalan) — cek ROAS & CPA",
                    "Cek Reports > P&L — revenue vs expense hari/minggu ini",
                    "Siapkan payout worker jika sudah masuk jadwal (per 2 minggu)",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-red-500/10 text-red-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3">Mingguan / Bi-Weekly</h4>
                <ul className="space-y-2">
                  {[
                    "Proses payout worker — Payroll > Payouts > Generate. Bayar via Dana/OVO/Bank",
                    "Review worker performance — Reports > Worker Performance. Identifikasi yang perform bagus/buruk",
                    "Update pricing jika perlu — cek kompetitor, adjust harga di Pricing tab",
                    "Evaluasi promo code — mana yang paling efektif? Buat promo baru jika perlu",
                    "Cek Ads tab — allocated budget vs actual spend. Adjust campaign jika ROAS rendah",
                    "Backup session — pastikan semua settings, rekening, staff data up-to-date",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                      <span className="w-5 h-5 rounded bg-red-500/10 text-red-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <InfoBox type="info">
                <strong>Tip:</strong> Kebanyakan task bisa ditangani langsung dari Telegram (konfirmasi order, review, report). Dashboard untuk hal yang butuh detail: bukti transfer, payroll, reports, settings.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "admin-rules",
          icon: AlertTriangle,
          title: "Do's & Don'ts Admin",
          content: (
            <div className="space-y-4">
              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">{"DO's (Lakukan)"}</h4>
                <ul className="space-y-1.5 text-text-muted text-xs">
                  {[
                    "Verifikasi bukti transfer sebelum konfirmasi — cek nominal, nama pengirim, tanggal",
                    "Konfirmasi pembayaran secepat mungkin (target < 1 jam saat jam kerja)",
                    "Assign order ke worker via Lead atau langsung jika urgent",
                    "Follow-up customer pending > 6 jam via WA template",
                    "Approve review & resolve report dalam 24 jam",
                    "Bayar komisi worker tepat waktu (bi-weekly)",
                    "Backup data penting (export CSV rutin) dan monitor Reports P&L",
                    "Update Settings & Integrations jika ada perubahan (rekening, token, dll)",
                    "Pantau worker performance — reward yang bagus, tegur yang bermasalah",
                    "Respon cepat di Telegram — customer & tim expect fast response",
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
                    "Jangan konfirmasi pembayaran tanpa lihat bukti transfer dulu",
                    "Jangan biarkan order pending > 24 jam tanpa follow-up",
                    "Jangan cancel order tanpa konfirmasi ke customer terlebih dahulu",
                    "Jangan share ENCRYPTION_KEY, JWT_SECRET, atau API keys ke siapapun",
                    "Jangan edit payroll_settings tanpa perhitungan matang (affect commission semua worker)",
                    "Jangan abaikan worker report — tindak lanjuti sesuai SOP sanksi",
                    "Jangan ubah Settings Integrations di jam sibuk (bisa disrupt notifikasi)",
                    "Jangan hapus order data — cancel saja (untuk audit trail)",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 shrink-0">{"✗"}</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-lg p-4 border border-yellow-500/20">
                <h4 className="text-yellow-400 font-semibold text-sm mb-3">Checklist Verifikasi Bukti Transfer</h4>
                <ul className="space-y-1.5 text-text-muted text-xs">
                  {[
                    "Nominal transfer cocok dengan total order (persis atau lebih)",
                    "Nama pengirim masuk akal (bukan random atau mencurigakan)",
                    "Tanggal transfer masih relevan (bukan transfer lama yang di-reuse)",
                    "Bank/e-wallet tujuan sesuai dengan rekening ETNYX yang aktif",
                    "Bukti bukan screenshot palsu (cek resolusi, font, layout yang aneh)",
                    "Jika ragu — tanya customer untuk konfirmasi via WA manual sebelum approve",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-400 shrink-0"><CheckSquare2 className="w-4 h-4" /></span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <InfoBox type="warning">
                <strong>Fraud prevention:</strong> Jika menemukan bukti transfer palsu, JANGAN konfirmasi. Cancel order + block customer jika repeat offender. Simpan bukti untuk referensi.
              </InfoBox>
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
                  { title: "Purchase", desc: "Setelah bayar via iPaymu, redirect ke success page", page: "/payment/success" },
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
                <Table headers={["Type", "Label", "Icon"]} rows={[
                  ["cheating", "Bermain curang / cheat", "Gamepad2"],
                  ["offering_services", "Menawarkan jasa di luar ETNYX", "Ban"],
                  ["rude", "Kasar / tidak sopan", "AlertTriangle"],
                  ["account_issue", "Masalah akun (diamankan, dll)", "Lock"],
                  ["other", "Lainnya", "HelpCircle"],
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
                  [<span key="t1" className="whitespace-nowrap"><strong className="text-yellow-400">pending</strong> → <strong className="text-blue-400">confirmed</strong></span>, "Bayar via iPaymu / Admin konfirmasi", <ul key="a1" className="list-disc ml-3 space-y-0.5"><li>Telegram ke Admin Group (+ tombol Assign)</li><li>WhatsApp ke customer (konfirmasi bayar)</li><li>Email ke customer (invoice)</li><li>Reward points dicatat (pending)</li></ul>],
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
          id: "order-form",
          icon: ShoppingCart,
          title: "Order Form (4 Step)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Halaman <Code>/order</Code> memiliki 4 step wizard dan 3 mode pemesanan. Customer dipandu langkah demi langkah.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">3 Mode Pemesanan</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-blue-500/20 p-3">
                    <h5 className="text-blue-400 font-semibold text-sm mb-1">Joki Paket</h5>
                    <p className="text-text-muted text-[11px]">Pilih paket bundel rank A → B. Harga tetap per paket. Tersedia kategori: GM, Epic, Legend, Mythic, dll.</p>
                  </div>
                  <div className="rounded-lg border border-green-500/20 p-3">
                    <h5 className="text-green-400 font-semibold text-sm mb-1">Joki Per Bintang</h5>
                    <p className="text-text-muted text-[11px]">Pilih rank + jumlah bintang (min 3). Harga per bintang beda tiap tier. Lebih fleksibel.</p>
                  </div>
                  <div className="rounded-lg border border-purple-500/20 p-3">
                    <h5 className="text-purple-400 font-semibold text-sm mb-1">Joki Gendong</h5>
                    <p className="text-text-muted text-[11px]">Duo — main bareng booster. Per bintang, harga lebih tinggi. Customer tetap bermain pakai akun sendiri.</p>
                  </div>
                </div>
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Step 1: Pilih Paket</h4>
                <ul className="text-text-muted text-xs space-y-1 ml-4 list-disc">
                  <li>Tab selector untuk pilih mode (Paket/Per Star/Gendong)</li>
                  <li><strong>Paket:</strong> Carousel kategori → klik paket → auto-show harga + rank</li>
                  <li><strong>Per Star/Gendong:</strong> Dropdown rank → input jumlah bintang (min 3) → harga dihitung otomatis</li>
                  <li>Harga sudah termasuk season multiplier jika season pricing aktif</li>
                  <li>Badge diskon jika ada promo harga di catalog</li>
                </ul>
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Step 2: Data Akun &amp; Kontak</h4>
                <Table headers={["Field", "Validasi", "Keterangan"]} rows={[
                  ["Login Method", "Wajib pilih 1", "6 opsi: Moonton, Facebook, Google, TikTok, VK, Apple"],
                  ["User ID", "Numerik, 3-15 digit", "User ID dari profil ML"],
                  ["Server ID", "Numerik, 3-6 digit", "Zone/Server ID ML"],
                  ["Cek Akun", "Tombol verifikasi", "Hit API → tampilkan nickname. WAJIB verifikasi sebelum lanjut."],
                  ["Nickname", "Wajib", "Auto-fill dari Cek Akun atau manual input"],
                  ["Email/No HP", "Wajib", "Email atau nomor HP untuk login akun ML"],
                  ["Password", "Wajib", "Password akun ML (dienkripsi AES-256 saat disimpan)"],
                  ["Request Hero", "Opsional, min 3", "Daftar hero yang diminta (pisah koma)"],
                  ["Catatan", "Opsional", "Pesan khusus ke penjoki"],
                ]} />
                <InfoBox type="info">
                  <strong>Keamanan:</strong> Credentials (email + password akun ML) langsung dienkripsi AES-256-GCM saat order dibuat. Hanya worker yang ditugaskan bisa decrypt.
                </InfoBox>
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Step 3: Opsi &amp; Pembayaran</h4>
                <ul className="text-text-muted text-xs space-y-1 ml-4 list-disc">
                  <li><strong>Express Boost (+20%):</strong> Prioritas pengerjaan 1-2 hari, tim senior</li>
                  <li><strong>Premium Pilot (+30%):</strong> Pilot MG dengan winrate 75%+</li>
                  <li><strong>Kode Promo:</strong> Input kode → klik Terapkan → validasi via API → tampilkan diskon</li>
                  <li><strong>Kode Referral:</strong> Input kode teman → diskon 10% (cek anti-self-referral)</li>
                  <li><strong>Metode Bayar:</strong> Transfer Manual atau iPaymu (jika dikonfigurasi)</li>
                </ul>
              </div>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Step 4: Konfirmasi &amp; Bayar</h4>
                <ul className="text-text-muted text-xs space-y-1 ml-4 list-disc">
                  <li>Review lengkap: paket, info akun, add-ons, breakdown harga</li>
                  <li>Input: nomor WhatsApp (wajib) + email (opsional)</li>
                  <li>Klik &ldquo;Bayar Sekarang&rdquo; → create order + generate Payment URL (iPaymu) atau redirect ke /payment/manual</li>
                  <li>Sukses: tampil Order ID + instruksi lanjut</li>
                </ul>
              </div>
              <InfoBox type="warning">
                <strong>Conversion events fire otomatis:</strong> ViewContent (buka /order) → AddToCart (step 1→2) → InitiateCheckout (step 4 submit) → Purchase (success). Semua ke Meta, Google, TikTok.
              </InfoBox>
            </div>
          ),
        },
        {
          id: "customer-pages",
          icon: Users,
          title: "Customer Dashboard & Pages",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Halaman-halaman customer setelah login. Accessible dari <Code>/dashboard</Code>, <Code>/track</Code>, <Code>/review</Code>.</p>

              <div className="bg-background rounded-lg p-4 border border-purple-500/20">
                <h4 className="text-purple-400 font-semibold text-sm mb-3">Customer Dashboard (/dashboard) &mdash; 4 Tab</h4>
                <div className="space-y-2">
                  <div className="bg-background rounded-lg p-3 border border-white/5">
                    <h5 className="text-text font-medium text-xs mb-1">Header Stats</h5>
                    <p className="text-text-muted text-[11px]">4 kartu: Total Orders, Total Spent (Rp), In Progress, Completed. Data real-time dari API.</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-white/5">
                    <h5 className="text-text font-medium text-xs mb-1">Tab 1: Order Saya</h5>
                    <p className="text-text-muted text-[11px]">List semua order dengan: Order ID, username, rank awal → target, paket, harga, status (warna), progress bar %, tanggal. Link ke detail/track. Jika kosong: &ldquo;Belum ada order&rdquo; + link Order Sekarang.</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-white/5">
                    <h5 className="text-text font-medium text-xs mb-1">Tab 2: Rewards</h5>
                    <p className="text-text-muted text-[11px]">Saldo poin, info tier + progress ke tier berikutnya, diskon tier otomatis. Katalog reward (skin, diamond, dll) yang bisa ditukar poin. Riwayat redeem + riwayat poin (earn/redeem/bonus/adjust).</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-white/5">
                    <h5 className="text-text font-medium text-xs mb-1">Tab 3: Referral</h5>
                    <p className="text-text-muted text-[11px]">Kode referral unik + tombol Copy + tombol Share WhatsApp. Template: &ldquo;Cobain jasa joki ML di ETNYX! Pakai kode [CODE] untuk diskon 10%.&rdquo;</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-white/5">
                    <h5 className="text-text font-medium text-xs mb-1">Tab 4: Profile</h5>
                    <p className="text-text-muted text-[11px]">Display: nama, email, WA, member since. Edit mode: ubah nama, WA, password (harus verifikasi current password dulu). PATCH ke /api/customer/profile.</p>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-blue-400 font-semibold text-sm mb-3">Track Order (/track) &mdash; Real-time Tracking</h4>
                <p className="text-text-muted text-xs mb-2">Halaman publik, bisa diakses tanpa login. Customer input Order ID atau buka dari link WA (auto-fill dari URL ?id=xxx).</p>
                <ul className="text-text-muted text-xs space-y-1 ml-4 list-disc">
                  <li><strong>Status Timeline:</strong> 4 step visual: pending → confirmed → in_progress → completed. Warna berubah sesuai status aktif.</li>
                  <li><strong>Order Summary:</strong> Username, paket, rank awal/target, tanggal order, update terakhir</li>
                  <li><strong>Progress Bar:</strong> Persentase 0-100% + rank saat ini yang sedang di-push</li>
                  <li><strong>Hasil Boosting:</strong> Per sesi: stars gained, matches, wins, winrate, durasi, MVP/Savage/Maniac, screenshot gallery (klik untuk zoom)</li>
                  <li><strong>Action buttons:</strong> Beri Review + Laporkan Worker + Chat WA support</li>
                </ul>
                <InfoBox type="info">
                  <strong>Multi-bahasa:</strong> Track page support ID + EN. Toggle di header. Semua teks otomatis berubah.
                </InfoBox>
              </div>

              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">Password Reset (/reset-password)</h4>
                <StepFlow steps={[
                  { title: "Customer klik 'Lupa Password' di login", desc: "Redirect ke /reset-password", badge: "customer" },
                  { title: "Input email", desc: "Customer isi email yang terdaftar. Sistem selalu tampilkan 'Link dikirim' (mencegah email enumeration).", badge: "customer" },
                  { title: "Generate token", desc: "Backend: buat random token (32 bytes hex), simpan di tabel password_resets, expire 1 jam. Kirim email via Resend.", badge: "auto" },
                  { title: "Klik link di email", desc: "Link: /reset-password?token=xxx. Form: password baru + konfirmasi (min 6 karakter).", badge: "customer" },
                  { title: "Reset password", desc: "Backend: validasi token (belum dipakai, belum expired) → hash bcrypt 12 rounds → update customers → mark token used.", badge: "auto" },
                  { title: "Login dengan password baru", desc: "Redirect ke login.", badge: "customer" },
                ]} />
                <InfoBox type="warning">
                  <strong>Keamanan token:</strong> Token single-use (flag <Code>used</Code>), expire 1 jam, 1 token per customer (upsert on conflict). Tabel: <Code>password_resets</Code> (migration v19).
                </InfoBox>
              </div>
            </div>
          ),
        },
        {
          id: "ml-account-check",
          icon: Gamepad2,
          title: "Cek Akun ML (Verifikasi)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Verifikasi akun Mobile Legends sebelum order. Mencegah salah input User ID/Server ID.</p>
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3">Cara Kerja</h4>
                <StepFlow steps={[
                  { title: "Customer input User ID + Server ID", desc: "Di form order step 2. Validasi: User ID 3-15 digit, Server ID 3-6 digit (numerik).", badge: "customer" },
                  { title: "Klik 'Cek Akun'", desc: "POST ke /api/check-account. Rate limit: 15 request/menit per IP.", badge: "customer" },
                  { title: "Backend lookup nickname", desc: "Prioritas: (1) Custom API admin jika dikonfigurasi, (2) Free API isan.eu.org, (3) Free API whynotbeta.dev. Timeout 8 detik per API.", badge: "auto" },
                  { title: "Tampilkan hasil", desc: "Sukses: nickname ditampilkan (sanitized, max 100 char). Gagal: 'Akun tidak ditemukan'. Timeout: 'Coba lagi nanti'.", badge: "auto" },
                  { title: "Lanjut order", desc: "Nickname terverifikasi → customer bisa lanjut ke step berikutnya.", badge: "customer" },
                ]} />
              </div>
              <Table headers={["Config", "Lokasi", "Keterangan"]} rows={[
                ["Custom ML API URL", "Settings → Integrasi", "Admin bisa set URL custom. Template: {userId} dan {zoneId} diganti otomatis."],
                ["Fallback APIs", "Hardcoded", "2 free API publik sebagai cadangan. Otomatis dipakai jika custom tidak di-set."],
                ["Rate Limit", "Middleware", "15 req/menit per IP. Return 429 jika exceeded."],
              ]} />
              <InfoBox type="info">
                <strong>Anti-abuse:</strong> Rate limit 15 req/menit. Response di-sanitize (strip HTML/script). Nickname max 100 karakter. IP tracking via x-forwarded-for.
              </InfoBox>
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
                  <li><strong className="text-text">Pembayaran</strong> &rarr; auto-confirm via iPaymu webhook</li>
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
                { q: "iPaymu payment tidak auto-confirm?", a: "Cek API Key & VA di Settings > Integrations. Pastikan Notification URL di iPaymu Dashboard mengarah ke /api/payment/notification. Cek environment (Sandbox vs Production). Jika iPaymu down saat order dibuat, sistem otomatis fallback ke manual transfer + kirim WA ke customer." },
                { q: "Worker tidak bisa lihat order?", a: "Pastikan order sudah di-assign ke worker tersebut. Worker hanya bisa lihat order yang ditugaskan via lead/admin." },
                { q: "Tidak bisa assign worker?", a: "Worker hanya bisa di-assign setelah pembayaran dikonfirmasi (payment_status = paid). Pastikan order sudah dibayar dan dikonfirmasi terlebih dahulu." },
                { q: "Tombol Konfirmasi Bayar tidak muncul?", a: "Tombol Konfirmasi Bayar hanya muncul untuk order dengan metode manual transfer. Order iPaymu dikonfirmasi otomatis via webhook — tidak perlu konfirmasi manual." },
                { q: "Commission tidak muncul setelah order selesai?", a: "Komisi auto-generate saat status diubah ke completed DAN ada assigned_worker_id. Cek di Payroll > Commissions." },
                { q: "Customer tidak bisa bayar via iPaymu?", a: "Cek iPaymu API Key & Client Key sudah benar dan aktif. Toggle Sandbox/Production sesuai environment." },
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
          title: "API Routes (65+)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">65+ API routes. Auth via JWT cookie (HTTPOnly). Rate limited via middleware.</p>
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
                  ["/api/customer/order", "POST", "Create order + iPaymu payment URL"],
                  ["/api/customer/orders", "GET", "My order history"],
                  ["/api/customer/verify", "GET", "Email verification link"],
                  ["/api/customer/resend-verify", "POST", "Resend verification email"],
                  ["/api/customer/rewards", "GET/POST", "Points balance + redeem"],
                  ["/api/customer/rewards/catalog", "GET/POST", "Browse + redeem catalog"],
                  ["/api/customer/profile", "GET/PATCH", "Get/update profile (name, whatsapp, password)"],
                  ["/api/customer/password-reset", "POST", "Request + reset password via email token"],
                ]} />
              </div>
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-2">{"Public API & Webhooks"}</h4>
                <Table headers={["Endpoint", "Methods", "Deskripsi"]} rows={[
                  ["/api/payment", "POST", "Create iPaymu transaction"],
                  ["/api/payment/manual", "POST", "Upload bukti transfer manual"],
                  ["/api/payment/notification", "POST", "iPaymu webhook (signature verify)"],
                  ["/api/payment/test-connection", "POST", "Test iPaymu keys"],
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
                  ["/api/check-account", "POST", "Cek akun ML (User ID + Server ID → Nickname)"],
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
                  [<strong key="4" className="text-text">password_resets</strong>, "Customer password reset tokens (v19). Token single-use, expire 1 jam, unique per customer."],
                  [<strong key="5" className="text-text">payment_proofs</strong>, "Manual transfer proof uploads"],
                ]} />
              </div>
              <InfoBox type="info">
                <strong>Schema Files:</strong> v8 (storage), v9 (order logs), v10 (rewards), v11 (staff), v12 (reviews), v13 (payroll), v14 (payment methods), v15 (UTM attribution &amp; ad spend), v16-v18 (minor fixes), v19 (password_resets: WAJIB run di Supabase SQL Editor). Run sequentially via Supabase SQL Editor.
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
                  ["Bayar dikonfirmasi (confirmed)", "Worker: ORDER DIKONFIRMASI!", "Pembayaran Dikonfirmasi + track link + reminder keamanan", "Pembayaran Dikonfirmasi"],
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
              <p className="text-text-muted text-sm">Dual payment system: Transfer Manual + iPaymu Auto. Toggle dari Settings &rarr; Integrations.</p>

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
                <h4 className="text-blue-400 font-semibold text-sm mb-3">iPaymu Auto</h4>
                <StepFlow steps={[
                  { title: "Frontend POST ke /api/customer/order", desc: "Kirim data order + payment_method: ipaymu" },
                  { title: "Backend generate Payment URL", desc: "Via snap.createTransaction() — return snap_url" },
                  { title: "Customer bayar via popup/redirect", desc: "VA, QRIS, GoPay, ShopeePay, Kartu Kredit" },
                  { title: "Webhook auto-confirm", desc: "iPaymu POST ke /api/payment/notification — SHA-256 HMAC signature verification", page: "/api/payment/notification" },
                  { title: "Status update + notifikasi", desc: "Order confirmed + paid, WA 'Pembayaran Dikonfirmasi', Telegram Worker Group" },
                ]} />
                <InfoBox type="info">
                  iPaymu muncul otomatis jika Server Key diisi di Settings &rarr; Integrations. Bisa toggle Sandbox/Production.
                </InfoBox>
              </div>

              <Table headers={["Setting", "Lokasi"]} rows={[
                ["Server Key / Client Key", "Dashboard > Settings > Integrations"],
                ["Rekening Transfer Manual", "Dashboard > Settings > Rekening"],
                ["Environment", "Toggle Sandbox / Production"],
                ["Payment Channels", "Enable/disable VA, GoPay, QRIS, dll"],
                ["Notification URL", "Set di iPaymu Dashboard"],
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
              <div className="bg-background rounded-lg p-4 border border-white/5">
                <h4 className="text-text font-medium text-sm mb-3"><CalendarDays className="w-4 h-4 inline mr-1.5" />Season Pricing (Auto-Scheduler)</h4>
                <p className="text-text-muted text-xs mb-3">Harga otomatis berubah sesuai fase season ML. Dikelola di Pricing tab → Season Pricing card.</p>
                <Table headers={["Fase", "Durasi", "Multiplier", "Keterangan"]} rows={[
                  ["Early Season", "Hari 1–21 (~3 minggu)", "×1.25 (+25%)", "Demand tinggi, banyak yg push rank di awal season"],
                  ["Mid Season", "Hari 22–60 (~5-6 minggu)", "×1.00 (normal)", "Season stabil, harga normal"],
                  ["End Season", "Hari 61–90 (~4 minggu)", "×0.85 (-15%)", "Push rank akhir, diskon menarik customer"],
                ]} />
                <InfoBox type="info">
                  <strong>Cara setup:</strong> Dashboard → Pricing → aktifkan toggle Season Pricing → isi nama season (cth: &quot;Season 35&quot;) → set tanggal mulai tiap fase → Simpan. Multiplier bisa disesuaikan (0.5x–2.0x). Harga di homepage &amp; order page otomatis berubah.
                </InfoBox>
                <InfoBox type="warning">
                  <strong>1 season ML ≈ 90 hari (3 bulan).</strong> Ada 4 season per tahun. Set tanggal sesuai jadwal resmi Moonton. Jika season pricing dinonaktifkan, semua harga kembali ke harga dasar.
                </InfoBox>
              </div>
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
                ["Signature", "SHA-256 HMAC", "iPaymu payment webhook verification"],
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
                <h4 className="text-text font-medium text-sm mb-3"><ShieldCheck className="w-4 h-4 inline mr-1.5" />Middleware Security Details</h4>
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
                <strong>Tip:</strong> iPaymu, Telegram, Fonnte, Resend keys bisa dikelola dari Dashboard Integrations tanpa redeploy.
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
\u2502   \u2514\u2500\u2500 api/                    # 65+ API routes
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

    // ===================== SOP OPERASIONAL =====================
    {
      id: "sop",
      label: "SOP Operasional",
      catIcon: ClipboardList,
      color: "text-teal-400",
      sections: [
        {
          id: "sop-customer",
          icon: Users,
          title: "Alur Customer (Order → Selesai)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Perjalanan customer dari awal order sampai selesai dan review.</p>
              <StepFlow steps={[
                { title: "Buka Website & Pilih Layanan", desc: "Customer buka etnyx.com → scroll ke section layanan atau langsung klik 'Order Sekarang'. Pilih mode: Paket, Per-Star, atau Gendong.", badge: "customer", page: "/" },
                { title: "Isi Form Order", desc: "Pilih rank awal → rank tujuan. Isi credentials akun ML (User ID, Server ID, Password). Cek akun via 'Cek Akun'. Apply promo/referral code.", badge: "customer", page: "/order" },
                { title: "Pilih & Bayar", desc: "Transfer Manual (11 rekening) atau iPaymu Auto. Manual → upload bukti. iPaymu → popup otomatis.", badge: "customer", page: "/payment/manual" },
                { title: "Upload Bukti (Manual)", desc: "Upload foto bukti transfer + nama pengirim. Tunggu admin approve.", badge: "customer" },
                { title: "Pembayaran Dikonfirmasi", desc: "Notif WA 'Pembayaran Dikonfirmasi ✅'. Order masuk antrian. Bisa track di /track.", badge: "auto" },
                { title: "Order Dikerjakan", desc: "Notif WA 'Sedang Dikerjakan 🎮'. Worker push rank. Pantau progress real-time di tracking.", badge: "auto", page: "/track?id=xxx" },
                { title: "Lihat Progress", desc: "Dashboard → detail order: progress %, rank, submission worker (MVP, Savage, screenshot), timeline.", badge: "customer", page: "/dashboard/order?id=xxx" },
                { title: "Order Selesai", desc: "Notif WA 'Order Selesai 🏆' + link review. Points reward otomatis ditambahkan.", badge: "auto" },
                { title: "Review & Reward", desc: "Submit review (rating 1-5). Cek points → redeem reward. Share referral code ke teman.", badge: "customer", page: "/review?id=xxx" },
              ]} />
              <InfoBox type="info">Customer bisa download invoice PDF dan atur preferensi notifikasi dari dashboard.</InfoBox>
            </div>
          ),
        },
        {
          id: "sop-admin",
          icon: Crown,
          title: "Tugas Admin (Harian & Bulanan)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Checklist dan tanggung jawab Admin.</p>
              <div className="bg-background rounded-lg p-4 border border-red-500/20">
                <h4 className="text-red-400 font-semibold text-sm mb-3 flex items-center gap-2"><Flame className="w-4 h-4" /> Rutin Harian</h4>
                <div className="space-y-2">
                  {[
                    { task: "Cek order baru", desc: "Tab Orders → filter Pending. Approve/reject bukti transfer.", time: "Setiap notif Telegram" },
                    { task: "Assign order", desc: "Order confirmed → assign ke Lead/Worker available.", time: "Setelah payment" },
                    { task: "Monitor progress", desc: "Tab Overview → active orders, pending, revenue.", time: "2-3x sehari" },
                    { task: "Handle chat", desc: "Tab Orders → chat icon. Balas customer.", time: "Saat ada notif" },
                    { task: "Respond Telegram", desc: "Konfirmasi/Tolak via inline keyboard bot.", time: "Real-time" },
                    { task: "Cek SLA", desc: "Cron harian auto-check. Follow up order overdue.", time: "Auto + manual" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <CheckSquare2 className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-text font-medium">{item.task}</span>
                        <span className="text-text-muted"> — {item.desc}</span>
                        <span className="text-accent/50 ml-1">({item.time})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-background rounded-lg p-4 border border-red-500/10">
                <h4 className="text-red-300 font-semibold text-sm mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Mingguan / Bulanan</h4>
                <div className="space-y-2">
                  {[
                    { task: "Analytics", desc: "Revenue trend, top packages, customer growth.", freq: "Mingguan" },
                    { task: "Export CSV", desc: "Export orders dengan filter status/tanggal.", freq: "Mingguan" },
                    { task: "Payroll", desc: "Generate komisi, review gaji, batch payout.", freq: "Bulanan" },
                    { task: "Pricing", desc: "Review harga. Aktifkan Season Pricing.", freq: "Per season ML" },
                    { task: "Promo", desc: "Buat/edit promo code, set discount, expiry.", freq: "Per campaign" },
                    { task: "Reviews", desc: "Approve/reject testimonials. Cek worker reports.", freq: "Mingguan" },
                    { task: "Staff", desc: "Tambah/hapus worker. Reset password. Set hierarchy.", freq: "Bulanan" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <CalendarDays className="w-3.5 h-3.5 text-red-300 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-text font-medium">{item.task}</span>
                        <span className="text-text-muted"> — {item.desc}</span>
                        <span className="text-accent/50 ml-1">[{item.freq}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "sop-lead",
          icon: UserCheck,
          title: "Tugas Lead (Koordinator Tim)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Lead mengelola worker dalam tim dan memastikan order selesai tepat waktu.</p>
              <StepFlow steps={[
                { title: "Cek Order Confirmed", desc: "Lead Dashboard → order status 'confirmed' (sudah bayar). Perhatikan rank dan package.", badge: "lead", page: "/admin/lead" },
                { title: "Pilih Worker", desc: "Worker list (slider) → cek workload tiap worker. Pilih yang load rendah.", badge: "lead" },
                { title: "Assign Order", desc: "Klik order → pilih worker → Assign. Worker dapat notif Telegram. Bisa Bulk Assign.", badge: "lead" },
                { title: "Monitor Progress", desc: "Pantau status order per worker. Follow up yang lambat via Telegram/WA.", badge: "lead" },
                { title: "Review Submissions", desc: "Cek screenshot, MVP, stats worker. Pastikan kualitas kerja.", badge: "lead" },
                { title: "Handle Reassignment", desc: "Worker berhalangan → reassign ke worker lain dalam tim.", badge: "lead" },
                { title: "Eskalasi", desc: "Masalah besar → lapor Admin (complain, worker non-responsif, overdue).", badge: "lead" },
              ]} />
              <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-blue-400 font-semibold text-sm mb-2">Tidak Bisa Dilakukan Lead:</h4>
                <ul className="text-text-muted text-xs space-y-1 ml-4">
                  {["Lihat worker tim lain", "Edit pricing", "Akses settings", "Proses payroll", "Export semua data", "Kelola staff"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2"><Ban className="w-3 h-3 text-red-400 shrink-0" /> {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ),
        },
        {
          id: "sop-worker",
          icon: Wrench,
          title: "Tugas Worker (Booster)",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Alur kerja worker dari dapat order sampai selesai.</p>
              <StepFlow steps={[
                { title: "Dapat Notif Order", desc: "Telegram 'Order baru di-assign'. Buka Worker Dashboard.", badge: "worker", page: "/admin/worker" },
                { title: "Lihat Detail", desc: "Klik order → rank, package, credentials ML (decrypt). Catat data.", badge: "worker" },
                { title: "Mulai Kerja", desc: "Klik Mulai → in_progress. Customer dapat WA 'Sedang dikerjakan'. SLA mulai.", badge: "worker" },
                { title: "Push Rank", desc: "Login akun ML, push rank. JANGAN share credentials.", badge: "worker" },
                { title: "Update Progress", desc: "Update % dan current rank. Customer lihat real-time di tracking.", badge: "worker" },
                { title: "Submit Stats", desc: "Submit: stars, wins, MVP, Savage, Maniac, durasi. Upload screenshot.", badge: "worker" },
                { title: "Selesaikan", desc: "Target tercapai → Selesaikan. Auto 100%. Customer notif 'Order Selesai 🏆'.", badge: "worker" },
                { title: "Komisi", desc: "60% otomatis dicatat. Payout via Admin setiap bulan.", badge: "auto" },
              ]} />
              <div className="bg-background rounded-lg p-4 border border-yellow-500/20">
                <h4 className="text-yellow-400 font-semibold text-sm mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Aturan Worker</h4>
                <ul className="text-text-muted text-xs space-y-1.5 ml-4">
                  {[
                    "Update progress minimal 2x sehari saat order aktif",
                    "Screenshot WAJIB upload setiap 5-10 match",
                    "Submission bisa edit/delete dalam 30 menit",
                    "DILARANG share credentials customer",
                    "Berhalangan → segera lapor Lead",
                    "SLA: Express 24jam, Premium 48jam, Standard 72jam",
                    "Rating rendah = turun di leaderboard",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-400 shrink-0">{"•"}</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ),
        },
        {
          id: "sop-status-flow",
          icon: Layers,
          title: "Status Flow & Eskalasi",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Status order dan penanggung jawab tiap tahap.</p>
              <div className="bg-background rounded-lg p-4 border border-white/10">
                <h4 className="text-text font-semibold text-sm mb-3">Status Order Flow</h4>
                <div className="space-y-0">
                  {[
                    { label: "Pending", color: "text-gray-400", border: "border-gray-500/20", who: "customer", action: "Menunggu pembayaran", next: "confirmed / cancelled" },
                    { label: "Confirmed", color: "text-blue-400", border: "border-blue-500/20", who: "admin", action: "Payment verified → assign ke worker", next: "in_progress" },
                    { label: "In Progress", color: "text-yellow-400", border: "border-yellow-500/20", who: "worker", action: "Dikerjakan, update progress", next: "completed" },
                    { label: "Completed", color: "text-green-400", border: "border-green-500/20", who: "worker", action: "Target tercapai, komisi dicatat", next: "— (final)" },
                    { label: "Cancelled", color: "text-red-400", border: "border-red-500/20", who: "admin", action: "Dibatalkan (refund jika perlu)", next: "— (final)" },
                  ].map((item, i, arr) => (
                    <div key={i}>
                      <div className={`rounded-lg p-3 border ${item.border} bg-background`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${item.color}`}>{item.label}</span>
                            <RoleBadge role={item.who} />
                          </div>
                          <span className="text-text-muted text-[10px]">{"\u2192"} {item.next}</span>
                        </div>
                        <p className="text-text-muted text-xs mt-1">{item.action}</p>
                      </div>
                      {i < arr.length - 1 && <div className="flex justify-center py-1"><ChevronDown className="w-4 h-4 text-white/20" /></div>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-background rounded-lg p-4 border border-red-500/10">
                <h4 className="text-red-300 font-semibold text-sm mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Eskalasi</h4>
                <Table headers={["Situasi", "Dari", "Ke", "Aksi"]} rows={[
                  ["Belum bayar > 24 jam", <RoleBadge key="a1" role="auto" />, <RoleBadge key="a2" role="admin" />, "WA follow-up payment"],
                  ["Worker belum mulai > 6 jam", <RoleBadge key="b1" role="lead" />, <RoleBadge key="b2" role="worker" />, "Hubungi, reassign jika perlu"],
                  ["Order overdue SLA", <RoleBadge key="c1" role="auto" />, <RoleBadge key="c2" role="admin" />, "Telegram alert + follow up"],
                  ["Customer complain", <RoleBadge key="d1" role="customer" />, <RoleBadge key="d2" role="admin" />, "Cek chat, hub worker"],
                  ["Worker non-responsif", <RoleBadge key="e1" role="lead" />, <RoleBadge key="e2" role="admin" />, "Reassign + warning"],
                  ["Akun bermasalah", <RoleBadge key="f1" role="worker" />, <RoleBadge key="f2" role="lead" />, "Stop, lapor, tunggu instruksi"],
                ]} />
              </div>
            </div>
          ),
        },
        {
          id: "sop-onboarding",
          icon: Lightbulb,
          title: "Onboarding Tim Baru",
          content: (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">Panduan staff baru bergabung ke tim ETNYX.</p>
              <div className="bg-background rounded-lg p-4 border border-green-500/20">
                <h4 className="text-green-400 font-semibold text-sm mb-3">Worker Baru</h4>
                <StepFlow steps={[
                  { title: "Admin buat akun", desc: "Tab Staff → tambah worker. Set nama, email, password, role, lead_id.", badge: "admin" },
                  { title: "Login", desc: "/admin → email + password. Auto ke Worker Dashboard.", badge: "worker" },
                  { title: "Baca SOP", desc: "/admin/docs → 'Tugas Worker' + 'Aturan Worker'.", badge: "worker" },
                  { title: "Join Telegram", desc: "Minta link grup Worker dari Lead.", badge: "worker" },
                  { title: "Test order", desc: "Lead assign test order. Coba full flow.", badge: "worker" },
                ]} />
              </div>
              <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-blue-400 font-semibold text-sm mb-3">Lead Baru</h4>
                <StepFlow steps={[
                  { title: "Admin buat akun Lead", desc: "Tab Staff → role: lead. Worker di-set lead_id = ID lead.", badge: "admin" },
                  { title: "Login", desc: "/admin → auto ke Lead Dashboard.", badge: "lead" },
                  { title: "Baca SOP + Join Telegram", desc: "Docs → 'Tugas Lead'. Join grup Admin + Workers.", badge: "lead" },
                  { title: "Latihan", desc: "Assign order, monitor, lihat submissions.", badge: "lead" },
                ]} />
              </div>
              <InfoBox type="info">Semua staff bisa akses <Code>/admin/docs</Code>. Share link ini ke tim baru: <Code>etnyx.com/admin/docs</Code></InfoBox>
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
                  <h4 className="text-green-400 font-semibold text-sm">Phase 1 &mdash; Core Platform (v1.0 - v2.4)</h4>
                </div>
                <ul className="text-text-muted text-xs space-y-1.5 ml-4">
                  {[
                    "Full ordering system: 3 mode (Paket, Per Star, Gendong) + promo code + referral",
                    "Dual payment: Transfer Manual (11 rekening) + iPaymu Auto (VA, QRIS, e-wallet)",
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
                    "Cek Akun ML: verifikasi User ID + Server ID via external API sebelum order",
                    "Customer auth: login, register, password reset via email, profile update",
                    "Security audit v2.4: 19 fixes (mass assignment, IDOR, idempotent points, input validation, etc.)",
                    "Payment: webhook idempotency, amount verification, duplicate proof rejection",
                    "Lead submissions view + worker showAllCompleted + admin assign order_logs",
                    "Season Pricing auto-scheduler: 3 fase (Early/Mid/End) dengan multiplier otomatis",
                    "Customer password reset via email token (tabel password_resets, migration v19)",
                    "Analytics dashboard (revenue, packages, customers, ranks) + Leaderboard",
                    "Invoice PDF + customer download dari dashboard",
                    "Bulk order export CSV (filter status/tanggal)",
                    "SLA tracking + auto-reminder cron harian + Telegram alert",
                    "SEO JSON-LD structured data (LocalBusiness + AggregateRating)",
                    "Customer order detail page + timeline + screenshot gallery",
                    "Notification preferences (email/WA/push toggle per customer)",
                    "Customer activity log (login, orders, profile changes)",
                    "Enhanced health check endpoint (Supabase, iPaymu, Telegram, Email)",
                    "Worker slider horizontal di Lead dashboard",
                    "Automated testing: 38 unit tests (Vitest) + Playwright E2E setup",
                    "404 custom pages, skeleton loading, theme consistency",
                    "Comprehensive security audit + fixes (ads auth, stats query, URL bug)",
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

              <div className="bg-background rounded-lg p-4 border border-accent/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">v2.5</span>
                  <h4 className="text-accent font-semibold text-sm">8 April 2026 (Season Pricing &amp; Docs Overhaul)</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Season Pricing Auto-Scheduler</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">3 fase</strong> &mdash; Early Season (×1.25), Mid Season (×1.00), End Season (×0.85)</li>
                      <li>Toggle on/off + nama season + tanggal mulai tiap fase + multiplier adjustable (0.5x–2.0x)</li>
                      <li>Auto-apply di homepage (PricingSection) + order page (price calculation)</li>
                      <li>Badge season label di homepage saat aktif</li>
                      <li>Line season pricing di breakdown harga order</li>
                      <li>Rekomendasi ML: 1 season ≈ 90 hari (Early 3 minggu, Mid 5-6 minggu, End 4 minggu)</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Dashboard UX Overhaul</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">Overview</strong> &mdash; Compact stat cards, enhanced order indicators, responsive mobile layout</li>
                      <li><strong className="text-text">Orders</strong> &mdash; Improved credential toggle UX, inline worker info, responsive action buttons</li>
                      <li><strong className="text-text">Customer Profile</strong> &mdash; Inline edit mode (name, WA, password) di Customer tab</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Settings Tab Fixes</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">Hero isVisible toggle</strong> &mdash; Field sudah ada di DB, sekarang muncul di UI</li>
                      <li><strong className="text-text">FAQ Reorder</strong> &mdash; GripVertical diganti ChevronUp/ChevronDown move buttons</li>
                      <li><strong className="text-text">Bank Account</strong> &mdash; prompt() diganti inline form untuk tambah rekening</li>
                      <li><strong className="text-text">ALLOWED_KEYS cleanup</strong> &mdash; Hapus key Telegram redundan</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Public Page Fixes</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">FAQ Section</strong> &mdash; Fix empty array bypass ([] || defaults evaluates to [] → now checks .length)</li>
                      <li><strong className="text-text">Promo Banner</strong> &mdash; Countdown timer persist via localStorage (no reset on reload)</li>
                      <li><strong className="text-text">Testimonials</strong> &mdash; Loading state + opacity transition (prevent flicker)</li>
                      <li><strong className="text-text">Hero headline</strong> &mdash; Added placeholder + helper text about comma-split format</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Docs Major Overhaul v2.5</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">Settings Tab Guide</strong> &mdash; Penjelasan lengkap 10 sub-tab: field, cara kerja, key database</li>
                      <li><strong className="text-text">Homepage CMS</strong> &mdash; Cara kerja CMS, sumber data tiap section, flow render</li>
                      <li><strong className="text-text">Cara Hitung Harga</strong> &mdash; Formula lengkap: base → season → express/premium → promo → member → total</li>
                      <li><strong className="text-text">Order Form 4 Step</strong> &mdash; Detail tiap step: field, validasi, add-ons, payment methods</li>
                      <li><strong className="text-text">Customer Pages</strong> &mdash; Dashboard 4 tab, Track page, Password Reset flow</li>
                      <li><strong className="text-text">Cek Akun ML</strong> &mdash; Cara kerja API lookup, fallback, rate limit, sanitization</li>
                      <li><strong className="text-text">Season Pricing</strong> &mdash; Tabel fase + multiplier + cara setup + rekomendasi timing</li>
                      <li><strong className="text-text">Migration v19</strong> &mdash; password_resets table documented</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg p-4 border border-accent/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">v2.4</span>
                  <h4 className="text-accent font-semibold text-sm">7 April 2026 (Security &amp; Features)</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Cek Akun ML</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">Order page</strong> &mdash; User ID + Server ID terpisah + tombol &quot;Cek Akun&quot; untuk verifikasi nickname sebelum order</li>
                      <li><Code>POST /api/check-account</Code> &mdash; Lookup ML account via free external APIs + custom URL fallback dari admin settings</li>
                      <li>Rate limited: 15 req/menit per IP</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Customer Auth &amp; Profile</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">Password Reset</strong> &mdash; Customer bisa reset password via email token (1 jam expiry)</li>
                      <li><strong className="text-text">Profile Update</strong> &mdash; PATCH name, whatsapp, password (verifikasi currentPassword)</li>
                      <li>&quot;Lupa password?&quot; link di halaman login</li>
                      <li>Schema migration v19: <Code>password_resets</Code> table</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Security Audit (19 Fixes)</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">Admin Orders POST</strong> &mdash; Whitelist allowed insert fields (cegah mass assignment)</li>
                      <li><strong className="text-text">Invoice API</strong> &mdash; Ganti phone-based auth ke customer JWT (fix IDOR)</li>
                      <li><strong className="text-text">Payment webhook</strong> &mdash; Idempotency check + amount verification</li>
                      <li><strong className="text-text">Reward points</strong> &mdash; Idempotent check sebelum award (cegah double points)</li>
                      <li><strong className="text-text">Promo codes</strong> &mdash; Validasi input + post-increment race condition check</li>
                      <li><strong className="text-text">Worker submissions</strong> &mdash; Validasi numeric fields 0-999</li>
                      <li><strong className="text-text">Upload bucket</strong> &mdash; Whitelist allowed storage buckets</li>
                      <li><strong className="text-text">Order ID</strong> &mdash; Random UUID suffix (cegah enumeration)</li>
                      <li><strong className="text-text">JWT Secret</strong> &mdash; Wajib di profile route (cegah empty key bypass)</li>
                      <li><strong className="text-text">Telegram hardcoded ID</strong> &mdash; Pakai DB settings (hapus hardcoded)</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Dashboard &amp; UX</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">WA notification feedback</strong> &mdash; Alert muncul jika notifikasi WA gagal terkirim saat update status</li>
                      <li><strong className="text-text">Lead submissions view</strong> &mdash; Panel hasil kerja worker + statistik match/win/star/screenshot</li>
                      <li><strong className="text-text">Worker showAllCompleted</strong> &mdash; Toggle lihat semua order selesai</li>
                      <li><strong className="text-text">Admin assign order_logs</strong> &mdash; Log assignment ke timeline</li>
                      <li><strong className="text-text">Track page</strong> &mdash; Loading spinner + "assigned" di timeline</li>
                      <li><strong className="text-text">Email konfirmasi bayar</strong> &mdash; Dikirim saat payment confirmed</li>
                      <li><strong className="text-text">Pagination</strong> &mdash; Admin customers + testimonials API</li>
                      <li><strong className="text-text">Status transition validation</strong> &mdash; Cegah lompatan status invalid (admin + staff)</li>
                      <li><strong className="text-text">Self-referral fix</strong> &mdash; Compare by customer ID (bukan email vs referral_code)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg p-4 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-medium">v2.3</span>
                  <h4 className="text-yellow-400 font-semibold text-sm">7 April 2026 (Update)</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Docs Major Update</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li><strong className="text-text">Order Action Buttons</strong> &mdash; Referensi lengkap tombol aksi per status order (pending → cancelled) + aksi &amp; WA yang dikirim</li>
                      <li><strong className="text-text">SOP Harian Admin</strong> &mdash; Checklist pagi/siang/malam/mingguan untuk owner</li>
                      <li><strong className="text-text">{"Do's & Don'ts Admin"}</strong> &mdash; 10 do&apos;s, 8 don&apos;ts + checklist verifikasi bukti transfer</li>
                      <li><strong className="text-text">Team Management &amp; Hierarchy</strong> &mdash; Panduan lengkap hierarki Admin → Lead → Worker, cara buat tim, permission matrix</li>
                      <li><strong className="text-text">SOP Harian Lead</strong> &mdash; Checklist pagi/siang/malam untuk koordinator</li>
                      <li><strong className="text-text">{"Do's & Don'ts Lead"}</strong> &mdash; Aturan yang harus dan tidak boleh dilakukan Lead</li>
                      <li><strong className="text-text">SOP Harian Worker</strong> &mdash; Step-by-step sebelum, selama, dan setelah pengerjaan</li>
                      <li><strong className="text-text">Aturan &amp; Sanksi Worker</strong> &mdash; 8 aturan wajib + 4 tingkatan sanksi bertingkat</li>
                      <li><strong className="text-text">Komisi &amp; Penghasilan Worker</strong> &mdash; Cara hitung komisi, contoh perhitungan, payment methods</li>
                      <li><strong className="text-text">FAQ &amp; Troubleshooting</strong> &mdash; 12 pertanyaan umum + solusi (WA, Telegram, iPaymu, dll)</li>
                      <li><strong className="text-text">Development Roadmap</strong> &mdash; 3 phase: Done, Planning, Future</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Bug Fix: Konfirmasi Bayar WA</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li>Fix: Admin klik &quot;Konfirmasi Bayar&quot; sekarang kirim WA <strong className="text-text">&quot;Pembayaran Dikonfirmasi&quot;</strong> (sebelumnya salah kirim &quot;Sedang Dikerjakan&quot;)</li>
                      <li>Fix: Status confirmed dan in_progress sekarang kirim WA template yang berbeda</li>
                      <li>Fix: Auto-set <Code>payment_status=paid</Code> + <Code>paid_at</Code> saat admin konfirmasi pembayaran</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-text text-xs font-medium mb-1">Fix: Notifikasi Action Buttons</h5>
                    <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                      <li>Fix: Worker klik &quot;Selesai&quot; sekarang kirim WA <strong className="text-text">&quot;Order Selesai&quot;</strong> ke customer + link review (sebelumnya tidak ada WA)</li>
                      <li>Fix: Worker &quot;Selesai&quot; sekarang auto-generate <strong className="text-text">komisi 60%</strong> (sebelumnya hanya admin yang generate)</li>
                      <li>Fix: &quot;Mulai Kerjakan&quot; sekarang kirim WA <strong className="text-text">&quot;Sedang Dikerjakan&quot;</strong> ke customer + Telegram ke admin group</li>
                      <li>Fix: &quot;Cancel&quot; sekarang kirim WA <strong className="text-text">&quot;Order Dibatalkan&quot;</strong> ke customer (sebelumnya silent)</li>
                      <li>Ditambahkan tabel <strong className="text-text">Akses Tombol per Role</strong> (Admin/Lead/Worker) di docs</li>
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
                      <li><strong className="text-text">WA baru: Pembayaran Dikonfirmasi</strong> &mdash; Dikirim setelah admin approve bukti / iPaymu auto-confirm. Berisi detail order, link tracking, reminder keamanan</li>
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
                      <li>Fix: iPaymu webhook sekarang set <Code>confirmed_at</Code> + kirim notifikasi yang benar</li>
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
                  <li>Full platform: order, payment (iPaymu), staff management (RBAC), reward system</li>
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
                  { title: "Atau iPaymu Auto", desc: "Bayar via VA/QRIS/GoPay/ShopeePay langsung dari popup" },
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
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">v2.5</span>
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
            ETNYX Documentation v2.5 &mdash; {allSections.length} sections across {categories.length} categories
          </p>
        </footer>
      </main>
    </div>
  );
}
