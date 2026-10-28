# Admin Security Checklist & Ops Guide

> Dibuat 28 Okt 2026 setelah audit arsitektur auth + verifikasi dokumentasi Vercel.

## 1. Peta Akses (3 sistem auth terisolasi)

| Area | URL | Auth | Catatan |
|---|---|---|---|
| Storefront | `etnyx.com` (/, /order, /calculator, /track) | publik | Order tanpa login |
| Customer | `/login`, `/register`, `/dashboard` | Supabase Auth | Tabel `customers` |
| Admin | `/admin` → `/admin/dashboard`, `/admin/finance` | Custom JWT (`admin_token`, `ADMIN_JWT_SECRET` ≥32 char, bcrypt, rate-limit 429) | Kredensial dari env `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` |
| Worker | `/admin/worker` | Staff auth (`/api/staff/auth`, role `worker`) | Akun dibuat admin |
| Lead | `/admin/lead` | Staff auth (role `lead`) | Assign order ke worker |

Sudah ada: rate-limit ketat di 3 auth route (middleware) · cache banned-IP di edge · RLS DB · robots.txt blokir `/admin/` & `/api/`.

## 2. REKOMENDASI: Vercel Firewall Challenge untuk `/admin*`

**PENTING:** `vercel.json` TIDAK mendukung key `firewall` (diverifikasi docs Vercel Agustus 2026). Rule dibuat di **Dashboard** atau via **REST API** — bukan lewat repo.

### Cara setup via Dashboard (±5 menit, Vercel Pro)

1. Buka https://vercel.com → project **etnyx** → tab **Settings → Firewall** (atau menu **Firewall** di sidebar project)
2. **Add Rule** / **Create Rule**, isi:
   - **Name:** `Admin shield`
   - **If incoming requests match:** `Path` `matches the pattern` `/admin*`
   - **Then take action:** `Vercel Challenge` (bukan Deny / bukan IP-allowlist — IP rumah dinamis, Deny/allowlist berisiko lockout)
3. Save. Rule berlaku untuk semua deployment (production + preview).

**Efek:** bot/scanner yang probe `/admin` dihentikan Vercel di edge (challenge JS); manusia (Anda) lolos otomatis & tak terasa.

**Kenapa TIDAK include `/api/admin/*`:** panel admin memanggil API via fetch dari browser — challenge di path API bisa mengacaukan respons JSON. Halaman `/admin*` cukup; API tetap dilindungi auth JWT + rate-limit.

### Opsi ketat tambahan (nanti, opsional)
Setelah yakin IP Anda stabil: duplikat rule dengan action `Allow only from IP <IP-anda>` + `Deny` lainnya. Simpan IP backup (HP tethering) supaya tidak terkunci.

## 3. Jalur REST API (kalau mau di-otomasi)

Buat token di https://vercel.com/account/tokens (scope: project etnyx, Full Account tidak perlu), lalu rule bisa dibuat via:

```
PUT /v1/security/firewall/config   (API Vercel — Firewall Config)
```

Dokumentasi: https://vercel.com/docs/rest-api/reference#firewall — atau minta agent (Cline) mengeksekusinya dengan token tersebut.

## 4. Rotasi & Recovery

- Lupa password admin → set ulang `ADMIN_PASSWORD_HASH` (bcrypt) di Vercel env → redeploy
- Rotasi `ADMIN_JWT_SECRET` → semua sesi admin logout (aman, customer tidak terdampak)
- Lockout Firewall → edit/hapus rule di dashboard (akses dashboard Vercel tidak lewat firewall project)
