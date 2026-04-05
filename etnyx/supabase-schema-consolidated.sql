-- ============================================================
-- ETNYX Consolidated Database Schema
-- All core tables (v1-v7) that exist in Supabase
-- but were missing from the repository.
--
-- This file documents the FULL schema for reference.
-- For incremental migrations, see:
--   v8  = Storage bucket for portfolio images
--   v9  = Staff users, RBAC, order assignments, worker submissions
--   v10 = Reward system (catalog, transactions, redemptions, referrals)
--   v11 = Admin audit log
--   v12 = Reviews & worker reports
-- ============================================================

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,         -- e.g. ETX-260301-001
  username TEXT NOT NULL,
  game_id TEXT NOT NULL,
  whatsapp TEXT,
  current_rank TEXT NOT NULL,
  target_rank TEXT NOT NULL,
  package TEXT NOT NULL,                 -- e.g. "Paket GM V → Epic V"
  is_express BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  base_price BIGINT NOT NULL DEFAULT 0,
  total_price BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0,
  current_progress_rank TEXT,

  -- Relationships
  customer_id UUID REFERENCES customers(id),
  assigned_worker_id UUID REFERENCES staff_users(id),
  assigned_lead_id UUID REFERENCES staff_users(id),
  booster_id UUID REFERENCES boosters(id),

  -- Payment
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  midtrans_order_id TEXT,
  paid_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ,
  payment_confirmed_by UUID REFERENCES staff_users(id),

  -- Promo
  promo_code TEXT,
  discount_amount BIGINT DEFAULT 0,

  -- Review (added v12)
  review_token UUID DEFAULT gen_random_uuid(),
  review_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============ CUSTOMERS ============
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES customers(id),
  total_orders INTEGER DEFAULT 0,
  total_spent BIGINT DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  reward_tier TEXT DEFAULT 'bronze' CHECK (reward_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  lifetime_points INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ BOOSTERS ============
CREATE TABLE IF NOT EXISTS boosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  rank_specialization TEXT,      -- e.g. "Mythic Glory - Immortal"
  specialization TEXT[],         -- legacy array field
  max_rank TEXT,                 -- legacy field
  is_available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  total_orders INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 100,
  rating NUMERIC DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ORDER LOGS ============
CREATE TABLE IF NOT EXISTS order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,          -- e.g. status_change, note_added, payment_confirmed
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_by TEXT NOT NULL,      -- email of staff who made the change
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ TESTIMONIALS ============
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  rank_from TEXT,
  rank_to TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PORTFOLIO ============
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  rank_from TEXT,
  rank_to TEXT,
  description TEXT,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PROMO CODES ============
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value BIGINT NOT NULL,
  min_order BIGINT DEFAULT 0,
  max_discount BIGINT,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PROMO USAGE ============
CREATE TABLE IF NOT EXISTS promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID REFERENCES promo_codes(id),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  discount_amount BIGINT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SETTINGS (CMS key-value store) ============
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CHAT MESSAGES ============
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin', 'system')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PUSH SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint)
);

-- ============ REFERRALS (v10) ============
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES customers(id),
  referred_id UUID NOT NULL REFERENCES customers(id),
  reward_type TEXT DEFAULT 'discount',
  reward_value BIGINT DEFAULT 0,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- ============ CORE INDEXES ============
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp ON orders(whatsapp);
CREATE INDEX IF NOT EXISTS idx_orders_midtrans_order_id ON orders(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_review_token ON orders(review_token);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON customers(referral_code);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_order ON chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_customer ON push_subscriptions(customer_id);

-- ============ RLS ON CORE TABLES ============
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypass (API routes use service_role key)
CREATE POLICY "Service role full access" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON testimonials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON boosters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON promo_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON order_logs FOR ALL USING (true) WITH CHECK (true);

-- Public read access
CREATE POLICY "Public read testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Public read boosters" ON boosters FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (key = ANY(ARRAY[
  'hero', 'promo_banner', 'faq_items', 'team_members', 'section_visibility',
  'tracking_pixels', 'social_links', 'site_info', 'pricing_catalog',
  'perstar_pricing', 'gendong_pricing'
]));

-- ============ RPC FUNCTIONS ============
-- Atomic promo code counter (prevents race condition)
CREATE OR REPLACE FUNCTION increment_promo_used_count(p_promo_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes SET used_count = used_count + 1 WHERE id = p_promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
