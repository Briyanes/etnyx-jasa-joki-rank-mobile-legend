-- ============================================
-- ETNYX Admin Audit Log Schema (v11)
-- Run this in Supabase SQL Editor
-- ============================================

-- Admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,       -- create, update, delete, login, logout, view_credentials, export_data, upload, settings_change
  resource_type TEXT NOT NULL, -- order, testimonial, portfolio, promo_code, booster, reward_catalog, reward_redemption, staff, settings, auth, file
  resource_id TEXT,           -- ID of the affected resource
  details TEXT,               -- Human-readable description
  old_value TEXT,             -- Previous value (JSON or text)
  new_value TEXT,             -- New value (JSON or text)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON admin_audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

-- RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_audit_log"
  ON admin_audit_log FOR ALL
  USING (true)
  WITH CHECK (true);
