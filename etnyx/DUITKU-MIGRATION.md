# Migrasi Payment Gateway: DompetX → Duitku

> Hasil audit & implementasi — 9 Maret 2026

## Ringkasan Audit DompetX (temuan utama)

| # | Temuan | Risiko |
|---|--------|--------|
| 1 | Webhook `notification` diverifikasi **header secret statis** (`x-webhook-secret`), bukan signature kriptografis atas body | Tinggi — bisa di-spoof jika secret bocor |
| 2 | Provider aktif tanpa SLA/resmi terdokumentasi (`connect.dompetx.com` / `checkout.dompetx.com` hardcoded) | Tinggi |
| 3 | Tidak ada status-check API aktif (`saldo` saja), recovery bergantung `payment_url` scrape | Sedang |
| 4 | Harga diverifikasi server-side ✅ tapi ID transaksi tidak dipetakan atomik | Sedang |
| 5 | Env var API key ter-embed fallback di kode | Sedang |

## Keputusan: Duitku

**Duitku** dipilih karena: merchant terdaftar resmi, QRIS + VA + e-wallet + retail, **signature MD5 per-callback** (lebih kuat dari shared secret statis), API inquiry/transaction status resmi untuk reconciliation, biaya kompetitif (QRIS ~0,7%), onboarding cepat untuk badan usaha/individual dengan dokumen lengkap.

## Yang Berubah

### Baru
- `src/lib/payments/duitku.ts` — provider layer lengkap: config, signature, create checkout, verify callback, transaction status, test connection
- `src/app/api/payment/callback/route.ts` — callback Duitku (verify MD5 signature `merchantCode+amount+merchantOrderId+apiKey`, amount-match vs DB, idempotent)
- `supabase-schema-v32-duitku-migration.sql` — tabel `payment_callbacks` (audit + idempotency), kolom `gateway_provider`, index, migrasi settings lama
- Cron step 6: **reconciliation** — order pending Duitku >1h dicek langsung via `getDuitkuTransactionStatus`

### Refactor (DompetX → Duitku)
- `api/payment/route.ts` — create checkout via Duitku (response shape sama: `redirect_url`/`transaction_id`)
- `api/customer/order/route.ts` — `payment_method: "duitku"`, `gateway_provider: "duitku"`
- `api/payment-methods` — flag `duitkuEnabled`
- `api/payment/test-connection` — inquiry request params `{merchantCode, apiKey, mode}`
- `api/payment/recover` — recovery via status API resmi
- `api/health` — `checkDuitku()` via `testDuitkuConnection`
- `middleware.ts` — CSP: domain dompetx diganti `sandbox.duitku.com`, `passport.duitku.com`, `www.duitku.com`
- `lib/validation.ts` — terima `"duitku"` (+ `"dompetx"` legacy untuk order lama)
- `SettingsTab.tsx` — fields `duitkuMerchantCode` / `duitkuApiKey` / `duitkuMode` (sandbox/live) + callback URL `/api/payment/callback`
- Semua UI text (order, calculator, manual payment, docs, dashboard, finance, FAQ, refund-policy, WA webhook, notifications) → "Duitku"

### Kompatibilitas Order Lama
- Order lama (`payment_method: "dompetx"`) tetap tampil tombol retry di `/payment/manual` (`.includes("dompetx", "duitku")`)
- Route `notification` lama dipertahankan (menunggu settle order DompetX), jangan dihapus sampai tidak ada order dompetx pending

## Checklist Deploy

1. **Daftar Duitku** → www.duitku.com → dapatkan `Merchant Code` + `API Key` (sandbox dulu)
2. **Jalankan SQL**: `supabase-schema-v32-duitku-migration.sql` di Supabase SQL Editor
3. **Set env di Vercel** (opsional jika pakai dashboard): `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_MODE=sandbox`
4. **Admin Dashboard → Settings → Integrasi**: isi Merchant Code + API Key, mode `sandbox` → **Test Connection**
5. **Uji end-to-end sandbox**: buat order → bayar pakai simulator Duitku → cek order jadi `confirmed/paid` + notifikasi terkirim
6. **Switch mode `live`** di Settings → simpan → deploy production
7. **Verifikasi** `/api/health` → `services.duitku.status: "ok"`
8. Setelah ±72h tidak ada order dompetx pending → hapus `src/app/api/payment/notification/route.ts` & env `DOMPETX_*`

## Verify Checklist Pasca-Deploy

- [ ] Test Connection OK (sandbox & live)
- [ ] Callback: bayar sandbox → order auto-confirmed, WA/TG terkirim, `payment_callbacks` terisi
- [ ] Cron reconciliation: `/api/cron` → `results.duitkuReconciliation` ada
- [ ] Health: `/api/health` status `healthy`
- [ ] Refund manual: Duitku tidak punya refund API untuk semua channel — refund via transfer manual + admin mark di dashboard