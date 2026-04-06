-- =============================================
-- ETNYX Database Schema V15 - UTM Attribution & Ad Spend Tracking
-- Run this in Supabase SQL Editor AFTER v14
-- =============================================

-- Add UTM attribution fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_source TEXT;       -- google, meta, tiktok, direct, organic
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_medium TEXT;       -- cpc, cpm, social, email
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_campaign TEXT;     -- campaign name
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_content TEXT;      -- ad creative variant
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_term TEXT;         -- keyword (search ads)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fbclid TEXT;           -- Facebook click ID
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gclid TEXT;            -- Google click ID
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ttclid TEXT;           -- TikTok click ID
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referrer_url TEXT;     -- HTTP referrer

-- Index for attribution queries
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON orders(utm_source);
CREATE INDEX IF NOT EXISTS idx_orders_utm_campaign ON orders(utm_campaign);

-- Ad Spend table for manual spend input per campaign
CREATE TABLE IF NOT EXISTS ad_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'other')),
  campaign_name TEXT,
  ad_set_name TEXT,
  spend BIGINT NOT NULL DEFAULT 0,           -- IDR amount spent
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for spend queries
CREATE INDEX IF NOT EXISTS idx_ad_spend_date ON ad_spend(date);
CREATE INDEX IF NOT EXISTS idx_ad_spend_platform ON ad_spend(platform);
CREATE INDEX IF NOT EXISTS idx_ad_spend_date_platform ON ad_spend(date, platform);

-- RLS for ad_spend
ALTER TABLE ad_spend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access ad_spend" ON ad_spend FOR ALL USING (true) WITH CHECK (true);
