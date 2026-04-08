-- Migration v20: Seed 30 workers (15 per lead)
-- Run this in Supabase SQL Editor
-- Password: @Yogyakarta2026 (bcrypt hash)

-- First, get lead IDs
DO $$
DECLARE
  lead1_id UUID;
  lead2_id UUID;
  pw_hash TEXT := '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK';
  i INTEGER;
BEGIN
  -- Get Lead 1 and Lead 2 IDs
  SELECT id INTO lead1_id FROM staff_users WHERE email = 'lead1@etnyx.com' LIMIT 1;
  SELECT id INTO lead2_id FROM staff_users WHERE email = 'lead2@etnyx.com' LIMIT 1;

  IF lead1_id IS NULL OR lead2_id IS NULL THEN
    RAISE EXCEPTION 'Lead users not found. Make sure lead1@etnyx.com and lead2@etnyx.com exist.';
  END IF;

  -- Create 15 workers for Lead 1
  FOR i IN 1..15 LOOP
    INSERT INTO staff_users (email, name, password_hash, role, is_active, lead_id)
    VALUES (
      'lead1w' || i || '@etnyx.com',
      'Worker ' || i || ' | LD 1',
      pw_hash,
      'worker',
      true,
      lead1_id
    )
    ON CONFLICT (email) DO NOTHING;
  END LOOP;

  -- Create 15 workers for Lead 2
  FOR i IN 1..15 LOOP
    INSERT INTO staff_users (email, name, password_hash, role, is_active, lead_id)
    VALUES (
      'lead2w' || i || '@etnyx.com',
      'Worker ' || i || ' | LD 2',
      pw_hash,
      'worker',
      true,
      lead2_id
    )
    ON CONFLICT (email) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Created 30 workers (15 per lead) successfully!';
END $$;
