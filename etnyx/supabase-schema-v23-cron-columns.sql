-- Add columns for cron-based payment reminder & review request tracking
-- Run this in Supabase SQL Editor

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_reminder_sent TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS review_request_sent TIMESTAMPTZ DEFAULT NULL;

-- Index for cron queries
CREATE INDEX IF NOT EXISTS idx_orders_pending_reminder
ON orders (status, created_at)
WHERE status = 'pending' AND payment_reminder_sent IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_completed_review
ON orders (status, completed_at)
WHERE status = 'completed' AND review_request_sent IS NULL;
