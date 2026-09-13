# AGENTS.md — ETNYX / Jasa Jokie Mobile Legend

> Panduan untuk AI agent yang bekerja di repo ini.
> Sumber: audit sistem 14 Sep 2026. Ganti AGENTS.md boilerplate lama (isi lama dipertahankan di bawah).

## Project

**ETNYX** — jasa joki rank Mobile Legend: landing, checkout, pembayaran, tracking, admin.
Repo GitHub: `Briyanes/etnyx-jasa-joki-rank-mobile-legend` (private). Deploy: Vercel (etnyx.com).

## Stack

- Next.js 16.2 + React 19 + TypeScript 5 + Tailwind 4
- Supabase (auth + DB)
- **Duitku** — payment gateway (baru dimigrasi dari DompetX, 3 Sep 2026; lihat `etnyx/DUITKU-MIGRATION.md`)

## Struktur penting

- `src/app/(customer)/` — flow customer: pilih paket → checkout → bayar → track
- `src/app/admin/` — panel operasional order
- `src/app/api/` — route handlers (payment webhook Duitku di sini)
- `etnyx/` — **pusat aset brand & marketing**: 90-day plan (3 bulan), Brand Brief, Meta Ads Strategy, Google Ads Master Reference, Instagram 9-Post Grid, 8+ script Reels, System Guide
- `etnyx.worktrees/` — worktree lama, jangan disentuh

## Aturan kerja

1. **Area sensitif: pembayaran.** Perubahan di `src/app/api/payment*` atau webhook Duitku wajib diuji dengan amount kecil + lihat `DUITKU-MIGRATION.md` untuk gotcha 404+JSON transactionStatus.
2. Kerja marketing ETNYX (campaign, konten, strategi 90-day) → koordinasi dengan agent Hadona Ads Ops; semua aset strategi ada di `etnyx/`.
3. Conventional Commits bahasa Inggris (`fix(payments): ...`, `feat: ...`).
4. Push ke main = production etnyx.com. Eksperimen → branch.
5. `.env.local` tidak masuk git.

## Riwayat singkat

- Sep 2026: migrasi DompetX → Duitku + hardening setelah deep audit
- Agu 2026: fix ban-customer & game_id parsing

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
