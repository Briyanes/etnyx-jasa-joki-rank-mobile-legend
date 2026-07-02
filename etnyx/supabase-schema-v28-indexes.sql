-- ============================================
-- ETNYX — DATABASE INDEXES MIGRATION (v28)
-- ============================================
-- PURPOSE: Add performance indexes on critical query columns.
--          Uses DO $$ blocks to safely skip tables that don't exist.
--          Safe to run multiple times.
--
-- RUN THIS IN: Supabase Dashboard -> SQL Editor -> Run
-- ============================================

-- ============================================
-- ORDERS TABLE — most queried table
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_updated_at ON orders (status, updated_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);

-- assigned_worker_id / assigned_staff_id column name varies — try both safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_worker_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_assigned_worker ON orders (assigned_worker_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_staff_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff ON orders (assigned_staff_id);
  END IF;
END $$;

-- ============================================
-- PAYMENT PROOFS TABLE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_proofs') THEN
    CREATE INDEX IF NOT EXISTS idx_payment_proofs_order_id ON payment_proofs (order_id);
  END IF;
END $$;

-- ============================================
-- STAFF USERS TABLE (workers/admins)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_users' AND column_name = 'email') THEN
    CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users (email);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_users' AND column_name = 'role') THEN
    CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users (role);
  END IF;
END $$;

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'phone') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
  END IF;
END $$;

-- ============================================
-- REVIEWS TABLE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews (order_id);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_approved') THEN
      CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews (is_approved);
    END IF;
  END IF;
END $$;

-- ============================================
-- PROMO CODES TABLE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promo_codes') THEN
    CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes (code);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promo_codes' AND column_name = 'is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes (is_active);
    END IF;
  END IF;
END $$;

-- ============================================
-- SETTINGS TABLE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings (key);
  END IF;
END $$;

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'order_id') THEN
    CREATE INDEX IF NOT EXISTS idx_chat_messages_order_id ON chat_messages (order_id);
  END IF;
END $$;

-- ============================================
-- ORDER ASSIGNMENTS TABLE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_assignments') THEN
    CREATE INDEX IF NOT EXISTS idx_order_assignments_order_id ON order_assignments (order_id);
  END IF;
END $$;

-- ============================================
-- AD SPEND TABLE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_spend') THEN
    CREATE INDEX IF NOT EXISTS idx_ad_spend_date ON ad_spend (date);
  END IF;
END $$;

-- ============================================
-- NOTIFICATION LOGS TABLE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_logs' AND column_name = 'order_id') THEN
    CREATE INDEX IF NOT EXISTS idx_notification_logs_order_id ON notification_logs (order_id);
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERY (uncomment to confirm)
-- ============================================
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;