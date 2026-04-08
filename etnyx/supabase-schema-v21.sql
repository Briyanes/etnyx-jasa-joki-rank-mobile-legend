-- Migration v21: Notification preferences + Customer activity log + Order SLA
-- Run this in Supabase SQL Editor

-- 1. Notification preferences per customer
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
  email_order_updates BOOLEAN DEFAULT TRUE,
  email_promotions BOOLEAN DEFAULT TRUE,
  whatsapp_order_updates BOOLEAN DEFAULT TRUE,
  whatsapp_promotions BOOLEAN DEFAULT FALSE,
  push_order_updates BOOLEAN DEFAULT TRUE,
  push_promotions BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer activity log
CREATE TABLE IF NOT EXISTS customer_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- login, logout, profile_update, password_change, order_created, reward_redeemed
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_activity_customer ON customer_activity_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_created ON customer_activity_log(created_at DESC);

-- 3. Order SLA tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sla_reminded BOOLEAN DEFAULT FALSE;

-- RLS Policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activity_log ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access notification_preferences" ON notification_preferences
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access customer_activity_log" ON customer_activity_log
  FOR ALL USING (true) WITH CHECK (true);
