-- ============================================
-- ETNYX Schema v14: Manual Payment Methods
-- Run this AFTER v13 in Supabase SQL Editor
-- ============================================

-- ============ STAFF PAYMENT ACCOUNTS ============
-- Each staff/worker can have multiple payment accounts (Dana, OVO, Bank, etc.)
CREATE TABLE IF NOT EXISTS staff_payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  method TEXT NOT NULL,                   -- 'dana', 'ovo', 'gopay', 'shopeepay', 'bank_bca', 'bank_bri', 'bank_mandiri', 'bank_bni', 'bank_jago', 'bank_seabank', 'cash'
  label TEXT NOT NULL,                    -- Display name: "Dana", "OVO", "BCA", etc.
  account_name TEXT NOT NULL,             -- Nama pemilik rekening
  account_number TEXT NOT NULL,           -- Nomor rekening/HP
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_payment_accounts_staff ON staff_payment_accounts(staff_id);

-- RLS
ALTER TABLE staff_payment_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON staff_payment_accounts FOR ALL USING (true) WITH CHECK (true);

-- ============ ADD PAYMENT COLUMNS TO PAYOUTS ============
-- Payment method & reference for manual transfers
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS payment_method TEXT;          -- 'dana', 'ovo', 'bank_bca', etc.
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS payment_method_label TEXT;    -- 'Dana', 'OVO', 'BCA', etc.
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS payment_reference TEXT;       -- Transaction ID / reference number
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS recipient_account_id UUID REFERENCES staff_payment_accounts(id);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS recipient_info JSONB;         -- Snapshot: {"name": "Dimas", "method": "Dana", "account": "081xxx"}

-- ============ ADD PAYMENT METHODS TO SETTINGS ============
INSERT INTO payroll_settings (key, value) VALUES
  ('payment_methods', '[
    {"id": "dana", "label": "Dana", "icon": "wallet", "type": "ewallet"},
    {"id": "ovo", "label": "OVO", "icon": "wallet", "type": "ewallet"},
    {"id": "gopay", "label": "GoPay", "icon": "wallet", "type": "ewallet"},
    {"id": "shopeepay", "label": "ShopeePay", "icon": "wallet", "type": "ewallet"},
    {"id": "bank_bca", "label": "BCA", "icon": "building", "type": "bank"},
    {"id": "bank_bri", "label": "BRI", "icon": "building", "type": "bank"},
    {"id": "bank_mandiri", "label": "Mandiri", "icon": "building", "type": "bank"},
    {"id": "bank_bni", "label": "BNI", "icon": "building", "type": "bank"},
    {"id": "bank_jago", "label": "Bank Jago", "icon": "building", "type": "bank"},
    {"id": "bank_seabank", "label": "SeaBank", "icon": "building", "type": "bank"},
    {"id": "cash", "label": "Cash", "icon": "banknote", "type": "cash"}
  ]'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
