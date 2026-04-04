-- =============================================
-- ETNYX Database Schema V9 - Multi-User RBAC System
-- Run this in Supabase SQL Editor
-- =============================================

-- ============ STAFF USERS TABLE ============
CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'lead', 'worker')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ORDER ASSIGNMENTS TABLE ============
CREATE TABLE IF NOT EXISTS order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES staff_users(id),
  assigned_by UUID REFERENCES staff_users(id),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'reassigned')),
  notes TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(order_id, assigned_to, status)
);

-- ============ WORKER SUBMISSIONS TABLE ============
CREATE TABLE IF NOT EXISTS worker_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES staff_users(id),
  stars_gained INTEGER DEFAULT 0,
  mvp_count INTEGER DEFAULT 0,
  savage_count INTEGER DEFAULT 0,
  maniac_count INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  screenshots TEXT[] DEFAULT '{}',
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_order_assignments_order ON order_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_assignments_worker ON order_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_order_assignments_status ON order_assignments(status);
CREATE INDEX IF NOT EXISTS idx_worker_submissions_order ON worker_submissions(order_id);
CREATE INDEX IF NOT EXISTS idx_worker_submissions_worker ON worker_submissions(worker_id);

-- ============ ADD COLUMNS TO ORDERS (if not exist) ============
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_lead_id UUID REFERENCES staff_users(id);
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_worker_id UUID REFERENCES staff_users(id);
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES staff_users(id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============ RLS POLICIES ============
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_submissions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by API routes)
CREATE POLICY "Service role full access staff_users" ON staff_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access order_assignments" ON order_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access worker_submissions" ON worker_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ STORAGE BUCKET FOR WORKER SCREENSHOTS ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('worker-screenshots', 'worker-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'worker-screenshots');

CREATE POLICY "Staff can view screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'worker-screenshots');

-- ============ SEED DEFAULT ADMIN ============
-- Password: etnyx_admin_2026 (bcrypt hash)
-- You can change this after first login
INSERT INTO staff_users (email, name, password_hash, role)
VALUES (
  'admin@etnyx.com',
  'Admin ETNYX',
  '$2b$12$0kOgw1esyXmc1vtS89pVd.NoY4YYJcJrRPRK2V/i2dVm.ampUDuLe',
  'admin'
) ON CONFLICT (email) DO NOTHING;
