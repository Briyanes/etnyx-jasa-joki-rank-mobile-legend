-- ==========================================
-- ETNYX Schema v12: Reviews & Worker Reports
-- ==========================================

-- Reviews table (linked to orders)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  
  -- Service review
  service_rating INT NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
  service_comment TEXT,
  
  -- Worker review
  worker_id UUID REFERENCES staff_users(id),
  worker_rating INT CHECK (worker_rating BETWEEN 1 AND 5),
  worker_comment TEXT,
  
  -- Worker report (optional)
  has_worker_report BOOLEAN DEFAULT FALSE,
  report_type TEXT CHECK (report_type IN ('cheating', 'offering_services', 'rude', 'account_issue', 'other')),
  report_detail TEXT,
  report_status TEXT DEFAULT 'pending' CHECK (report_status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  
  -- Display
  customer_name TEXT,
  customer_whatsapp TEXT,
  rank_from TEXT,
  rank_to TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  google_reviewed BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One review per order
  CONSTRAINT reviews_order_id_unique UNIQUE (order_id)
);

-- Add review_token to orders for secure review links
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_token UUID DEFAULT gen_random_uuid();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_sent_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_worker_id ON reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_has_report ON reviews(has_worker_report) WHERE has_worker_report = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_review_token ON orders(review_token);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read visible reviews" ON reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Service role full access reviews" ON reviews FOR ALL USING (auth.role() = 'service_role');
