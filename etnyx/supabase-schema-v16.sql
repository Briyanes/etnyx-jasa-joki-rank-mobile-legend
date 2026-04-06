-- =============================================
-- ETNYX Database Schema V16 - Lead-Worker Team Hierarchy
-- Run this in Supabase SQL Editor AFTER v15
-- =============================================

-- Add lead_id column to staff_users (FK to self)
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES staff_users(id) ON DELETE SET NULL;

-- Index for team queries
CREATE INDEX IF NOT EXISTS idx_staff_users_lead_id ON staff_users(lead_id);

-- Ensure only workers can have a lead_id (constraint)
-- Workers can belong to a lead, leads/admins should not have lead_id
ALTER TABLE staff_users ADD CONSTRAINT chk_lead_id_only_workers
  CHECK (
    (role = 'worker') OR (lead_id IS NULL)
  );
