-- =============================================
-- ETNYX Database Schema V17 - Dual Payment (Auto + Manual Transfer)
-- Run this in Supabase SQL Editor AFTER v16
-- =============================================

-- 1) Add payment_method column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'midtrans';
-- Values: 'midtrans' (auto) | 'manual_transfer' (manual)

-- 2) Payment proofs table for manual transfer
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sender_name TEXT,
  sender_bank TEXT,
  amount BIGINT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_order_id ON payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);

-- 3) Add bank_accounts setting (admin will configure via dashboard)
-- This uses the existing settings table
INSERT INTO settings (key, value) VALUES ('bank_accounts', '[
  {"bank": "BCA", "category": "bank", "account_number": "", "account_name": "", "is_active": true},
  {"bank": "BRI", "category": "bank", "account_number": "", "account_name": "", "is_active": true},
  {"bank": "BNI", "category": "bank", "account_number": "", "account_name": "", "is_active": true},
  {"bank": "Mandiri", "category": "bank", "account_number": "", "account_name": "", "is_active": true},
  {"bank": "Jago", "category": "bank", "account_number": "", "account_name": "", "is_active": true},
  {"bank": "DANA", "category": "ewallet", "account_number": "081414131321", "account_name": "", "is_active": true},
  {"bank": "GoPay", "category": "ewallet", "account_number": "081414131321", "account_name": "", "is_active": true},
  {"bank": "OVO", "category": "ewallet", "account_number": "081414131321", "account_name": "", "is_active": true},
  {"bank": "ShopeePay", "category": "ewallet", "account_number": "081414131321", "account_name": "", "is_active": true},
  {"bank": "LinkAja", "category": "ewallet", "account_number": "081414131321", "account_name": "", "is_active": true},
  {"bank": "QRIS", "category": "qris", "account_number": "", "account_name": "", "is_active": true}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4) Create storage bucket for payment proofs (run in Supabase Dashboard > Storage)
-- CREATE POLICY for public read on payment-proofs bucket
-- Note: You need to create the 'payment-proofs' bucket manually in Supabase Storage

-- 5) RLS policies
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API uses service role)
CREATE POLICY "Service role full access on payment_proofs"
  ON payment_proofs FOR ALL
  USING (true)
  WITH CHECK (true);
