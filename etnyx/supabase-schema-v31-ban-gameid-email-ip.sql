-- ============================================================
-- Migration v31: Ban by Game ID + Email + Store Customer IP
-- Date: 2026-08-08
-- Purpose: Multi-layer ban system for persistent spammers
--          who change WA numbers but keep same Game ID / Email
-- ============================================================

-- Step 1: Banned Game IDs table
-- Game ID Mobile Legends cannot be changed (bound to Moonton account)
CREATE TABLE IF NOT EXISTS public.banned_game_ids (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT 'spam',
  auto_banned BOOLEAN DEFAULT false,
  banned_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Banned Emails table
CREATE TABLE IF NOT EXISTS public.banned_emails (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT 'spam',
  auto_banned BOOLEAN DEFAULT false,
  banned_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Add customer_ip column to orders table
-- Allows admin to see which IP placed each order
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_ip'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_ip TEXT;
  END IF;
END $$;

-- Step 4: Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_banned_game_ids_game_id ON public.banned_game_ids(game_id);
CREATE INDEX IF NOT EXISTS idx_banned_emails_email ON public.banned_emails(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_ip ON public.orders(customer_ip);

-- Step 5: RLS for new tables
ALTER TABLE public.banned_game_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_role_all_banned_game_ids" ON public.banned_game_ids
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_banned_emails" ON public.banned_emails
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon/authenticated: SELECT only (order API needs to check bans)
CREATE POLICY "anon_read_banned_game_ids" ON public.banned_game_ids
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_read_banned_emails" ON public.banned_emails
  FOR SELECT TO anon, authenticated USING (true);

-- Step 6: Grant access
GRANT SELECT ON public.banned_game_ids TO anon, authenticated;
GRANT SELECT ON public.banned_emails TO anon, authenticated;

-- Step 7: Ban the known persistent spammer (rambe@gmail.com)
INSERT INTO public.banned_emails (email, reason, auto_banned, banned_by)
VALUES ('rambe@gmail.com', 'Persistent spam: creates fake orders, changes WA numbers', false, 'admin')
ON CONFLICT (email) DO NOTHING;

-- Also ban the Game IDs seen in spam orders
-- Format: 1762073303(18494) — we store just the numeric ID for matching
INSERT INTO public.banned_game_ids (game_id, reason, auto_banned, banned_by)
VALUES ('1762073303', 'Persistent spam from rambe@gmail.com', false, 'admin')
ON CONFLICT (game_id) DO NOTHING;

INSERT INTO public.banned_game_ids (game_id, reason, auto_banned, banned_by)
VALUES ('1762073306', 'Persistent spam from rambe@gmail.com', false, 'admin')
ON CONFLICT (game_id) DO NOTHING;