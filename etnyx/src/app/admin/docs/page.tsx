"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Book, ChevronDown, ChevronRight, Users, ShoppingCart,
  CreditCard, Bell, Shield, Settings, Database, Globe, Smartphone,
  Server, Lock, Zap, FileText, GitBranch, Layers,
  UserCheck, Crown, Wrench, Eye, Upload, BarChart3, MessageCircle,
} from "lucide-react";

// --- Section data ---
interface DocSection {
  id: string;
  icon: typeof Book;
  title: string;
  content: React.ReactNode;
}

const RoleBadge = ({ role }: { role: string }) => {
  const colors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400 border-red-500/20",
    lead: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    worker: "bg-green-500/10 text-green-400 border-green-500/20",
    customer: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    public: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return <span className={`px-2 py-0.5 rounded border text-xs font-medium ${colors[role] || colors.public}`}>{role}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400",
    confirmed: "bg-blue-500/10 text-blue-400",
    in_progress: "bg-accent/10 text-accent",
    completed: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-gray-500/10 text-gray-400"}`}>{status.replace("_", " ")}</span>;
};

const Table = ({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead><tr className="border-b border-white/10">{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left text-text-muted font-medium text-xs">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-white/5">{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="px-3 py-2 text-text text-xs">{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const Code = ({ children }: { children: string }) => (
  <code className="bg-background px-1.5 py-0.5 rounded text-accent text-xs font-mono">{children}</code>
);

const InfoBox = ({ type, children }: { type: "info" | "warning" | "success"; children: React.ReactNode }) => {
  const styles = { info: "bg-blue-500/10 border-blue-500/20 text-blue-300", warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300", success: "bg-green-500/10 border-green-500/20 text-green-300" };
  return <div className={`rounded-lg border p-3 text-xs ${styles[type]}`}>{children}</div>;
};

// --- All documentation sections ---
function buildSections(): DocSection[] {
  return [
    // 1. PROJECT OVERVIEW
    {
      id: "overview",
      icon: Globe,
      title: "1. Project Overview",
      content: (
        <div className="space-y-4">
          <p className="text-text text-sm leading-relaxed">
            <strong>ETNYX</strong> adalah platform jasa joki (boosting) rank Mobile Legends: Bang Bang.
            Customer memesan jasa push rank melalui website, membayar via Midtrans, dan worker (booster) mengerjakan order.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-background rounded-lg p-3 border border-white/5">
              <h4 className="text-text font-medium text-sm mb-2">🛠 Tech Stack</h4>
              <ul className="text-text-muted text-xs space-y-1">
                <li>• <strong className="text-text">Next.js 16</strong> + React 19 (Turbopack)</li>
                <li>• <strong className="text-text">Supabase</strong> — Database + Auth + Storage</li>
                <li>• <strong className="text-text">Midtrans Snap</strong> — Payment Gateway</li>
                <li>• <strong className="text-text">Vercel</strong> — Hosting & Deployment</li>
                <li>• <strong className="text-text">Tailwind CSS 4</strong> — Styling</li>
                <li>• <strong className="text-text">TypeScript</strong> — Type Safety</li>
              </ul>
            </div>
            <div className="bg-background rounded-lg p-3 border border-white/5">
              <h4 className="text-text font-medium text-sm mb-2">📡 Integrasi</h4>
              <ul className="text-text-muted text-xs space-y-1">
                <li>• <strong className="text-text">Telegram Bot</strong> — Notifikasi Admin & Worker Group</li>
                <li>• <strong className="text-text">Fonnte</strong> — WhatsApp Notifikasi Customer</li>
                <li>• <strong className="text-text">Resend</strong> — Email Transaksional</li>
                <li>• <strong className="text-text">Web Push</strong> — Browser Notifications</li>
                <li>• <strong className="text-text">Google Analytics</strong> — Tracking</li>
                <li>• <strong className="text-text">Meta/TikTok Pixel</strong> — Ads Tracking</li>
              </ul>
            </div>
          </div>

          <div className="bg-background rounded-lg p-3 border border-white/5">
            <h4 className="text-text font-medium text-sm mb-2">🌐 URLs</h4>
            <Table headers={["Halaman", "URL", "Akses"]} rows={[
              ["Website (Homepage)", "etnyx.vercel.app", <RoleBadge key="p" role="public" />],
              ["Order Form", "/order", <RoleBadge key="p2" role="public" />],
              ["Tracking Order", "/track", <RoleBadge key="p3" role="public" />],
              ["Customer Login/Dashboard", "/login → /dashboard", <RoleBadge key="c" role="customer" />],
              ["Staff Login", "/admin", <><RoleBadge key="a" role="admin" /> <RoleBadge key="l" role="lead" /> <RoleBadge key="w" role="worker" /></>],
              ["Admin Dashboard", "/admin/dashboard", <RoleBadge key="a2" role="admin" />],
              ["Lead Dashboard", "/admin/lead", <RoleBadge key="l2" role="lead" />],
              ["Worker Dashboard", "/admin/worker", <RoleBadge key="w2" role="worker" />],
            ]} />
          </div>
        </div>
      ),
    },

    // 2. ROLE & AKSES
    {
      id: "roles",
      icon: Users,
      title: "2. Role & Hak Akses (RBAC)",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">Sistem menggunakan 3 role internal + 1 role customer. Semua login melalui <Code>/admin</Code> dan diredirect sesuai role.</p>

          <div className="space-y-3">
            {/* Admin */}
            <div className="bg-background rounded-lg p-4 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-red-400" />
                <h4 className="text-red-400 font-semibold text-sm">ADMIN</h4>
                <RoleBadge role="admin" />
              </div>
              <p className="text-text-muted text-xs mb-2">Akses penuh ke semua fitur sistem.</p>
              <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                <li>Melihat semua orders, stats, revenue</li>
                <li>CRUD staff users (tambah/edit/nonaktifkan Lead & Worker)</li>
                <li>Assign order ke worker</li>
                <li>Kelola pricing, promo codes, testimonials, portfolio</li>
                <li>Konfigurasi integrasi (Midtrans, Telegram, WhatsApp, Email)</li>
                <li>CMS — edit hero section, FAQ, team, visibility</li>
                <li>Export data orders</li>
              </ul>
            </div>

            {/* Lead */}
            <div className="bg-background rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <h4 className="text-blue-400 font-semibold text-sm">LEAD</h4>
                <RoleBadge role="lead" />
              </div>
              <p className="text-text-muted text-xs mb-2">Koordinator order — bridge antara admin dan worker.</p>
              <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                <li>Melihat semua orders + assignment status</li>
                <li>Assign order ke worker (pilih dari dropdown)</li>
                <li>Lihat daftar worker yang aktif + workload</li>
                <li><strong className="text-text">TIDAK BISA:</strong> edit staff, akses settings, kelola pricing/CMS</li>
              </ul>
            </div>

            {/* Worker */}
            <div className="bg-background rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-green-400" />
                <h4 className="text-green-400 font-semibold text-sm">WORKER</h4>
                <RoleBadge role="worker" />
              </div>
              <p className="text-text-muted text-xs mb-2">Booster — mengerjakan order yang ditugaskan.</p>
              <ul className="text-text-muted text-xs space-y-0.5 ml-4 list-disc">
                <li>Melihat <strong className="text-text">hanya</strong> order yang di-assign ke dia</li>
                <li>Klik "Mulai" untuk memulai pengerjaan</li>
                <li>Update progress (slider 0–100%) + current rank</li>
                <li>Submit hasil match (stars, MVP, savage, maniac, win count, durasi)</li>
                <li>Upload screenshot bukti kerja</li>
                <li>Klik "Selesai" ketika order complete → Notifikasi Telegram ke admin</li>
                <li><strong className="text-text">TIDAK BISA:</strong> lihat order orang lain, edit data apapun</li>
              </ul>
            </div>
          </div>

          <InfoBox type="info">
            <strong>Default Admin:</strong> admin@etnyx.com / etnyx_admin_2026 — Segera ganti password setelah pertama kali login.
          </InfoBox>

          <div className="bg-background rounded-lg p-4 border border-accent/20">
            <h4 className="text-accent font-semibold text-sm mb-3">🔗 Link Login per Role</h4>
            <p className="text-text-muted text-xs mb-3">Semua role login melalui halaman yang sama, lalu diredirect otomatis. Bisa juga akses langsung:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-md bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-2">
                  <RoleBadge role="admin" />
                  <span className="text-xs text-text-muted">Admin Dashboard</span>
                </div>
                <Code>/admin/dashboard</Code>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-md bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-2">
                  <RoleBadge role="lead" />
                  <span className="text-xs text-text-muted">Lead Dashboard</span>
                </div>
                <Code>/admin/lead</Code>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-md bg-green-500/5 border border-green-500/10">
                <div className="flex items-center gap-2">
                  <RoleBadge role="worker" />
                  <span className="text-xs text-text-muted">Worker Dashboard</span>
                </div>
                <Code>/admin/worker</Code>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-md bg-purple-500/5 border border-purple-500/10">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">DOCS</span>
                  <span className="text-xs text-text-muted">Dokumentasi (halaman ini)</span>
                </div>
                <Code>/admin/docs</Code>
              </div>
            </div>
            <p className="text-text-muted text-[10px] mt-2">* Semua halaman di atas memerlukan login. Jika belum login, buka <Code>/admin</Code> terlebih dahulu.</p>
          </div>
        </div>
      ),
    },

    // 3. ORDER WORKFLOW
    {
      id: "order-flow",
      icon: ShoppingCart,
      title: "3. Alur Order (Step by Step)",
      content: (
        <div className="space-y-4">
          <div className="relative">
            {/* Flow Steps */}
            {[
              { step: 1, title: "Customer Isi Form Order", desc: "Pilih rank awal → rank tujuan, package, login method, credentials akun ML. Bisa apply promo code.", badge: "customer", page: "/order" },
              { step: 2, title: "Pembayaran Midtrans", desc: "Sistem generate Snap Token, customer diarahkan ke halaman pembayaran Midtrans (VA, QRIS, Gopay, dll).", badge: "customer", page: "Midtrans Snap" },
              { step: 3, title: "Webhook Konfirmasi", desc: "Midtrans kirim callback ke /api/payment/notification → verifikasi signature → order status jadi 'confirmed'.", badge: "auto", page: "/api/payment/notification" },
              { step: 4, title: "Notifikasi Terkirim", desc: "Email konfirmasi ke customer, WhatsApp via Fonnte, Telegram notif ke Admin Group & Worker Group.", badge: "auto", page: "Multi-channel" },
              { step: 5, title: "Lead/Admin Assign Order", desc: "Buka Lead Dashboard → klik order → pilih worker → klik Assign. Worker dapat notifikasi Telegram.", badge: "lead", page: "/admin/lead" },
              { step: 6, title: "Worker Mulai Kerja", desc: "Worker buka dashboard → klik 'Mulai' → status jadi in_progress. Mulai push rank.", badge: "worker", page: "/admin/worker" },
              { step: 7, title: "Worker Update Progress", desc: "Update progress % dan current rank secara berkala. Customer bisa lihat di /track.", badge: "worker", page: "/admin/worker" },
              { step: 8, title: "Worker Submit Hasil", desc: "Setiap sesi: input stars gained, MVP, savage, maniac, matches, wins, durasi. Upload screenshot.", badge: "worker", page: "/admin/worker" },
              { step: 9, title: "Worker Selesai", desc: "Klik 'Selesai' → status jadi 'completed'. Telegram notif ke Admin Group untuk review.", badge: "worker", page: "/admin/worker" },
              { step: 10, title: "Selesai", desc: "Customer dapat email/WA notifikasi order selesai. Bisa lihat di /track atau /dashboard.", badge: "auto", page: "Complete" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">{item.step}</div>
                  {i < 9 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-text font-medium text-sm">{item.title}</h4>
                    <RoleBadge role={item.badge} />
                  </div>
                  <p className="text-text-muted text-xs mt-0.5">{item.desc}</p>
                  <span className="text-accent/60 text-xs font-mono">{item.page}</span>
                </div>
              </div>
            ))}
          </div>

          <InfoBox type="warning">
            <strong>Status Flow:</strong> pending → confirmed (bayar) → in_progress (dikerjakan) → completed (selesai). Admin bisa cancel kapan saja.
          </InfoBox>
        </div>
      ),
    },

    // 4. PAYMENT GATEWAY
    {
      id: "payment",
      icon: CreditCard,
      title: "4. Payment Gateway (Midtrans)",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">Menggunakan <strong className="text-text">Midtrans Snap API</strong> untuk pembayaran. Environment (Sandbox/Production) dikontrol dari Dashboard → Settings → Integrations.</p>

          <div className="bg-background rounded-lg p-3 border border-white/5">
            <h4 className="text-text font-medium text-sm mb-2">Alur Teknis</h4>
            <ol className="text-text-muted text-xs space-y-1 list-decimal ml-4">
              <li>Frontend POST ke <Code>/api/customer/order</Code> dengan data order</li>
              <li>Backend buat Midtrans Snap Token via <Code>snap.createTransaction()</Code></li>
              <li>Return <Code>snap_url</Code> → customer redirect ke Midtrans</li>
              <li>Customer bayar → Midtrans POST webhook ke <Code>/api/payment/notification</Code></li>
              <li>Verifikasi signature: <Code>SHA512(order_id + status_code + gross_amount + serverKey)</Code></li>
              <li>Update order status → trigger notifikasi multi-channel</li>
            </ol>
          </div>

          <Table headers={["Setting", "Lokasi", "Keterangan"]} rows={[
            ["Server Key", "Dashboard → Settings → Integrations", "Midtrans Merchant Key"],
            ["Client Key", "Dashboard → Settings → Integrations", "Untuk frontend Snap.js"],
            ["Environment", "Dashboard → Settings → Integrations", "Toggle Sandbox ↔ Production"],
            ["Payment Channels", "Dashboard → Settings → Integrations", "Enable/disable: BCA VA, Gopay, QRIS, dll"],
            ["Notification URL", "Midtrans Dashboard", "Set ke: https://etnyx.vercel.app/api/payment/notification"],
          ]} />

          <InfoBox type="warning">
            <strong>Penting:</strong> Midtrans Sandbox key TIDAK selalu punya prefix SB-. Sistem menggunakan dashboard toggle, bukan auto-detect dari key prefix.
          </InfoBox>
        </div>
      ),
    },

    // 5. NOTIFICATION SYSTEM
    {
      id: "notifications",
      icon: Bell,
      title: "5. Sistem Notifikasi",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">4 channel notifikasi aktif. Semua konfigurasi di Dashboard → Settings → Integrations.</p>

          <Table headers={["Channel", "Provider", "Penerima", "Trigger"]} rows={[
            [<span key="t" className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-blue-400" /> Telegram Admin</span>, "Bot API", "Admin Group", "Order baru, order selesai"],
            [<span key="tw" className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-green-400" /> Telegram Worker</span>, "Bot API", "Worker Group", "Order di-assign ke worker"],
            [<span key="wa" className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-green-400" /> WhatsApp</span>, "Fonnte API", "Customer", "Konfirmasi bayar, pengerjaan dimulai"],
            [<span key="em" className="flex items-center gap-1"><FileText className="w-3 h-3 text-blue-300" /> Email</span>, "Resend", "Customer", "Konfirmasi bayar, invoice"],
          ]} />

          <div className="bg-background rounded-lg p-3 border border-white/5">
            <h4 className="text-text font-medium text-sm mb-2">Testing Notifikasi</h4>
            <p className="text-text-muted text-xs">Admin bisa test manual via endpoint:</p>
            <div className="bg-surface rounded-lg p-2 mt-1 font-mono text-xs text-accent">
              POST /api/admin/test-notifications<br />
              {"{"} &quot;channel&quot;: &quot;telegram_admin&quot; | &quot;telegram_worker&quot; | &quot;whatsapp&quot; | &quot;email&quot; {"}"}
            </div>
          </div>
        </div>
      ),
    },

    // 6. DATABASE
    {
      id: "database",
      icon: Database,
      title: "6. Database (Supabase)",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">Semua data tersimpan di Supabase PostgreSQL. Admin operations menggunakan service role key (bypass RLS).</p>

          <Table headers={["Tabel", "Purpose", "Key Columns"]} rows={[
            [<strong key="o" className="text-text">orders</strong>, "Semua order customer", "order_id, username, game_id, current_rank, target_rank, status, progress, total_price"],
            [<strong key="ol" className="text-text">order_logs</strong>, "Audit trail perubahan order", "order_id, action, old_value, new_value, created_by"],
            [<strong key="c" className="text-text">customers</strong>, "Data pelanggan", "email, name, whatsapp, referral_code, total_orders, total_spent"],
            [<strong key="s" className="text-text">settings</strong>, "Konfigurasi key-value", "key (string), value (JSON)"],
            [<strong key="t" className="text-text">testimonials</strong>, "Review pelanggan", "name, rank_from, rank_to, rating, comment, is_featured"],
            [<strong key="p" className="text-text">portfolio</strong>, "Showcase hasil kerja", "title, rank_from, rank_to, image_url, description"],
            [<strong key="b" className="text-text">boosters</strong>, "Data booster legacy", "name, whatsapp, specialization, rating"],
            [<strong key="pc" className="text-text">promo_codes</strong>, "Kode diskon", "code, discount_type, discount_value, max_uses, used_count"],
            [<strong key="su" className="text-text">staff_users</strong>, "Users internal (RBAC)", "email, name, password_hash, role, is_active"],
            [<strong key="oa" className="text-text">order_assignments</strong>, "Assignment order → worker", "order_id, assigned_to, assigned_by, status"],
            [<strong key="ws" className="text-text">worker_submissions</strong>, "Hasil kerja booster", "order_id, worker_id, stars_gained, mvp_count, screenshots"],
          ]} />

          <InfoBox type="info">
            <strong>Storage Buckets:</strong> <Code>portfolio</Code> (gambar portfolio) + <Code>worker-screenshots</Code> (bukti kerja worker)
          </InfoBox>
        </div>
      ),
    },

    // 7. API ROUTES
    {
      id: "api",
      icon: Server,
      title: "7. API Routes",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">40+ API routes. Semua di <Code>/api/*</Code>. Auth via JWT cookie.</p>

          {/* Staff */}
          <div className="bg-background rounded-lg p-3 border border-white/5">
            <h4 className="text-text font-medium text-sm mb-2">Staff API <Code>/api/staff/*</Code></h4>
            <Table headers={["Endpoint", "Method", "Deskripsi", "Akses"]} rows={[
              ["/api/staff/auth", "POST", "Login staff (semua role)", <RoleBadge key="p" role="public" />],
              ["/api/staff/auth", "GET", "Cek session aktif", "Authenticated"],
              ["/api/staff/auth", "DELETE", "Logout", "Authenticated"],
              ["/api/staff/users", "GET", "List staff users", <><RoleBadge key="a" role="admin" /> <RoleBadge key="l" role="lead" /></>],
              ["/api/staff/users", "POST", "Tambah staff", <RoleBadge key="a" role="admin" />],
              ["/api/staff/users", "PUT", "Edit staff", <RoleBadge key="a" role="admin" />],
              ["/api/staff/users", "DELETE", "Nonaktifkan staff", <RoleBadge key="a" role="admin" />],
              ["/api/staff/orders", "GET", "List orders (role-filtered)", "All staff"],
              ["/api/staff/orders", "POST", "Assign order ke worker", <><RoleBadge key="a" role="admin" /> <RoleBadge key="l" role="lead" /></>],
              ["/api/staff/orders", "PUT", "Update status/progress", "All staff"],
              ["/api/staff/submissions", "GET", "List hasil kerja", "All staff"],
              ["/api/staff/submissions", "POST", "Submit match results", <RoleBadge key="w" role="worker" />],
              ["/api/staff/upload", "POST", "Upload screenshot", "All staff"],
            ]} />
          </div>

          {/* Admin */}
          <div className="bg-background rounded-lg p-3 border border-white/5">
            <h4 className="text-text font-medium text-sm mb-2">Admin API <Code>/api/admin/*</Code></h4>
            <Table headers={["Endpoint", "Method", "Deskripsi"]} rows={[
              ["/api/admin/auth", "POST/GET/DELETE", "Legacy admin login (masih aktif untuk backward compat)"],
              ["/api/admin/stats", "GET", "KPI stats (total orders, revenue, pending)"],
              ["/api/admin/orders", "GET/POST/PATCH", "CRUD orders + status update"],
              ["/api/admin/orders/credentials", "GET", "Lihat login credentials order (encrypted)"],
              ["/api/admin/chart-data", "GET", "Data chart revenue 7 hari"],
              ["/api/admin/settings", "GET/PUT", "Settings key-value (integrations, CMS, dll)"],
              ["/api/admin/testimonials", "GET/POST/PUT/DELETE", "CRUD testimonials"],
              ["/api/admin/portfolio", "GET/POST/PUT/DELETE", "CRUD portfolio"],
              ["/api/admin/promo-codes", "GET/POST/PUT/DELETE", "CRUD promo codes"],
              ["/api/admin/boosters", "GET/POST/PUT/DELETE", "CRUD boosters"],
              ["/api/admin/customers", "GET", "List customers"],
              ["/api/admin/upload", "POST", "Upload file ke Supabase Storage"],
              ["/api/admin/export", "GET", "Export data orders (CSV/JSON)"],
              ["/api/admin/test-notifications", "POST", "Test channel notifikasi"],
            ]} />
          </div>

          {/* Public */}
          <div className="bg-background rounded-lg p-3 border border-white/5">
            <h4 className="text-text font-medium text-sm mb-2">Public API</h4>
            <Table headers={["Endpoint", "Method", "Deskripsi"]} rows={[
              ["/api/customer/order", "POST", "Buat order baru + generate snap token"],
              ["/api/payment/notification", "POST", "Midtrans webhook callback"],
              ["/api/track", "GET", "Tracking order by order_id"],
              ["/api/testimonials", "GET", "Testimonials publik"],
              ["/api/portfolio", "GET", "Portfolio publik"],
              ["/api/settings", "GET", "Settings publik (hero, FAQ, etc)"],
              ["/api/health", "GET", "Health check endpoint"],
            ]} />
          </div>
        </div>
      ),
    },

    // 8. SECURITY
    {
      id: "security",
      icon: Shield,
      title: "8. Keamanan",
      content: (
        <div className="space-y-4">
          <Table headers={["Layer", "Mekanisme", "Detail"]} rows={[
            ["Authentication", "JWT (JOSE library)", "Token disimpan di HTTPOnly cookie, expire 24 jam"],
            ["Password", "Bcrypt (12 rounds)", "Hash stored, never plaintext"],
            ["Rate Limiting", "In-memory sliding window", "100 req/60s standard, 10 req/5min untuk auth"],
            ["Input Validation", "DOMPurify + sanitize-html", "XSS prevention, SQL injection blocking"],
            ["Credentials", "AES-256-GCM encryption", "Game login/password dienkripsi sebelum disimpan"],
            ["Middleware", "Pattern matching", "Block path traversal, XSS payloads, SQL injection, template injection"],
            ["Bot Blocking", "Path blacklist", "Block /wp-admin, /phpmyadmin, /.env, etc"],
            ["RLS", "Supabase Row Level Security", "Service role bypass, semua API routes via admin client"],
            ["Headers", "CSP, HSTS, X-Frame", "Defined in next.config.ts"],
            ["CORS", "SameSite=Lax cookies", "Cross-origin protection"],
          ]} />

          <InfoBox type="warning">
            <strong>Jangan pernah:</strong> Share SUPABASE_SERVICE_ROLE_KEY, ADMIN_JWT_SECRET, atau ENCRYPTION_KEY ke frontend/publik.
          </InfoBox>
        </div>
      ),
    },

    // 9. PRICING SYSTEM
    {
      id: "pricing",
      icon: BarChart3,
      title: "9. Sistem Pricing",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">3 mode pricing yang bisa dikelola dari Dashboard → Pricing tab:</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-background rounded-lg p-3 border border-white/5">
              <h4 className="text-text font-medium text-sm mb-2">📦 Paket</h4>
              <p className="text-text-muted text-xs">Bundle dari rank A → rank B dengan harga tetap. Contoh: "Epic V → Legend V = Rp 175.089"</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-white/5">
              <h4 className="text-text font-medium text-sm mb-2">⭐ Per Star</h4>
              <p className="text-text-muted text-xs">Harga per bintang berdasarkan tier. Contoh: "Epic = Rp 7.000/star, Legend = Rp 8.000/star"</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-white/5">
              <h4 className="text-text font-medium text-sm mb-2">👥 Gendong (Duo)</h4>
              <p className="text-text-muted text-xs">Customer main bareng booster. Harga lebih tinggi karena waktu lebih lama.</p>
            </div>
          </div>

          <Table headers={["Modifier", "Multiplier", "Keterangan"]} rows={[
            ["Express", "1.2x", "Pengerjaan diprioritaskan, selesai lebih cepat"],
            ["Premium", "1.3x", "High WR booster + hero request + update berkala"],
          ]} />

          <Table headers={["Rank", "Per Star Price", "Keterangan"]} rows={[
            ["Grandmaster", "Rp 5.000", "Easiest tier"],
            ["Epic", "Rp 7.000", "Most popular"],
            ["Legend", "Rp 8.000", ""],
            ["Mythic", "Rp 18.000", ""],
            ["Mythic Grading", "Rp 20.000", ""],
            ["Mythic Honor", "Rp 21.000", ""],
            ["Mythic Glory", "Rp 26.000", ""],
            ["Mythic Immortal", "Rp 31.000", "Highest tier"],
          ]} />
        </div>
      ),
    },

    // 10. ENVIRONMENT VARIABLES
    {
      id: "env",
      icon: Lock,
      title: "10. Environment Variables",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">Set di Vercel Dashboard → Settings → Environment Variables. Jangan commit ke git.</p>

          <Table headers={["Variable", "Wajib", "Keterangan"]} rows={[
            ["NEXT_PUBLIC_SUPABASE_URL", "✅", "URL project Supabase"],
            ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "✅", "Anon key (safe for frontend)"],
            ["SUPABASE_SERVICE_ROLE_KEY", "✅", "Admin key (JANGAN expose ke frontend)"],
            ["ADMIN_JWT_SECRET", "✅", "Secret untuk sign JWT token (min 32 char)"],
            ["ENCRYPTION_KEY", "✅", "AES-256 key untuk encrypt credentials (min 32 char)"],
            ["NEXT_PUBLIC_SITE_URL", "✅", "URL production (https://etnyx.vercel.app)"],
            ["MIDTRANS_SERVER_KEY", "⚠️", "Bisa set dari Dashboard → Integrations juga"],
            ["RESEND_API_KEY", "⚠️", "API key Resend untuk email"],
            ["FONNTE_API_TOKEN", "⚠️", "Token Fonnte untuk WhatsApp"],
            ["PUBLIC_VAPID_KEY", "⚠️", "Web push key (opsional)"],
            ["PRIVATE_VAPID_KEY", "⚠️", "Web push private key (opsional)"],
            ["NEXT_PUBLIC_GA_ID", "❌", "Google Analytics ID (opsional)"],
          ]} />

          <InfoBox type="success">
            <strong>Tip:</strong> Kebanyakan integrasi key (Midtrans, Telegram, Fonnte, Resend) bisa dikelola langsung dari Dashboard → Settings → Integrations tanpa perlu redeploy.
          </InfoBox>
        </div>
      ),
    },

    // 11. DEPLOYMENT
    {
      id: "deployment",
      icon: Zap,
      title: "11. Deployment (Vercel)",
      content: (
        <div className="space-y-4">
          <div className="bg-background rounded-lg p-3 border border-white/5">
            <h4 className="text-text font-medium text-sm mb-2">Deploy Flow</h4>
            <ol className="text-text-muted text-xs space-y-1 list-decimal ml-4">
              <li>Push ke branch <Code>main</Code> di GitHub</li>
              <li>Vercel auto-detect → build: <Code>cd etnyx && npm run build</Code></li>
              <li>Output: <Code>etnyx/.next</Code> → deploy ke Vercel Edge</li>
              <li>URL: <Code>etnyx.vercel.app</Code> (atau custom domain)</li>
            </ol>
          </div>

          <div className="bg-background rounded-lg p-3 border border-white/5">
            <h4 className="text-text font-medium text-sm mb-2">Struktur Repo</h4>
            <pre className="text-text-muted text-xs font-mono whitespace-pre overflow-x-auto">{`repo-root/
├── vercel.json          ← build config (cd etnyx)
├── etnyx/               ← Next.js project
│   ├── src/
│   │   ├── app/         ← pages + API routes  
│   │   ├── components/  ← reusable UI
│   │   ├── lib/         ← utilities & auth
│   │   └── types/       ← TypeScript types
│   ├── public/          ← static assets
│   └── package.json
└── supabase-schema*.sql ← database migrations`}</pre>
          </div>

          <Table headers={["Command", "Fungsi"]} rows={[
            [<Code key="1">npm run dev</Code>, "Start dev server (Turbopack, port 3000)"],
            [<Code key="2">npm run build</Code>, "Production build"],
            [<Code key="3">git push origin main</Code>, "Trigger Vercel deploy"],
          ]} />
        </div>
      ),
    },

    // 12. DASHBOARD GUIDE
    {
      id: "dashboard-guide",
      icon: Settings,
      title: "12. Panduan Dashboard Admin",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">Sidebar admin dashboard punya 10 tab. Berikut fungsi tiap tab:</p>

          <div className="space-y-2">
            {[
              { tab: "Overview", desc: "KPI metrics: total orders, revenue, pending, completed. Chart trend 7 hari. Refresh otomatis 30 detik." },
              { tab: "Orders", desc: "List semua order. Filter by status. Update status (pending → confirmed → in_progress → completed). Lihat credentials akun customer." },
              { tab: "Pricing", desc: "Kelola 3 mode pricing: Paket (bundle), Per Star (per bintang), Gendong (duo). Edit harga, diskon, original price." },
              { tab: "Boosters", desc: "Legacy booster profiles. Tambah/edit booster, set specialization, rating, availability." },
              { tab: "Testi", desc: "Kelola review customer. Toggle featured & visibility. Tampil di homepage." },
              { tab: "Portfolio", desc: "Upload hasil kerja boosting. Before/After rank. Gambar via Supabase Storage." },
              { tab: "Promo", desc: "Buat kode promo: percentage atau fixed, max uses, tanggal expire, tracking." },
              { tab: "Customers", desc: "Database customer: email, nama, WhatsApp, total orders, total spent, referral code." },
              { tab: "Staff", desc: "CRUD staff users: Admin, Lead, Worker. Set role, active status, password reset." },
              { tab: "Settings", desc: "Konfigurasi lengkap: CMS sections, hero, banner, FAQ, team, social links, site info, tracking pixels, integrations." },
            ].map((item, i) => (
              <div key={i} className="bg-background rounded-lg p-3 border border-white/5 flex gap-3">
                <span className="text-accent font-mono text-xs font-bold shrink-0 w-16">{item.tab}</span>
                <p className="text-text-muted text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // 13. WORKER GUIDE
    {
      id: "worker-guide",
      icon: Wrench,
      title: "13. Panduan Worker",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">Panduan lengkap untuk worker (booster) yang baru bergabung.</p>

          <div className="space-y-3">
            {[
              { step: "1. Login", desc: "Buka /admin → masukkan email & password yang diberikan Lead/Admin. Otomatis redirect ke Worker Dashboard." },
              { step: "2. Lihat Order", desc: "Dashboard menampilkan order yang sudah di-assign ke kamu. Ada 3 kategori: Menunggu, Aktif, Selesai." },
              { step: "3. Mulai Order", desc: "Di bagian 'Order Menunggu', klik tombol 'Mulai'. Status order berubah jadi in_progress." },
              { step: "4. Update Progress", desc: "Klik order → 'Update Progress'. Geser slider 0-100%, pilih rank yang sudah dicapai. Klik 'Simpan'." },
              { step: "5. Submit Hasil", desc: "Klik 'Submit Hasil'. Isi: stars gained, MVP count, savage, maniac, matches played, wins, durasi (menit). Upload screenshot." },
              { step: "6. Upload Screenshot", desc: "Klik 'Upload Screenshot' → pilih file (JPG/PNG/WebP, max 5MB). File disimpan di Supabase Storage." },
              { step: "7. Selesai", desc: "Klik 'Selesai' jika rank target sudah tercapai. Admin Group akan dapat notifikasi Telegram." },
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
              <li>• Hanya bisa lihat order yang di-assign ke kamu</li>
              <li>• Tidak bisa edit/hapus data apapun selain progress & submission</li>
              <li>• Submit screenshot sebagai bukti setiap sesi bermain</li>
              <li>• Jangan share credentials customer ke siapapun</li>
            </ul>
          </InfoBox>
        </div>
      ),
    },

    // 14. LEAD GUIDE
    {
      id: "lead-guide",
      icon: UserCheck,
      title: "14. Panduan Lead",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">Panduan untuk Lead — koordinator yang mengatur distribusi order ke worker.</p>

          <div className="space-y-3">
            {[
              { step: "1. Login", desc: "Buka /admin → login. Otomatis redirect ke Lead Dashboard." },
              { step: "2. Cek Order Masuk", desc: "Lihat stats: Total Orders, Belum Assign (kuning), In Progress, Completed. Prioritaskan yang belum assign." },
              { step: "3. Lihat Worker", desc: "Panel 'Tim Worker' menampilkan semua worker aktif + jumlah order aktif masing-masing. Distribusi merata." },
              { step: "4. Assign Order", desc: "Klik order yang belum assign → 'Assign Worker' → pilih worker dari dropdown → tulis catatan (opsional) → Assign." },
              { step: "5. Monitor", desc: "Filter order by status. Pantau progress setiap worker. Koordinasi via Telegram/WhatsApp jika perlu." },
            ].map((item, i) => (
              <div key={i} className="bg-background rounded-lg p-3 border border-blue-500/10">
                <h4 className="text-blue-400 font-medium text-sm">{item.step}</h4>
                <p className="text-text-muted text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <InfoBox type="info">
            <strong>Tips Lead:</strong> Distribusi order berdasarkan skill worker (lihat history selesai). Jangan stack terlalu banyak order ke 1 worker.
          </InfoBox>
        </div>
      ),
    },

    // 15. FILE STRUCTURE
    {
      id: "file-structure",
      icon: Layers,
      title: "15. Struktur File Project",
      content: (
        <div className="space-y-4">
          <pre className="bg-background rounded-lg p-4 border border-white/5 text-text-muted text-xs font-mono whitespace-pre overflow-x-auto leading-relaxed">{`etnyx/src/
├── app/
│   ├── layout.tsx              # Root layout (SEO, providers, theme)
│   ├── page.tsx                # Homepage (Hero, Pricing, FAQ, CTA)
│   ├── globals.css             # Tailwind + custom theme variables
│   ├── robots.ts               # SEO robots config
│   ├── sitemap.ts              # Auto sitemap generation
│   │
│   ├── (customer)/             # Customer routes (auth-protected)
│   │   ├── login/page.tsx      # Customer login
│   │   ├── register/page.tsx   # Customer register
│   │   └── dashboard/page.tsx  # Customer order dashboard
│   │
│   ├── admin/                  # Staff panel
│   │   ├── page.tsx            # Staff login (semua role)
│   │   ├── layout.tsx          # Admin layout (noindex)
│   │   ├── dashboard/page.tsx  # Admin dashboard (2400+ lines)
│   │   ├── lead/page.tsx       # Lead order management
│   │   └── worker/page.tsx     # Worker task dashboard
│   │
│   ├── order/page.tsx          # Public order form
│   ├── track/page.tsx          # Public order tracking
│   ├── payment/success/        # Payment confirmation
│   │
│   └── api/                    # 40+ API routes
│       ├── admin/              # Admin-only endpoints
│       │   ├── auth/           # Login/session
│       │   ├── orders/         # CRUD + credentials
│       │   ├── stats/          # KPI metrics
│       │   ├── settings/       # Key-value config
│       │   ├── chart-data/     # Revenue trends
│       │   ├── testimonials/   # CRUD
│       │   ├── portfolio/      # CRUD + storage
│       │   ├── promo-codes/    # CRUD
│       │   ├── boosters/       # CRUD
│       │   ├── customers/      # Read only
│       │   ├── upload/         # File upload
│       │   ├── export/         # Data export
│       │   ├── notify/         # Manual notify
│       │   └── test-notifications/  # Test channels
│       │
│       ├── staff/              # Multi-role staff API
│       │   ├── auth/           # Staff login/logout
│       │   ├── users/          # CRUD staff users
│       │   ├── orders/         # Role-filtered orders
│       │   ├── submissions/    # Worker results
│       │   └── upload/         # Screenshot upload
│       │
│       ├── customer/           # Customer endpoints
│       │   ├── auth/           # Login/register
│       │   ├── order/          # Create order
│       │   └── orders/         # List my orders
│       │
│       └── payment/            # Payment processing
│           ├── notification/   # Midtrans webhook
│           └── test-connection/# Test Midtrans
│
├── components/
│   ├── sections/               # 10 homepage sections
│   ├── layout/                 # Navbar, Footer, FloatingCTA
│   └── (standalone)            # 18 reusable components
│
├── lib/
│   ├── staff-auth.ts           # RBAC JWT verification
│   ├── admin-auth.ts           # Legacy admin auth
│   ├── supabase.ts             # Browser client
│   ├── supabase-server.ts      # Admin + anon server clients
│   ├── constants.ts            # Ranks, FAQ, config
│   ├── notifications.ts        # Multi-channel (Telegram, WA, Email, Push)
│   ├── email.ts                # Resend email service
│   ├── validation.ts           # Input sanitization
│   ├── encryption.ts           # AES-256-GCM
│   └── i18n/                   # Indonesian/English translations
│
├── types/
│   ├── database.ts             # Supabase types
│   └── index.ts                # App types (RankTier, OrderData)
│
├── utils/
│   └── helpers.ts              # Price calc, format, orderID gen
│
├── contexts/
│   └── LanguageContext.tsx      # i18n provider
│
└── middleware.ts                # Rate limiting, XSS/SQLi blocking`}</pre>
        </div>
      ),
    },
  ];
}

// --- Main Docs Component ---
export default function DocsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sections = buildSections();

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

  const currentSection = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 z-30 bg-surface border-r border-white/5 transition-all duration-200 ${sidebarOpen ? "w-64" : "w-0 -translate-x-full"} overflow-y-auto`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-accent" />
              <h1 className="text-text font-bold text-sm">ETNYX DOCS</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-text-muted hover:text-text p-1">
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
        <nav className="py-2">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-all ${
                activeSection === s.id
                  ? "text-accent bg-accent/10 border-r-2 border-accent"
                  : "text-text-muted hover:text-text hover:bg-white/5"
              }`}
            >
              <s.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-left truncate">{s.title}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => router.push("/admin/dashboard")} className="flex items-center gap-2 text-text-muted hover:text-text text-xs transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/5">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-200 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-3 flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-text-muted hover:text-text p-1">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <currentSection.icon className="w-4 h-4 text-accent" />
              <h2 className="text-text font-semibold text-sm">{currentSection.title}</h2>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 py-6 max-w-4xl">
          {currentSection.content}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-8 max-w-4xl">
          <div className="flex justify-between border-t border-white/5 pt-4">
            {(() => {
              const idx = sections.findIndex(s => s.id === activeSection);
              const prev = idx > 0 ? sections[idx - 1] : null;
              const next = idx < sections.length - 1 ? sections[idx + 1] : null;
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
      </main>
    </div>
  );
}
