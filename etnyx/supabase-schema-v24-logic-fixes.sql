-- ============================================================
-- Migration v24: Logic Bug Fixes
-- 1. Atomic promo code usage (try_use_promo_code RPC)
-- 2. Tier discount storage (new columns on orders)
-- ============================================================

-- 1. Atomic promo code usage RPC
-- Only increments used_count if still under max_uses (single atomic UPDATE)
-- Returns TRUE if successfully claimed a slot, FALSE if exhausted
CREATE OR REPLACE FUNCTION try_use_promo_code(p_promo_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE promo_codes
  SET used_count = used_count + 1
  WHERE id = p_promo_id
    AND (max_uses IS NULL OR used_count < max_uses)
  RETURNING 1 INTO v_updated;

  RETURN v_updated IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add tier discount columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tier_discount BIGINT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tier_name TEXT;
