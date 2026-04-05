-- ============================================
-- ETNYX Schema v13: Payroll & Commission System
-- Run this in Supabase SQL Editor
-- ============================================

-- ============ PAYROLL SETTINGS ============
-- Global payroll configuration
CREATE TABLE IF NOT EXISTS payroll_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO payroll_settings (key, value) VALUES
  ('commission', '{
    "worker_rate": 0.60,
    "company_rate": 0.40,
    "base_on": "total_price",
    "bonus_tiers": [
      {"name": "High Winrate", "condition": "winrate_above_90", "bonus_rate": 0.05},
      {"name": "10 Orders/Month", "condition": "orders_10_month", "bonus_amount": 50000},
      {"name": "20 Orders/Month", "condition": "orders_20_month", "bonus_amount": 150000},
      {"name": "30 Orders/Month", "condition": "orders_30_month", "bonus_amount": 300000}
    ]
  }'::jsonb),
  ('payout_cycle', '{
    "worker": "biweekly",
    "staff": "monthly",
    "biweekly_days": [1, 16],
    "monthly_day": 28
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ============ STAFF SALARIES ============
-- Monthly salary config per staff member
CREATE TABLE IF NOT EXISTS staff_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  base_salary BIGINT NOT NULL DEFAULT 0,
  allowances JSONB DEFAULT '[]'::jsonb,  -- [{"name": "Transport", "amount": 200000}]
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,                      -- NULL = currently active
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, effective_from)
);

-- ============ COMMISSIONS ============
-- Per-order commission records for workers
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_code TEXT NOT NULL,               -- ETX-260301-001 (denormalized for display)
  worker_id UUID NOT NULL REFERENCES staff_users(id),
  
  -- Calculation
  order_total BIGINT NOT NULL,            -- total_price of the order
  commission_rate NUMERIC NOT NULL,       -- e.g. 0.60
  commission_amount BIGINT NOT NULL,      -- order_total * rate
  bonus_amount BIGINT DEFAULT 0,          -- performance bonus
  bonus_details JSONB DEFAULT '[]'::jsonb, -- [{"name":"High Winrate","amount":25000}]
  total_amount BIGINT NOT NULL,           -- commission + bonus
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  period_start DATE,                      -- bi-weekly period start
  period_end DATE,                        -- bi-weekly period end
  payout_id UUID,                         -- linked when included in a payout
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, worker_id)
);

-- ============ SALARY RECORDS ============
-- Monthly salary payment records
CREATE TABLE IF NOT EXISTS salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_users(id),
  salary_config_id UUID REFERENCES staff_salaries(id),
  
  -- Period
  period_month INTEGER NOT NULL,          -- 1-12
  period_year INTEGER NOT NULL,
  
  -- Amounts
  base_salary BIGINT NOT NULL,
  allowances_total BIGINT DEFAULT 0,
  deductions BIGINT DEFAULT 0,
  deduction_notes TEXT,
  bonus_amount BIGINT DEFAULT 0,
  bonus_notes TEXT,
  total_amount BIGINT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  payout_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, period_month, period_year)
);

-- ============ PAYOUTS ============
-- Payout batches with approval workflow
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_code TEXT UNIQUE NOT NULL,       -- PAY-202604-001
  type TEXT NOT NULL CHECK (type IN ('commission', 'salary', 'mixed')),
  
  -- Period
  period_label TEXT NOT NULL,             -- "1-15 Apr 2026" or "April 2026"
  period_start DATE,
  period_end DATE,
  
  -- Amounts
  total_amount BIGINT NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  
  -- Workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'paid', 'cancelled')),
  created_by TEXT NOT NULL,               -- admin email
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  payment_proof TEXT,                     -- screenshot/reference
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PAYOUT ITEMS ============
-- Individual items in a payout
CREATE TABLE IF NOT EXISTS payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_users(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('commission', 'salary', 'bonus')),
  reference_id UUID,                      -- commission.id or salary_record.id
  amount BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_commissions_worker ON commissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_period ON commissions(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_commissions_payout ON commissions(payout_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_staff ON salary_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_period ON salary_records(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_salary_records_payout ON salary_records(payout_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_type ON payouts(type);
CREATE INDEX IF NOT EXISTS idx_payouts_created ON payouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_items_payout ON payout_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_staff ON payout_items(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_salaries_staff ON staff_salaries(staff_id);

-- ============ RLS ============
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON payroll_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON staff_salaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON commissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON salary_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON payouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON payout_items FOR ALL USING (true) WITH CHECK (true);

-- ============ HELPER FUNCTION ============
-- Get current bi-weekly period boundaries
CREATE OR REPLACE FUNCTION get_biweekly_period(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(period_start DATE, period_end DATE, period_label TEXT) AS $$
BEGIN
  IF EXTRACT(DAY FROM target_date) <= 15 THEN
    period_start := DATE_TRUNC('month', target_date)::DATE;
    period_end := (DATE_TRUNC('month', target_date) + INTERVAL '14 days')::DATE;
    period_label := '1-15 ' || TO_CHAR(target_date, 'Mon YYYY');
  ELSE
    period_start := (DATE_TRUNC('month', target_date) + INTERVAL '15 days')::DATE;
    period_end := (DATE_TRUNC('month', target_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    period_label := '16-' || EXTRACT(DAY FROM (DATE_TRUNC('month', target_date) + INTERVAL '1 month' - INTERVAL '1 day'))::TEXT || ' ' || TO_CHAR(target_date, 'Mon YYYY');
  END IF;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- Generate next payout code
CREATE OR REPLACE FUNCTION generate_payout_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  seq INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM payouts
  WHERE created_at >= DATE_TRUNC('month', NOW());
  
  code := 'PAY-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN code;
END;
$$ LANGUAGE plpgsql;
