-- ============================================================
-- Migration v29: Fix SECURITY DEFINER View Warning
-- Date: 2026-07-12
-- Issue: Supabase Security Advisor flagged public.order_statistics
--        as SECURITY DEFINER (bypasses RLS)
-- Fix:   Recreate with SECURITY INVOKER (respects RLS)
-- ============================================================

-- Step 1: Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.order_statistics;

-- Step 2: Recreate with SECURITY INVOKER (exact same definition as original)
-- Note: security_invoker = true means the view respects RLS policies
--       of the querying user, instead of bypassing them.
CREATE OR REPLACE VIEW public.order_statistics
WITH (security_invoker = true) AS
SELECT count(*) AS total_orders,
    count(*) FILTER (WHERE status = 'pending'::text) AS pending_orders,
    count(*) FILTER (WHERE status = 'confirmed'::text) AS confirmed_orders,
    count(*) FILTER (WHERE status = 'in_progress'::text) AS in_progress_orders,
    count(*) FILTER (WHERE status = 'completed'::text) AS completed_orders,
    count(*) FILTER (WHERE status = 'cancelled'::text) AS cancelled_orders,
    COALESCE(sum(total_price) FILTER (WHERE status = 'completed'::text), 0::bigint) AS total_revenue,
    COALESCE(sum(total_price) FILTER (WHERE status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_progress'::text])), 0::bigint) AS pending_revenue,
    count(*) FILTER (WHERE created_at >= (now() - '24:00:00'::interval)) AS orders_today,
    count(*) FILTER (WHERE created_at >= (now() - '7 days'::interval)) AS orders_this_week,
    count(*) FILTER (WHERE created_at >= (now() - '30 days'::interval)) AS orders_this_month
   FROM orders;

-- Step 3: Grant access only to authenticated users (not anon)
GRANT SELECT ON public.order_statistics TO authenticated;
-- Do NOT grant to anon — public should never see order statistics