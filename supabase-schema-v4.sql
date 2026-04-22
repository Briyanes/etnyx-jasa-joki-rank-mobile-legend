-- =============================================
-- ETNYX Database Schema V4 - Moota Payment Gateway
-- Jalankan di Supabase SQL Editor SETELAH v3
-- =============================================

-- 1. Tambah kolom Moota ke tabel orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS moota_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bank_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_expired_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- 2. Tambah kolom paid_at jika belum ada (dari v3)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_type TEXT;

-- 3. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_orders_moota_transaction_id ON orders(moota_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_expired ON orders(payment_expired_at);

-- 4. Pastikan tabel payment_logs ada (dari v3) dengan kolom yang benar
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    midtrans_order_id TEXT, -- dipakai untuk simpan moota uuid juga
    transaction_status TEXT,
    payment_type TEXT,
    gross_amount INTEGER,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on payment_logs" ON payment_logs;
CREATE POLICY "Service role full access on payment_logs" ON payment_logs
    FOR ALL USING (auth.role() = 'service_role');
