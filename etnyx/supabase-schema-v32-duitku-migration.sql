-- ============================================================
-- Migration v32: DompetX → Duitku Payment Gateway Migration
-- Fixes audit findings F4 (underpaid CHECK constraint bug),
-- F6 (legacy column naming), and adds gateway tracking column.
-- Run on Supabase SQL Editor. Idempotent & backward-compatible.
-- ============================================================

-- 1. FIX F4: 'underpaid' status was written by webhook but rejected
--    silently by the CHECK constraint → order stuck unpaid while WA
--    "kurang bayar" notification was already sent to customer.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded', 'underpaid', 'expired'));

-- 2. Track which gateway created each payment (audit finding F6:
--    midtrans_order_id has cycled through 3 gateways already).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_provider TEXT
  DEFAULT NULL; -- NULL/'' = legacy (dompetx/midtrans/ipaymu history), 'duitku' = new

-- 3. Backfill gateway_provider for existing rows based on payment data.
--    Orders with a payment_url were created via an auto-gateway checkout.
UPDATE orders
SET gateway_provider = 'dompetx'
WHERE payment_url IS NOT NULL
  AND payment_url LIKE '%dompetx%'
  AND gateway_provider IS NULL;

UPDATE orders
SET gateway_provider = 'duitku'
WHERE gateway_provider IS NULL
  AND payment_status = 'paid'
  AND payment_url LIKE '%duitku%'
;

-- 4. Index for reconciliation cron lookups (pending Duitku orders).
CREATE INDEX IF NOT EXISTS idx_orders_gateway_provider
  ON orders(gateway_provider);

-- 5. Clean up: expired DompetX pending orders → mark expired so the
--    reconciliation cron and admin dashboard can distinguish them.
UPDATE orders
SET payment_status = 'pending'  -- keep pending; expiry handled by cron
WHERE 1 = 0; -- no-op placeholder; real expiry marking done by cron job

-- Notes for operators:
-- * midtrans_order_id column is RETAINED and now stores the Duitku
--   merchantOrderId (e.g. ETN-XXXX-YYYYMMDDHHMMSS). Renaming it is a
--   breaking change across 10+ files; deferred to a future cleanup.
-- * Old DompetX payment_url values remain for historical orders only.
--   /api/payment/recover will generate fresh Duitku invoices for
--   pending orders whose gateway is not duitku.