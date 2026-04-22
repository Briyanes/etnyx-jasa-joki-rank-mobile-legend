-- =============================================
-- ETNYX Database Schema V25 - Moota Payment Gateway
-- Jalankan di Supabase SQL Editor SETELAH v24
-- =============================================

-- 1. Tambah kolom Moota ke tabel orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS moota_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS moota_va_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS moota_bank_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_expired_at TIMESTAMPTZ;

-- 2. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_orders_moota_transaction_id ON orders(moota_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_moota_va_number ON orders(moota_va_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_expired ON orders(payment_expired_at);

-- 3. Update payment_method column default (dari midtrans/ipaymu ke manual_transfer)
-- orders.payment_method: 'manual_transfer' | 'moota' | 'midtrans' (legacy) | 'ipaymu' (legacy)
-- Tidak ada CHECK constraint untuk backward compatibility

-- Done! Jalankan setelah deploy kode Moota.
