-- Migration v20-fix: Create lead1 & lead2 users first, then seed 30 workers
-- Password: @Yogyakarta2026

-- Step 1: Create Lead 1 and Lead 2 if not exist
INSERT INTO staff_users (email, name, password_hash, role, phone, is_active)
VALUES (
  'lead1@etnyx.com',
  'Lead 1',
  '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK',
  'lead',
  '081200000001',
  true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO staff_users (email, name, password_hash, role, phone, is_active)
VALUES (
  'lead2@etnyx.com',
  'Lead 2',
  '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK',
  'lead',
  '081200000002',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Step 2: Create 30 workers (15 per lead)
DO $$
DECLARE
  lead1_id UUID;
  lead2_id UUID;
  pw_hash TEXT := '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK';
  i INTEGER;
BEGIN
  SELECT id INTO lead1_id FROM staff_users WHERE email = 'lead1@etnyx.com' LIMIT 1;
  SELECT id INTO lead2_id FROM staff_users WHERE email = 'lead2@etnyx.com' LIMIT 1;

  IF lead1_id IS NULL OR lead2_id IS NULL THEN
    RAISE EXCEPTION 'Lead users not found!';
  END IF;

  FOR i IN 1..15 LOOP
    INSERT INTO staff_users (email, name, password_hash, role, is_active, lead_id)
    VALUES (
      'lead1w' || i || '@etnyx.com',
      'Worker ' || i || ' | LD 1',
      pw_hash, 'worker', true, lead1_id
    ) ON CONFLICT (email) DO NOTHING;
  END LOOP;

  FOR i IN 1..15 LOOP
    INSERT INTO staff_users (email, name, password_hash, role, is_active, lead_id)
    VALUES (
      'lead2w' || i || '@etnyx.com',
      'Worker ' || i || ' | LD 2',
      pw_hash, 'worker', true, lead2_id
    ) ON CONFLICT (email) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Created 2 leads + 30 workers successfully!';
END $$;
