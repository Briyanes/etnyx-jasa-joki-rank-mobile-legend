-- filepath: /Users/mac/VSC Project/Jasa Jokie Mobile Legend/etnyx/supabase-schema-v3.sql
-- =============================================
-- ETNYX Database Schema V3 - Payment & Verification
-- Run this in Supabase SQL Editor AFTER v2
-- =============================================

-- =============================================
-- 1. ADD PAYMENT COLUMNS TO ORDERS
-- =============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_token TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- =============================================
-- 2. ADD VERIFICATION COLUMNS TO CUSTOMERS
-- =============================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- =============================================
-- 3. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_orders_midtrans_id ON orders(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_customers_verification ON customers(verification_token);

-- =============================================
-- 4. UPDATE BOOSTERS TABLE (if not exists)
-- =============================================
CREATE TABLE IF NOT EXISTS boosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    rank_specialization TEXT DEFAULT 'All Ranks',
    is_available BOOLEAN DEFAULT TRUE,
    total_orders INTEGER DEFAULT 0,
    rating NUMERIC(2,1) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE boosters ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Service role full access on boosters" ON boosters;

-- Service role full access
CREATE POLICY "Service role full access on boosters" ON boosters FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 5. SAMPLE BOOSTERS DATA
-- =============================================
INSERT INTO boosters (name, whatsapp, rank_specialization, is_available, total_orders, rating) VALUES
    ('Agus Pro', '628123456781', 'Mythic Glory', true, 150, 4.9),
    ('Budi Gaming', '628123456782', 'Legend - Mythic', true, 89, 4.8),
    ('Citra ML', '628123456783', 'All Ranks', true, 234, 5.0),
    ('Dani Booster', '628123456784', 'Epic - Legend', false, 67, 4.7)
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. PAYMENT LOGS TABLE (Optional)
-- =============================================
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    midtrans_order_id TEXT,
    transaction_status TEXT,
    payment_type TEXT,
    gross_amount INTEGER,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on payment_logs" ON payment_logs;
CREATE POLICY "Service role full access on payment_logs" ON payment_logs FOR ALL USING (auth.role() = 'service_role');
