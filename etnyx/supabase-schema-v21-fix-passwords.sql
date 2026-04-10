-- Migration v21: Fix worker/lead login credentials
-- Problem: Previous migrations used ON CONFLICT DO NOTHING,
--          so some workers kept old password hashes and couldn't login.
-- Solution: Force update all worker/lead passwords to @Yogyakarta2026
-- Run this in Supabase SQL Editor

-- Step 1: Diagnostic - show current state of all staff users
SELECT 
  email, 
  name, 
  role, 
  is_active, 
  lead_id,
  last_login_at,
  LEFT(password_hash, 30) || '...' as hash_prefix,
  CASE 
    WHEN password_hash = '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK' 
    THEN '✅ Correct (@Yogyakarta2026)'
    ELSE '❌ Wrong hash!'
  END as password_status
FROM staff_users
ORDER BY role, email;

-- Step 2: Fix all worker and lead passwords to @Yogyakarta2026
UPDATE staff_users
SET 
  password_hash = '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK',
  is_active = true,
  updated_at = NOW()
WHERE role IN ('worker', 'lead');

-- Step 3: Verify fix
SELECT 
  email, 
  name, 
  role, 
  is_active,
  CASE 
    WHEN password_hash = '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK' 
    THEN '✅ OK'
    ELSE '❌ STILL WRONG'
  END as status
FROM staff_users
WHERE role IN ('worker', 'lead')
ORDER BY role, email;
