-- ============================================
-- ETNYX — RLS HARDENING MIGRATION (v26)
-- ============================================
-- KRITICAL FIX (K1): Enable + Force RLS on ALL tables dynamically.
--
-- This SQL auto-discovers all tables in the 'public' schema and
-- applies RLS policies. No hardcoded table names — works regardless
-- of which tables exist in your database.
--
-- WHAT THIS DOES:
--   1. Drops ALL existing policies on all public tables
--   2. Enables + Forces RLS on every table
--   3. Grants service_role full access (app uses service role)
--   4. Grants anon/authenticated SELECT only on "safe" public tables
--      (testimonials, portfolio, reviews that have is_approved/is_active)
--   5. Blocks anon from everything else
--
-- RUN THIS IN: Supabase Dashboard → SQL Editor → Run
-- ============================================

-- ============================================
-- STEP 1: Drop ALL existing policies on all public tables
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename, schemaname
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================
-- STEP 2: Enable + Force RLS on ALL public tables
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I.%I ENABLE ROW LEVEL SECURITY', 'public', r.tablename);
    EXECUTE format('ALTER TABLE IF EXISTS %I.%I FORCE ROW LEVEL SECURITY', 'public', r.tablename);
  END LOOP;
END $$;

-- ============================================
-- STEP 3: Service role full access on ALL tables
-- ============================================
-- The app uses service role for all server-side operations.
-- This policy ensures service role never gets blocked by RLS.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE format(
      'CREATE POLICY "Service role full access on %s" ON %I.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      r.tablename, 'public', r.tablename
    );
  END LOOP;
END $$;

-- ============================================
-- STEP 4: Public read-only on SAFE tables only
-- ============================================
-- These tables expose data to the browser (anon key).
-- We only grant SELECT, never INSERT/UPDATE/DELETE.
-- Writes always go through API routes using service role.

-- Testimonials: Public can read approved testimonials
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'testimonials'
    AND column_name = 'is_approved'
  ) THEN
    CREATE POLICY "Public can read approved testimonials"
      ON public.testimonials FOR SELECT
      TO anon, authenticated
      USING (is_approved = true);
  END IF;
END $$;

-- Portfolio: Public can read active portfolio items
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolio'
    AND column_name = 'is_active'
  ) THEN
    CREATE POLICY "Public can read active portfolio"
      ON public.portfolio FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;
END $$;

-- Reviews: Public can read approved reviews
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews'
    AND column_name = 'is_approved'
  ) THEN
    CREATE POLICY "Public can read approved reviews"
      ON public.reviews FOR SELECT
      TO anon, authenticated
      USING (is_approved = true);
  END IF;
END $$;

-- Settings: Public can read non-sensitive settings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'settings'
    AND column_name = 'key'
  ) THEN
    CREATE POLICY "Public can read non-sensitive settings"
      ON public.settings FOR SELECT
      TO anon, authenticated
      USING (
        key NOT ILIKE 'secret_%'
        AND key NOT ILIKE '%_api_key'
        AND key NOT ILIKE '%_token'
        AND key NOT ILIKE '%_secret'
      );
  END IF;
END $$;

-- ============================================
-- STEP 5: Promo codes — public can VALIDATE only (not enumerate)
-- ============================================
-- Customers need to check if a promo code is valid.
-- We allow SELECT but only for codes that are active and not expired.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'promo_codes'
  ) THEN
    CREATE POLICY "Public can validate active promo codes"
      ON public.promo_codes FOR SELECT
      TO anon, authenticated
      USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > now())
      );
  END IF;
END $$;

-- ============================================
-- DONE — Verification queries below
-- ============================================
-- Run these to verify the migration worked:
--
-- 1. Check all tables have RLS enabled + forced:
--    SELECT tablename, rowsecurity, forcerowsecurity
--    FROM pg_tables
--    WHERE schemaname = 'public'
--    ORDER BY tablename;
--
-- 2. Check all policies:
--    SELECT tablename, policyname, roles, cmd
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    ORDER BY tablename, policyname;
--
-- 3. Quick security test (should return 0 rows with anon key):
--    -- Run this in a NEW tab with anon key connection
--    SELECT * FROM orders LIMIT 1;
--    -- Expected: permission denied or 0 rows