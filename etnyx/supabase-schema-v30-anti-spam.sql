-- ============================================================
-- Migration v30: Anti-Spam Tables (Banned IPs + Banned WhatsApp)
-- Date: 2026-07-12
-- Purpose: Block spammers who create dozens of fake orders
-- ============================================================

-- Step 1: Banned IPs table
CREATE TABLE IF NOT EXISTS public.banned_ips (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT 'spam',
  auto_banned BOOLEAN DEFAULT false,
  banned_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Banned WhatsApp numbers table
CREATE TABLE IF NOT EXISTS public.banned_whatsapp (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  whatsapp TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT 'spam',
  auto_banned BOOLEAN DEFAULT false,
  banned_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON public.banned_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_banned_whatsapp_number ON public.banned_whatsapp(whatsapp);

-- Step 4: RLS — only admin can manage, anon/authenticated can only check
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_whatsapp ENABLE ROW LEVEL SECURITY;

-- Admin full access (service_role bypasses RLS anyway)
CREATE POLICY "admins_manage_banned_ips" ON public.banned_ips
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "admins_manage_banned_whatsapp" ON public.banned_whatsapp
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Step 5: Grant access
GRANT SELECT ON public.banned_ips TO authenticated;
GRANT SELECT ON public.banned_whatsapp TO authenticated;

-- Step 6: Ban the known spammer immediately
INSERT INTO public.banned_whatsapp (whatsapp, reason, auto_banned, banned_by)
VALUES ('+6283161699611', 'Spam order: 15+ fake orders in 1 hour', false, 'admin')
ON CONFLICT (whatsapp) DO NOTHING;