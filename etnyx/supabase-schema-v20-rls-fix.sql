-- ============================================================
-- ETNYX v20 — Enable RLS on unprotected tables
-- Run this in Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- 1. password_resets (CRITICAL — contains reset tokens)
ALTER TABLE IF EXISTS password_resets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on password_resets" ON password_resets;
CREATE POLICY "Service role full access on password_resets" ON password_resets
  FOR ALL USING (true) WITH CHECK (true);

-- 2. chat_messages (MEDIUM — contains conversation data)
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on chat_messages" ON chat_messages;
CREATE POLICY "Service role full access on chat_messages" ON chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- 3. referrals (MEDIUM — contains referral relationships)
ALTER TABLE IF EXISTS referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on referrals" ON referrals;
CREATE POLICY "Service role full access on referrals" ON referrals
  FOR ALL USING (true) WITH CHECK (true);

-- 4. reviews (MEDIUM — contains customer reviews)
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on reviews" ON reviews;
CREATE POLICY "Service role full access on reviews" ON reviews
  FOR ALL USING (true) WITH CHECK (true);
-- Allow public read for approved reviews
DROP POLICY IF EXISTS "Public can read approved reviews" ON reviews;
CREATE POLICY "Public can read approved reviews" ON reviews
  FOR SELECT USING (status = 'approved');

-- 5. portfolio (LOW — contains portfolio items)
ALTER TABLE IF EXISTS portfolio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on portfolio" ON portfolio;
CREATE POLICY "Service role full access on portfolio" ON portfolio
  FOR ALL USING (true) WITH CHECK (true);
-- Allow public read for active portfolio items
DROP POLICY IF EXISTS "Public can read active portfolio" ON portfolio;
CREATE POLICY "Public can read active portfolio" ON portfolio
  FOR SELECT USING (is_active = true);

-- 6. push_subscriptions (LOW — contains push notification subscriptions)
ALTER TABLE IF EXISTS push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on push_subscriptions" ON push_subscriptions;
CREATE POLICY "Service role full access on push_subscriptions" ON push_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- 7. promo_usage (LOW — contains promo usage tracking)
ALTER TABLE IF EXISTS promo_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on promo_usage" ON promo_usage;
CREATE POLICY "Service role full access on promo_usage" ON promo_usage
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Create decrement_promo_used_count RPC (fix for promo race condition revert)
CREATE OR REPLACE FUNCTION decrement_promo_used_count(p_promo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE promo_codes
  SET used_count = GREATEST(0, used_count - 1)
  WHERE id = p_promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
