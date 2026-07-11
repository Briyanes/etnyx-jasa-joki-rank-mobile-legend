-- ============================================================
-- Migration v29: Fix SECURITY DEFINER View Warning
-- Date: 2026-07-12
-- Issue: Supabase Security Advisor flagged public.order_statistics
--        as SECURITY DEFINER (bypasses RLS)
-- Fix:   Recreate with SECURITY INVOKER (respects RLS)
-- ============================================================

-- Step 1: Backup the current view definition (run this first to see output)
-- SELECT pg_get_viewdef('public.order_statistics'::regclass, true);

-- Step 2: Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.order_statistics;

-- Step 3: Recreate with SECURITY INVOKER
-- Note: This view respects RLS policies of the querying user.
--       Only users with proper RLS permissions can see order data.
CREATE OR REPLACE VIEW public.order_statistics
WITH (security_invoker = true) AS
SELECT
  count(*) AS total_orders,
  count(*) FILTER (WHERE status = 'pending') AS pending_orders,
  count(*) FILTER (WHERE status = 'confirmed') AS confirmed_orders,
  count(*) FILTER (WHERE status = 'in_progress') AS in_progress_orders,
  count(*) FILTER (WHERE status = 'completed') AS completed_orders,
  count(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
  COALESCE(SUM(total_price), 0) AS total_revenue,
  COALESCE(SUM(total_price) FILTER (WHERE status = 'pending'), 0) AS pending_revenue,
  count(*) FILTER (WHERE created_at >= date_trunc('day', now())) AS orders_today,
  count(*) FILTER (WHERE created_at >= date_trunc('week', now())) AS orders_this_week,
  count(*) FILTER (WHERE created_at >= date_trunc('month', now())) AS orders_this_month
FROM public.orders;

-- Step 4: Grant access only to authenticated users (not anon)
-- This ensures only logged-in admin/staff can query this view
GRANT SELECT ON public.order_statistics TO authenticated;
-- Do NOT grant to anon — public should never see order statistics

-- Step 5: Verify the fix
-- SELECT schemaname, viewname, definition
-- FROM pg_views
-- WHERE viewname = 'order_statistics';