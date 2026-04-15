# ETNYX — Panduan Sistem Operasional
### Untuk Seluruh Tim (Admin, Lead, Worker)

**Versi:** 1.0 — 14 April 2026
**Website:** https://etnyx.com
**Dashboard:** https://etnyx.com/admin

---

## 1. OVERVIEW SISTEM

ETNYX adalah platform jasa joki & gendong Mobile Legends dengan fitur:
- **3 Mode Order:** Paket, Per-Bintang, Gendong
- **Dual Payment:** Transfer Manual + iPaymu (otomatis)
- **Notifikasi Otomatis:** WhatsApp, Telegram, Email, Push
- **Dashboard per Role:** Admin, Lead, Worker
- **Chatbot WA:** Auto-reply untuk customer

---

## 2. STRUKTUR TIM & ROLE

| Role | Akses Dashboard | Tugas Utama |
|------|----------------|-------------|
| **Admin** | `/admin` | Payment approval, kelola staff, CMS, analytics |
| **Lead** | `/admin/lead` | Assign worker, submit hasil, manage tim |
| **Worker** | `/admin/worker` | Push rank, update progress, selesaikan order |

### Hirarki:
```
Admin (Full Control)
  └── Lead (Team Manager)
        └── Worker 1, Worker 2, ... (Executor)
```

---

## 3. ALUR ORDER LENGKAP

```
Customer Order → Admin Approve → Lead Assign → Worker Push → Lead Upload Hasil → Selesai
```

### Step-by-Step:

| Step | Status Order | PIC | Aksi | Notifikasi |
|------|-------------|-----|------|------------|
| 1 | `pending` | **Customer** | Submit order, pilih paket & payment | — |
| 2 | `pending` | **Customer** | Upload bukti transfer / bayar via iPaymu | WA + Email ke Customer |
| 3 | `paid` → `confirmed` | **Admin** | Review bukti transfer → Approve/Reject | TG Admin, WA + Email ke Customer |
| 4 | `confirmed` → `in_progress` | **Lead** | Assign worker ke order | TG Worker, WA Customer, Push Worker |
| 5 | `in_progress` | **Worker** | Lihat credentials → push rank di game | — |
| 6 | `in_progress` | **Worker** | Update progress (%, screenshot, catatan) | TG Worker |
| 7 | `in_progress` → `completed` | **Worker** | Klik "Selesaikan Order" | TG Admin + Worker |
| 8 | `completed` | **Lead** | Upload hasil (screenshot before/after) | WA + Email ke Customer |

---

## 4. PANDUAN PER ROLE

---

### 4A. ADMIN — Panduan Lengkap

**Login:** `/admin` → masukkan password admin

#### Dashboard Utama
- Total order, revenue, statistik harian
- Grafik revenue trend & order stats
- Quick actions: approve payment, assign order

#### Payment Approval (Tugas Utama)
1. Buka tab **Orders**
2. Filter status `paid` (butuh approval)
3. Klik **"Lihat Bukti Transfer"**
4. Review gambar bukti + nama pengirim
5. Klik **Approve** (order → `confirmed`) atau **Reject** (+ alasan)
6. Customer otomatis dapat notifikasi WA & Email

#### Kelola Staff
1. Tab **Staff** → Tambah Admin/Lead/Worker
2. Untuk Worker: wajib pilih Lead-nya (`lead_id`)
3. Bisa nonaktifkan/hapus staff

#### CMS Settings
- **Hero Section** — Edit teks & gambar hero homepage
- **Pricing Catalog** — Edit paket harga (paket, per-star, gendong)
- **Promo Codes** — Buat/edit kode promo
- **Integrations** — Set API keys (Telegram, WA, iPaymu, dll)
- **Bank Accounts** — Kelola rekening transfer manual
- **Season Pricing** — Atur multiplier harga per musim

#### Analytics
- Revenue trend (AreaChart)
- Package breakdown
- Top customers
- Rank pair analytics
- Worker leaderboard

#### Export Data
- Export orders ke CSV/Excel
- Filter by tanggal, status, dll

---

### 4B. LEAD — Panduan Lengkap

**Login:** `/admin` → login dengan akun Lead

#### Melihat Order
- Tampil order `confirmed` (belum di-assign) dan `in_progress` (tim sendiri)
- Counter "Belum Ditugaskan" menunjukkan jumlah order yang perlu di-assign
- Pagination: 20 order per halaman

#### Assign Worker (Tugas Utama)
1. Lihat order dengan status `confirmed`
2. Klik **"Tugaskan"** pada order
3. Pilih worker dari dropdown (hanya worker tim sendiri)
4. Worker langsung dapat push notification + order muncul di dashboard-nya

#### Bulk Assign
1. Centang beberapa order sekaligus
2. Pilih worker → klik "Assign Semua"
3. Diproses batch per 5 order

#### Submit Hasil
1. Setelah worker selesai (status `completed` atau `in_progress`)
2. Klik **"Submit Hasil"** pada order
3. Upload screenshot before/after
4. Customer otomatis dapat notifikasi + link review

#### Shared Notes
- Setiap order punya catatan bersama
- Lead & Worker bisa tambah catatan
- Catatan tersimpan di order logs

#### Worker Cards
- Lihat daftar worker dalam tim
- Status: aktif/idle, jumlah order aktif
- Nama Lead tampil di setiap worker card

---

### 4C. WORKER — Panduan Lengkap

**Login:** `/admin` → login dengan akun Worker

#### Melihat Assignment
- Tampil order yang di-assign ke kamu
- Info: nickname customer, rank target, deadline

#### Mulai Kerja
1. Klik order → lihat **Credentials** (akun game customer)
2. Login ke game → mulai push rank
3. **PENTING:** Jangan share credentials ke siapapun!

#### Update Progress
1. Klik **"Update Progress"** pada order
2. Isi persentase progress (0-100%)
3. Upload screenshot progress (opsional)
4. Tambah catatan jika perlu

#### Selesaikan Order
1. Setelah rank target tercapai
2. Klik **"Selesaikan Order"**
3. Status berubah ke `completed`
4. Lead akan upload hasil akhir

#### Yang TIDAK Bisa Dilakukan Worker:
- ❌ Submit hasil/screenshot final (Lead yang upload)
- ❌ Assign order ke worker lain
- ❌ Lihat order orang lain
- ❌ Akses settings/CMS

---

## 5. MODE ORDER & PRICING

### A. Paket (Rank → Rank)
- Customer pilih paket (misal: Epic V → Mythic)
- Harga fixed per paket
- Contoh: Epic V → Mythic = Rp 315.089

### B. Per-Bintang
- Customer pilih rank + jumlah bintang
- Harga per bintang × jumlah
- Contoh: Mythic Immortal × 3 star = Rp 31.000 × 3 = Rp 93.000

### C. Gendong (Duo Boost)
- Customer main bareng booster
- Harga per bintang lebih tinggi (booster tidak pegang akun)
- Customer pilih role & jadwal main
- Tidak perlu share password

### Biaya Tambahan:
| Add-on | Biaya | Keterangan |
|--------|-------|------------|
| **Express** | +20% | Prioritas pengerjaan |
| **Premium** | +30% | Booster senior + prioritas |
| **Season Multiplier** | Variabel | Harga naik/turun sesuai musim (CMS) |

### Diskon:
| Jenis | Besaran |
|-------|---------|
| Promo Code | Variabel (set di CMS) |
| Referral | 10% |
| Tier Silver | 3% |
| Tier Gold | 5% |
| Tier Platinum | 8% |

---

## 6. PAYMENT FLOW

### Transfer Manual (Selalu Aktif)
```
Customer pilih "Transfer Manual"
  → Redirect ke /payment/manual
  → Lihat daftar rekening (Bank/E-Wallet/QRIS)
  → Transfer → Upload bukti + nama pengirim
  → Admin dapat notif Telegram
  → Admin approve → Customer dapat WA "Pembayaran dikonfirmasi"
```

### iPaymu Otomatis (Jika Aktif)
```
Customer pilih "Otomatis (iPaymu)"
  → Redirect ke halaman iPaymu
  → Bayar via QRIS/VA/GoPay/ShopeePay/Kartu Kredit
  → Auto-verified via webhook
  → Order langsung confirmed
```

**Status iPaymu saat ini:** Menunggu approval dari iPaymu. Sementara hanya Transfer Manual.

### Jika iPaymu Gagal:
- Otomatis fallback ke Transfer Manual
- Customer dapat WA dengan info rekening + link upload bukti

---

## 7. NOTIFIKASI OTOMATIS

### Telegram Bot Groups

| Group | Isi Notifikasi |
|-------|---------------|
| **Admin Group** | Order baru, payment proof, status changes |
| **Worker Group** | Assignment baru, progress update, order selesai |
| **Review Group** | Customer review masuk |
| **Report Group** | Customer report/complaint |
| **Alert Group** | System errors, unknown WA messages |

### WhatsApp ke Customer

| Trigger | Pesan |
|---------|-------|
| Order dibuat | Konfirmasi order + link pembayaran |
| Payment confirmed | "Pembayaran dikonfirmasi, order sedang diproses" |
| Worker assigned | "Order kamu sedang dikerjakan" |
| Order selesai | "Order selesai! Cek hasilnya" + link review + link report |
| iPaymu gagal | Info fallback manual + rekening + link upload bukti |

### Email ke Customer
- Order confirmation
- Payment confirmed
- Order completed

---

## 8. CHATBOT WHATSAPP

Customer bisa chat ke WA ETNYX dan mendapat auto-reply:

| Keyword | Response |
|---------|----------|
| `menu` / `hi` / `halo` | Menu utama (5 pilihan) |
| `1` / `harga` | Info pricing + link order |
| `2` / `cek` / `ETX-xxxxx` | Status order (auto-lookup by phone/order ID) |
| `3` / `cs` / `bantuan` | Link WA ke CS |
| `4` / `review` | Link review |
| `5` / `promo` | Info promo aktif |
| Lainnya | "Maaf belum bisa bantu" + forward ke Telegram Alert |

**Filter Bot:** Pesan dari bot pihak ketiga (misal: INDIRA/Indosat) otomatis di-skip, tidak diteruskan ke Telegram.

---

## 9. CUSTOMER FEATURES

### Order Tracking
- Customer bisa lacak order di `/track`
- Masukkan Order ID → lihat status real-time
- Timeline dengan timestamp setiap perubahan status

### Customer Dashboard
- Login via `/login`
- Lihat semua order & status
- Reward points & redeem catalog
- Tier progression (Bronze → Silver → Gold → Platinum)

### Review & Report
- Setelah order selesai, customer dapat link terpisah:
  - **Review** — beri rating & testimoni
  - **Report Worker** — laporkan masalah

---

## 10. SECURITY

| Fitur | Detail |
|-------|--------|
| **Enkripsi** | Credential game customer dienkripsi (AES) di database |
| **Rate Limiting** | Max 5 order/menit per IP |
| **Input Sanitization** | Semua input di-sanitize (XSS prevention) |
| **HMAC Verification** | WA webhook diverifikasi signature-nya |
| **Server-side Price** | Harga dihitung ulang di server, tidak trust client |
| **Promo Atomic** | Promo code di-consume secara atomic (race condition safe) |

### Penting untuk Worker:
- **JANGAN** share credentials customer ke siapapun
- **JANGAN** screenshot credentials dan kirim ke chat
- Credentials hanya bisa dilihat di dashboard, ter-enkripsi di database

---

## 11. TECH STACK (Info untuk yang Technical)

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Payment | iPaymu (menunggu approval) |
| Email | Resend |
| WhatsApp | Meta Cloud API |
| Telegram | Telegram Bot API |
| Hosting | Vercel |

---

## 12. KONTAK & AKSES

| Item | Detail |
|------|--------|
| Website | https://etnyx.com |
| Admin Dashboard | https://etnyx.com/admin |
| Repository | github.com/Briyanes/etnyx-jasa-joki-rank-mobile-legend |
| WA Bisnis | — (set di Meta Business) |
| Telegram Bot | @EtnyxBot |

---

## 13. FAQ TIM

**Q: Bagaimana jika customer komplain?**
A: Cek order di dashboard → lihat progress & logs → hubungi customer via WA. Jika masalah serius, eskalasi ke Admin.

**Q: Bagaimana jika iPaymu gagal saat customer bayar?**
A: Otomatis fallback ke transfer manual. Customer dapat WA dengan info rekening.

**Q: Worker bisa lihat lebih dari 1 order?**
A: Ya, worker bisa ditugaskan beberapa order sekaligus. Semua muncul di dashboard Worker.

**Q: Bagaimana cara tambah paket harga baru?**
A: Admin → Settings → Pricing Catalog → Edit/tambah paket. Perubahan langsung aktif.

**Q: Customer bisa cancel order?**
A: Customer hubungi CS. Admin bisa ubah status ke `cancelled` di dashboard.

**Q: Bagaimana jika worker tidak responsif?**
A: Lead bisa re-assign order ke worker lain melalui dashboard Lead.

---

*Dokumen ini adalah panduan operasional resmi ETNYX. Update terakhir: 14 April 2026.*
