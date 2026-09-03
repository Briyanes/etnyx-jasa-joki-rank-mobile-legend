-- ============================================
-- v33: Payment Gateway Callback Audit Log
-- Audit finding: callback webhook did not persist raw gateway payloads,
-- making dispute investigation & forgery forensics impossible.
-- The /api/payment/callback route inserts every verified callback here
-- (best-effort, non-blocking).
-- ============================================

create table if not exists public.payment_callbacks (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid references public.orders(id) on delete cascade,
  gateway_provider   text not null default 'duitku',
  merchant_order_id  text,
  reference          text,
  result_code        text,
  payment_code       text,
  amount             numeric,
  signature          text,
  raw_payload        jsonb,
  created_at         timestamptz not null default now()
);

-- Indexes: lookup by order & by merchant ref (callback dedup/forensics)
create index if not exists idx_payment_callbacks_order_id
  on public.payment_callbacks (order_id);
create index if not exists idx_payment_callbacks_merchant_order_id
  on public.payment_callbacks (merchant_order_id);
create index if not exists idx_payment_callbacks_created_at
  on public.payment_callbacks (created_at desc);

-- RLS: enable & deny by default (service-role bypasses; admins read via dashboard)
alter table public.payment_callbacks enable row level security;

drop policy if exists "payment_callbacks_service_only" on public.payment_callbacks;
-- No INSERT/SELECT policies for anon/authenticated: only the service role
-- (server API routes) can touch this table.

-- Retention: keep 180 days of callback history (run via pg_cron if available,
-- otherwise the reconciliation cron can housekeep opportunistically).
-- select cron.schedule('0 3 * * *', $$
--   delete from public.payment_callbacks where created_at < now() - interval '180 days';
-- $$);
