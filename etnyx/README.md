# ETNYX - Jasa Joki Mobile Legends

Platform jasa joki Mobile Legends profesional dengan sistem pembayaran ganda, manajemen tim, reward system, dan admin dashboard lengkap.

## ✨ Fitur Utama

### 🎮 Order & Pembayaran
- **Dual Payment System** - Transfer Manual (Bank, E-Wallet, QRIS) + Otomatis (Midtrans)
- **Payment Manual** - 5 Bank (BCA, BRI, BNI, Mandiri, Jago), 5 E-Wallet (DANA, GoPay, OVO, ShopeePay, LinkAja), QRIS dengan upload gambar QR
- **Midtrans Auto** - QRIS, VA, GoPay, ShopeePay, Kartu Kredit (muncul otomatis jika Server Key diisi)
- **Upload Bukti Transfer** - Customer upload bukti, admin approve/reject
- **3 Mode Order** - Paket, Per-Star, Gendong
- **Star & Division Tracking** - Track bintang (I-V) per rank untuk Warrior-Legend
- **Promo Code & Referral** - Diskon otomatis + referral bonus
- **Order Tracking** - Real-time status tracking publik

### 👥 Manajemen Tim (RBAC)
- **Admin** - Full access, kelola semua
- **Lead** - Kelola worker tim sendiri, assign order, bulk assign, view submissions (mobile responsive)
- **Worker** - Submit progress, upload screenshot, edit/delete submission (30 menit), update rank progress (mobile responsive)

### 💰 Reward & Loyalty
- **Tier System** - Bronze → Silver → Gold → Platinum
- **Points** - Earn dari order, redeem di catalog
- **Referral Bonus** - Ajak teman dapat reward

### 💼 Payroll
- **Komisi Per-Order** - Otomatis dihitung
- **Gaji Bulanan** - Staff salaries
- **Payout Batch** - Proses pembayaran massal

### 📊 Admin Dashboard
- **CMS Sections** - Visibilitas section, Hero, Banner, FAQ, Tim, Sosial, Info Situs
- **Analytics Dashboard** - Revenue trend (AreaChart), order stats, package breakdown (paginated), top customers, customer growth, rank pair analytics
- **Worker Leaderboard** - Peringkat worker berdasarkan score, winrate, MVP, savage, rating. Podium top 3, sortable columns
- **Invoice PDF** - Generate invoice PDF per order (pdf-lib), tersedia untuk admin & customer
- **Tracking Pixels** - Meta Pixel, GA4, GTM, TikTok
- **Integrasi** - Midtrans, Resend Email, Fonnte WA, Telegram Bot
- **Rekening Transfer Manual** - Kelola rekening, upload QRIS
- **Export Data** - CSV/Excel
- **Audit Log** - Semua aksi admin tercatat

### 🔔 Notifikasi
- **Telegram Bot** - Notif ke grup admin/worker/review
- **Email** - Via Resend
- **WhatsApp** - Via Fonnte (order confirmation, payment confirmed, order started, order completed)
- **Push Notification** - Browser push
- **Smart Display** - Per-bintang orders tampil `package_title` (misal "Legend × 6 Star") bukan rank→rank
- **Follow-Up Templates** - 7 template WA follow-up (payment, credentials, progress, dll)
- **Separate Review & Report** - Link review dan report worker terpisah di WA order selesai

### 🔒 Security
- **Enkripsi** - Credential order dienkripsi di database
- **Rate Limiting** - Per-IP, strict untuk auth endpoints
- **Input Sanitization** - XSS prevention
- **CSP Headers** - Content Security Policy
- **RLS** - Row Level Security di Supabase

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Payment | Midtrans Snap |
| Email | Resend |
| WhatsApp | Fonnte |
| Bot | Telegram Bot API |
| Deploy | Vercel |
| Icons | Lucide React |

---

## 📁 Project Structure

```
etnyx/
├── public/                    # Static assets, PWA, icons
├── src/
│   ├── app/
│   │   ├── api/              # 60+ API routes
│   │   │   ├── admin/        # Admin CRUD (orders, settings, staff, rewards, payroll)
│   │   │   ├── customer/     # Customer auth, orders, rewards
│   │   │   ├── staff/        # Staff auth, orders, submissions
│   │   │   ├── payment/      # Midtrans + manual payment
│   │   │   ├── payment-methods/ # Check available payment methods
│   │   │   ├── chat/         # Customer support chat
│   │   │   ├── push/         # Push notifications
│   │   │   ├── telegram/     # Telegram webhook
│   │   │   └── settings/     # Public CMS settings
│   │   ├── (customer)/       # Customer portal (login, dashboard, etc)
│   │   ├── admin/            # Admin panel (dashboard, lead, worker, docs)
│   │   ├── order/            # Order form (paket, perstar, gendong)
│   │   ├── payment/          # Payment pages (manual, success)
│   │   └── track/            # Public order tracking
│   ├── components/           # React components
│   │   ├── layout/           # Navbar, Footer
│   │   └── sections/         # Homepage sections
│   ├── contexts/             # React contexts (Language)
│   ├── lib/                  # Utilities
│   │   ├── admin-auth.ts     # Admin session verification
│   │   ├── constants.ts      # App constants
│   │   ├── email.ts          # Resend email service
│   │   ├── encryption.ts     # AES encryption for credentials
│   │   ├── notifications.ts  # Multi-channel notification sender
│   │   ├── supabase.ts       # Client-side Supabase
│   │   ├── supabase-server.ts # Server-side Supabase
│   │   ├── validation.ts     # Input validation & sanitization
│   │   └── i18n/             # Internationalization (ID/EN)
│   ├── types/                # TypeScript type definitions
│   └── middleware.ts         # Rate limiting & security
├── supabase-schema-v*.sql    # Database migration scripts
└── vercel.json               # Vercel routing config
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/Briyanes/etnyx-jasa-joki-rank-mobile-legend.git
cd etnyx
npm install
cp .env.example .env.local  # Edit with your values
npm run dev
```

---

## ⚙️ Environment Variables

### Required (Vercel + .env.local)

| Variable | Deskripsi |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | Production URL (https://etnyx.com) |
| `ENCRYPTION_KEY` | 32-char key untuk encrypt credentials |

### Optional (aktifkan sesuai kebutuhan)

| Variable | Deskripsi |
|----------|-----------|
| `MIDTRANS_SERVER_KEY` | Midtrans server key (atau isi via dashboard) |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Midtrans client key (public) |
| `MIDTRANS_IS_PRODUCTION` | `true` untuk production mode |
| `RESEND_API_KEY` | Resend API key untuk email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash password admin |

> **Note**: Midtrans, Telegram, Fonnte, dan Resend juga bisa diisi via Admin Dashboard → Settings → Integrasi. Database config takes priority over env vars.

---

## 💳 Sistem Pembayaran

### Transfer Manual (Selalu Aktif)
- Customer pilih "Transfer Manual" → redirect ke `/payment/manual`
- Lihat daftar rekening aktif (Bank, E-Wallet, QRIS)
- Transfer → upload bukti + nama pengirim
- Admin dapat notifikasi Telegram → approve/reject di dashboard

### Midtrans Otomatis (Conditional)
- Muncul **hanya jika** Server Key diisi (env var ATAU dashboard)
- Customer pilih "Otomatis (Midtrans)" → redirect ke Midtrans Snap
- Payment otomatis diverifikasi via webhook (`/api/payment/notification`)

### Logic Flow
```
Order Page → GET /api/payment-methods
  ├── midtransEnabled: true  → Tampil 2 pilihan
  └── midtransEnabled: false → Hanya Transfer Manual

Saat Submit Order → POST /api/customer/order
  ├── paymentMethod: "manual_transfer"
  │   └── Skip Midtrans → Redirect /payment/manual
  └── paymentMethod: "midtrans"
      └── Create Midtrans transaction → Redirect Snap URL
```

### Admin Approve Bukti Transfer
```
Dashboard → Orders → Klik "Lihat Bukti Transfer"
  → GET /api/admin/payment-proof?order_id=xxx
  → Review gambar → POST /api/admin/payment-proof {action: "approve"/"reject"}
  → Approve: order → paid + confirmed + notif customer
  → Reject: log reason + notif customer
```

### Rekening & QRIS Setup
1. Admin Dashboard → Settings → Integrasi → scroll ke **Rekening Transfer Manual**
2. Isi nomor rekening + atas nama untuk bank yang aktif
3. Untuk QRIS: klik **Upload Gambar QRIS** → upload QR code
4. Klik **Simpan**

---

## 📡 API Routes

### Public
| Method | Route | Deskripsi |
|--------|-------|-----------|
| GET | `/api/settings` | CMS settings public |
| GET | `/api/payment-methods` | Cek payment methods available |
| GET | `/api/boosters` | Daftar booster |
| GET | `/api/portfolio` | Portfolio items |
| GET | `/api/testimonials` | Testimoni |
| GET | `/api/track` | Track order status |
| POST | `/api/promo` | Validasi promo code |
| POST | `/api/review` | Submit review |

### Customer (Auth Required)
| Method | Route | Deskripsi |
|--------|-------|-----------|
| POST | `/api/customer/auth` | Register/login |
| POST | `/api/customer/order` | Buat order baru |
| GET | `/api/customer/orders` | Daftar order customer |
| GET/POST | `/api/customer/rewards` | Reward points & redeem |

### Payment
| Method | Route | Deskripsi |
|--------|-------|-----------|
| GET/POST | `/api/payment/manual` | Info rekening + upload bukti |
| POST | `/api/payment/notification` | Midtrans webhook |

### Admin (Auth Required)
| Method | Route | Deskripsi |
|--------|-------|-----------|
| GET/PATCH | `/api/admin/orders` | Kelola orders |
| GET/PUT | `/api/admin/settings` | CMS settings (30+ keys) |
| GET/POST | `/api/admin/payment-proof` | Review bukti transfer |
| POST | `/api/admin/upload-qris` | Upload gambar QRIS |
| GET | `/api/admin/stats` | Dashboard statistik |
| GET | `/api/admin/chart-data` | Data grafik |
| GET | `/api/admin/analytics` | Analytics dashboard (revenue, packages, customers, ranks) |
| GET | `/api/admin/worker-leaderboard` | Worker performance leaderboard |
| GET | `/api/admin/export` | Export data |
| GET | `/api/invoice` | Generate invoice PDF/HTML |
| CRUD | `/api/admin/testimonials` | Kelola testimoni |
| CRUD | `/api/admin/portfolio` | Kelola portfolio |
| CRUD | `/api/admin/promo-codes` | Kelola promo codes |
| CRUD | `/api/admin/boosters` | Kelola booster profiles |
| CRUD | `/api/admin/rewards/catalog` | Kelola reward catalog |
| * | `/api/admin/payroll/*` | Payroll management |

### Staff
| Method | Route | Deskripsi |
|--------|-------|-----------|
| POST | `/api/staff/auth` | Staff login |
| GET/POST | `/api/staff/orders` | Order assignments |
| CRUD | `/api/staff/submissions` | Worker submissions |
| CRUD | `/api/staff/users` | Staff management (admin/lead) |

---

## 🗃️ Database (27+ Tables)

### Core
- `orders` - Order dengan payment_method, payment_status, encryption, current_star/target_star
- `order_logs` - Audit trail status changes
- `order_assignments` - Worker assignment tracking
- `payment_proofs` - Bukti transfer manual

### Users
- `customers` - Customer profiles, tier, referral
- `staff_users` - Admin/Lead/Worker (RBAC)
- `chat_messages` - Support chat

### Content
- `boosters`, `portfolio`, `testimonials`, `reviews`
- `settings` - Key-value CMS store

### Pricing & Promo
- `promo_codes`, `promo_usage`, `ad_spend`

### Rewards
- `reward_transactions`, `reward_catalog`, `reward_redemptions`, `referrals`

### Payroll
- `commissions`, `salary_records`, `payouts`, `payroll_settings`, `staff_salaries`, `staff_payment_accounts`

### System
- `admin_audit_log`, `push_subscriptions`

---

## 🗂️ Schema Migrations

Jalankan di Supabase SQL Editor secara berurutan:

| File | Deskripsi |
|------|-----------|
| `supabase-schema.sql` | v1: Base tables (orders, settings) |
| `supabase-schema-v2.sql` | v2: Promo codes |
| `supabase-schema-v3.sql` | v3: Testimonials, portfolio |
| `supabase-schema-v4.sql` | v4: Boosters |
| `supabase-schema-v8.sql` | v8: Customer auth & profiles |
| `supabase-schema-v9.sql` | v9: Staff RBAC, worker submissions |
| `supabase-schema-v10.sql` | v10: Reward system |
| `supabase-schema-v11.sql` | v11: Audit log |
| `supabase-schema-v12.sql` | v12: Reviews |
| `supabase-schema-v13.sql` | v13: Payroll system |
| `supabase-schema-v14.sql` | v14: Payment accounts |
| `supabase-schema-v15.sql` | v15: Ad spend tracking |
| `supabase-schema-v16.sql` | v16: Lead-worker hierarchy |
| `supabase-schema-v17.sql` | v17: Dual payment (manual + Midtrans) |
| `supabase-schema-v18.sql` | v18: Star/division tracking (current_star, target_star) |
| `supabase-schema-v19.sql` | v19: Password reset tokens table |
| `supabase-schema-v20.sql` | v20: Seed 30 workers (15 per lead) |

---

## 📦 Supabase Storage Buckets

| Bucket | Type | Kegunaan |
|--------|------|----------|
| `payment-proofs` | Public | Bukti transfer + gambar QRIS |
| `worker-screenshots` | Public | Screenshot progress worker |
| `portfolio` | Public | Portfolio before/after images |

---

## 🔧 Admin Dashboard Settings

### CMS Keys (via `/api/admin/settings`)

| Key | Deskripsi |
|-----|-----------|
| `hero` | Hero section content |
| `promo_banner` | Promo banner text & link |
| `faq_items` | FAQ items |
| `section_visibility` | Toggle homepage sections |
| `tracking_pixels` | Meta Pixel, GA4, GTM, TikTok |
| `social_links` | Instagram, Facebook, TikTok, YouTube, WhatsApp |
| `site_info` | Site name, tagline, email |
| `integrations` | Midtrans, Resend, Fonnte, Telegram |
| `bank_accounts` | Rekening transfer manual (bank, ewallet, qris) |
| `pricing_catalog` | Paket harga |
| `perstar_pricing` | Harga per-star |
| `gendong_pricing` | Harga gendong |

---

## 🧪 Testing

```bash
npm run test          # Vitest watch mode
npm run test:run      # Single run
npm run test:coverage # Coverage report
npm run lint          # ESLint check
npx tsc --noEmit     # TypeScript check
npm run build         # Production build
```

**Test Stack:** Vitest 4.1.3 + Testing Library + jsdom

| Test File | Deskripsi |
|-----------|----------|
| `helpers.test.ts` | Helper/utility function tests |
| `api/promo.test.ts` | Promo code API tests |

---

## 📝 Recent Commits

| Hash | Deskripsi |
|------|-----------|
| `aa1e7ce` | Fix mobile responsive Lead & Worker dashboards |
| `3d3cbd8` | Normalize Analytics tab theme to match dashboard |
| `prev` | Fix delete button visibility for inactive staff |
| `prev` | Worker Leaderboard tab (podium, sortable, performance score) |
| `prev` | Analytics dashboard (revenue, packages, customers, ranks) |
| `prev` | Invoice PDF generation (pdf-lib) |
| `prev` | Automated testing setup (Vitest + Testing Library, 29 tests) |
| `prev` | Hard-delete staff users (bukan soft-delete) |
| `prev` | Seed 30 workers SQL (15 per lead) |
| `12b845d` | Track page: timeline timestamps, review/report links, Express/Premium badges |
| `77116d8` | Docs: update README star tracking, notification, recent commits |
| `ec493e3` | Style: spasi harga-Manual badge, custom dropdown arrow |
| `6552859` | Pisah link Review & Report Worker di WA order selesai |
| `496b698` | Loading spinner di semua action button dashboard |
| `594947e` | Fix WA link clickable di mobile (hapus trailing slash) |
| `33babfa` | Admin selesaikan auto progress 100% + notification logging |
| `ff3ece3` | Hapus track link & jangan login dari WA payment confirmed |
| `c35fa6f` | Fix link WA order confirmation ke /payment/manual |
| `9df75fa` | package_title untuk per-bintang di semua notifikasi |
| `e26391c` | Star/division tracking di order flow |
| `a24d538` | Auto-hide Midtrans jika tidak configured |
| `c698ec8` | QRIS image upload untuk payment manual |
| `dbed915` | Fix urutan bank account (bank → ewallet → qris) |
| `78967a6` | Auto-restore missing bank account entries |
| `08498f6` | Fix bank_accounts ke ALLOWED_KEYS whitelist |
| `1ba09a8` | Lucide icons untuk payment methods |
| `e55820b` | Expand payment options (5 bank, 5 ewallet, QRIS) |
| `89b269a` | Dual payment system (auto Midtrans + manual transfer) |

---

## 📄 License

MIT License

## 🤝 Support

Website: [etnyx.com](https://etnyx.com)

Made with ❤️ by ETNYX Team
