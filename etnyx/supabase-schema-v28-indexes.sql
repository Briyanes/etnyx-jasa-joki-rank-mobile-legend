-- ============================================
-- ETNYX — DATABASE INDEXES MIGRATION (v28)
-- ============================================
-- PURPOSE: Add performance indexes on critical query columns.
--          These are CREATE INDEX IF NOT EXISTS — safe to run multiple times.
--
-- RUN THIS IN: Supabase Dashboard → SQL Editor → Run
-- ============================================

-- ============================================
-- ORDERS TABLE — most queried table
-- ============================================

-- Lookup by order_id (customer tracking, payment, notifications)
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders (order_id);

-- Filter by status (dashboard, cron, stats)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- Composite: status + created_at (cron queries: pending > 24h, etc.)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at);

-- Composite: status + updated_at (stale order detection)
CREATE INDEX IF NOT EXISTS idx_orders_status_updated_at ON orders (status, updated_at);

-- Filter by assigned_worker_id (worker dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_assigned_worker ON orders (assigned_worker_id);

-- Composite: status + assigned_worker (worker active orders)
CREATE INDEX IF NOT EXISTS idx_orders_worker_status ON orders (assigned_worker_id, status);

-- ============================================
-- PAYMENT PROOFS TABLE
-- ============================================

-- Lookup by order_id (payment verification)
CREATE INDEX IF NOT EXISTS idx_payment_proofs_order_id ON payment_proofs (order_id);

-- ============================================
-- WORKERS / STAFF TABLE
-- ============================================

-- Login lookup by email
CREATE INDEX IF NOT EXISTS idx_workers_email ON workers (email);

-- Filter by role (admin dashboard staff list)
CREATE INDEX IF NOT EXISTS idx_workers_role ON workers (role);

-- ============================================
-- REVIEWS TABLE
-- ============================================

-- Lookup by order_id (review check in cron)
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews (order_id);

-- Filter by is_approved (public testimonials display)
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews (is_approved);

-- ============================================
-- PROMO CODES TABLE
-- ============================================

-- Lookup by code (discount validation)
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes (code);

-- Filter by is_active + expires_at (cron auto-expire)
CREATE INDEX IF NOT EXISTS idx_promo_codes_active_expires ON promo_codes (is_active, expires_at);

-- ============================================
-- SETTINGS TABLE
-- ============================================

-- Lookup by key (app settings)
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings (key);

-- ============================================
-- WHATSAPP MESSAGES TABLE (if exists)
-- ============================================

-- Lookup by order_id (message history)
CREATE INDEX IF NOT EXISTS idx_wa_messages_order_id ON whatsapp_messages (order_id);

-- ============================================
-- AD METRICS TABLE (if exists)
-- ============================================

-- Lookup by date (ads dashboard)
CREATE INDEX IF NOT EXISTS idx_ad_metrics_date ON ad_metrics (date);

-- ============================================
-- VERIFICATION QUERIES (run to confirm)
-- ============================================
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;