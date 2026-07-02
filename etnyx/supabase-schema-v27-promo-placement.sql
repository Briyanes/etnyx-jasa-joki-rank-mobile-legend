-- ============================================
-- Migration: Add show_on_homepage & show_on_bio to promo_codes
-- Version: v27
-- Purpose: Allow granular control of promo visibility per placement
-- ============================================

-- Add new boolean columns with safe defaults (existing promos default to true on both)
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS show_on_homepage boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_on_bio boolean DEFAULT true;

-- Set existing active promos to show on both placements (backward compatible)
UPDATE promo_codes
  SET show_on_homepage = true, show_on_bio = true
  WHERE show_on_homepage IS NULL OR show_on_bio IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN promo_codes.show_on_homepage IS 'Whether this promo appears on the homepage banner';
COMMENT ON COLUMN promo_codes.show_on_bio IS 'Whether this promo appears on the link-in-bio page';

-- Verification query (run manually to verify):
-- SELECT code, is_active, show_on_homepage, show_on_bio FROM promo_codes ORDER BY created_at DESC;