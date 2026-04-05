-- ============================================
-- ETNYX Reward System Schema (v10)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add reward columns to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_tier TEXT DEFAULT 'bronze' CHECK (reward_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  ADD COLUMN IF NOT EXISTS lifetime_points INTEGER DEFAULT 0;

-- 2. Reward transactions log
CREATE TABLE IF NOT EXISTS reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'adjust')),
  points INTEGER NOT NULL, -- positive for earn, negative for redeem
  balance_after INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_by TEXT, -- 'system', 'admin', customer name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_reward_transactions_customer ON reward_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_type ON reward_transactions(type);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_created ON reward_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_reward_tier ON customers(reward_tier);
CREATE INDEX IF NOT EXISTS idx_customers_reward_points ON customers(reward_points DESC);

-- 4. RPC: Award points on order completion
CREATE OR REPLACE FUNCTION award_reward_points(
  p_customer_id UUID,
  p_order_id UUID,
  p_order_amount INTEGER,
  p_description TEXT DEFAULT 'Poin dari order selesai'
)
RETURNS TABLE (
  points_earned INTEGER,
  new_balance INTEGER,
  new_tier TEXT,
  tier_changed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points INTEGER;
  v_current_tier TEXT;
  v_new_tier TEXT;
  v_new_balance INTEGER;
  v_lifetime INTEGER;
  v_tier_changed BOOLEAN := FALSE;
BEGIN
  -- Calculate points: 1 point per Rp 10,000
  v_points := GREATEST(1, p_order_amount / 10000);

  -- Check for duplicate award (idempotent)
  IF EXISTS (
    SELECT 1 FROM reward_transactions
    WHERE customer_id = p_customer_id
      AND order_id = p_order_id
      AND type = 'earn'
  ) THEN
    -- Already awarded, return current state
    SELECT reward_points, reward_tier, lifetime_points
    INTO v_new_balance, v_new_tier, v_lifetime
    FROM customers WHERE id = p_customer_id;

    RETURN QUERY SELECT 0, v_new_balance, v_new_tier, FALSE;
    RETURN;
  END IF;

  -- Get current tier
  SELECT reward_tier INTO v_current_tier
  FROM customers WHERE id = p_customer_id;

  -- Update customer points
  UPDATE customers
  SET reward_points = reward_points + v_points,
      lifetime_points = lifetime_points + v_points,
      updated_at = NOW()
  WHERE id = p_customer_id
  RETURNING reward_points, lifetime_points, reward_tier
  INTO v_new_balance, v_lifetime, v_new_tier;

  -- Calculate new tier based on lifetime points
  v_new_tier := CASE
    WHEN v_lifetime >= 2500 THEN 'platinum'
    WHEN v_lifetime >= 1000 THEN 'gold'
    WHEN v_lifetime >= 500 THEN 'silver'
    ELSE 'bronze'
  END;

  v_tier_changed := (v_current_tier IS DISTINCT FROM v_new_tier);

  -- Update tier if changed
  IF v_tier_changed THEN
    UPDATE customers SET reward_tier = v_new_tier WHERE id = p_customer_id;
  END IF;

  -- Log transaction
  INSERT INTO reward_transactions (customer_id, type, points, balance_after, description, order_id, created_by)
  VALUES (p_customer_id, 'earn', v_points, v_new_balance, p_description, p_order_id, 'system');

  RETURN QUERY SELECT v_points, v_new_balance, v_new_tier, v_tier_changed;
END;
$$;

-- 5. RPC: Redeem points for discount
CREATE OR REPLACE FUNCTION redeem_reward_points(
  p_customer_id UUID,
  p_points INTEGER,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Tukar poin untuk diskon'
)
RETURNS TABLE (
  success BOOLEAN,
  discount_amount INTEGER,
  remaining_points INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_points INTEGER;
  v_discount INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Validate minimum redeem
  IF p_points < 100 THEN
    RETURN QUERY SELECT FALSE, 0, 0, 'Minimum redeem 100 poin'::TEXT;
    RETURN;
  END IF;

  -- Get current points with row lock
  SELECT reward_points INTO v_current_points
  FROM customers WHERE id = p_customer_id
  FOR UPDATE;

  IF v_current_points IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 0, 'Customer tidak ditemukan'::TEXT;
    RETURN;
  END IF;

  IF v_current_points < p_points THEN
    RETURN QUERY SELECT FALSE, 0, v_current_points, 'Poin tidak cukup'::TEXT;
    RETURN;
  END IF;

  -- Calculate discount: 1 point = Rp 100
  v_discount := p_points * 100;

  -- Deduct points
  UPDATE customers
  SET reward_points = reward_points - p_points,
      updated_at = NOW()
  WHERE id = p_customer_id
  RETURNING reward_points INTO v_new_balance;

  -- Log transaction
  INSERT INTO reward_transactions (customer_id, type, points, balance_after, description, order_id, created_by)
  VALUES (p_customer_id, 'redeem', -p_points, v_new_balance, p_description, p_order_id, 'system');

  RETURN QUERY SELECT TRUE, v_discount, v_new_balance, ('Berhasil tukar ' || p_points || ' poin untuk diskon ' || v_discount)::TEXT;
END;
$$;

-- 6. RPC: Admin adjust points
CREATE OR REPLACE FUNCTION admin_adjust_reward_points(
  p_customer_id UUID,
  p_points INTEGER, -- positive to add, negative to deduct
  p_description TEXT,
  p_admin_name TEXT
)
RETURNS TABLE (
  new_balance INTEGER,
  new_tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
  v_lifetime INTEGER;
  v_new_tier TEXT;
  v_type TEXT;
BEGIN
  v_type := CASE WHEN p_points >= 0 THEN 'bonus' ELSE 'adjust' END;

  -- Update points (never go below 0)
  UPDATE customers
  SET reward_points = GREATEST(0, reward_points + p_points),
      lifetime_points = CASE WHEN p_points > 0 THEN lifetime_points + p_points ELSE lifetime_points END,
      updated_at = NOW()
  WHERE id = p_customer_id
  RETURNING reward_points, lifetime_points INTO v_new_balance, v_lifetime;

  -- Recalculate tier
  v_new_tier := CASE
    WHEN v_lifetime >= 2500 THEN 'platinum'
    WHEN v_lifetime >= 1000 THEN 'gold'
    WHEN v_lifetime >= 500 THEN 'silver'
    ELSE 'bronze'
  END;

  UPDATE customers SET reward_tier = v_new_tier WHERE id = p_customer_id;

  -- Log
  INSERT INTO reward_transactions (customer_id, type, points, balance_after, description, created_by)
  VALUES (p_customer_id, v_type, p_points, v_new_balance, p_description, p_admin_name);

  RETURN QUERY SELECT v_new_balance, v_new_tier;
END;
$$;

-- 7. RLS
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on reward_transactions"
  ON reward_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Initialize existing customers (backfill based on completed orders)
-- Run this ONCE after creating the schema
DO $$
DECLARE
  rec RECORD;
  v_points INTEGER;
  v_tier TEXT;
BEGIN
  FOR rec IN
    SELECT c.id, COALESCE(SUM(o.total_price), 0) AS total_completed
    FROM customers c
    LEFT JOIN orders o ON o.whatsapp = c.whatsapp AND o.status = 'completed'
    GROUP BY c.id
    HAVING COALESCE(SUM(o.total_price), 0) > 0
  LOOP
    v_points := GREATEST(1, rec.total_completed / 10000);
    v_tier := CASE
      WHEN v_points >= 2500 THEN 'platinum'
      WHEN v_points >= 1000 THEN 'gold'
      WHEN v_points >= 500 THEN 'silver'
      ELSE 'bronze'
    END;

    UPDATE customers
    SET reward_points = v_points,
        lifetime_points = v_points,
        reward_tier = v_tier
    WHERE id = rec.id
      AND reward_points = 0; -- Only backfill if not already set

    IF v_points > 0 THEN
      INSERT INTO reward_transactions (customer_id, type, points, balance_after, description, created_by)
      VALUES (rec.id, 'bonus', v_points, v_points, 'Backfill poin dari order sebelumnya', 'system')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
