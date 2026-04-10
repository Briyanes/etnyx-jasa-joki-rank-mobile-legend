-- ============================================
-- Migration v22: RESET semua Lead & Worker
-- Hapus semua lalu buat ulang sesuai spreadsheet
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Step 1: Bersihkan semua FK references ke worker/lead
UPDATE orders SET assigned_lead_id = NULL, assigned_worker_id = NULL WHERE assigned_lead_id IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead')) OR assigned_worker_id IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead'));
DELETE FROM order_assignments WHERE assigned_to IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead')) OR assigned_by IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead'));
DELETE FROM worker_submissions WHERE worker_id IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead'));
DELETE FROM reviews WHERE worker_id IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead'));
DELETE FROM commissions WHERE worker_id IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead'));
DELETE FROM salary_records WHERE staff_id IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead'));
DELETE FROM staff_salaries WHERE staff_id IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead'));
DELETE FROM staff_payment_accounts WHERE staff_id IN (SELECT id FROM staff_users WHERE role IN ('worker', 'lead'));

-- Step 2: Hapus semua worker & lead
DELETE FROM staff_users WHERE role IN ('worker', 'lead');

-- Step 3: Buat Lead 1 & Lead 2
INSERT INTO staff_users (id, email, name, role, password_hash, is_active, created_at, updated_at)
VALUES
  ('cd821458-0a8e-4521-b404-3ebc67f55f33', 'lead1@etnyx.com', 'LEAD 1', 'lead', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, NOW(), NOW()),
  ('0659e2e2-93a9-4128-9dfb-1f220ef46d31', 'lead2@etnyx.com', 'LEAD 2', 'lead', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, NOW(), NOW());

-- Step 4: Buat Worker 1-15 Lead 1
INSERT INTO staff_users (email, name, role, password_hash, is_active, lead_id, created_at, updated_at)
VALUES
  ('lead1w1@etnyx.com',  'Worker 1 | LD 1',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w2@etnyx.com',  'Worker 2 | LD 1',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w3@etnyx.com',  'Worker 3 | LD 1',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w4@etnyx.com',  'Worker 4 | LD 1',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w5@etnyx.com',  'Worker 5 | LD 1',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w6@etnyx.com',  'Worker 6 | LD 1',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w7@etnyx.com',  'Worker 7 | LD 1',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w8@etnyx.com',  'Worker 8 | LD 1',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w9@etnyx.com',  'Worker 9 | LD 1',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w10@etnyx.com', 'Worker 10 | LD 1', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w11@etnyx.com', 'Worker 11 | LD 1', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w12@etnyx.com', 'Worker 12 | LD 1', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w13@etnyx.com', 'Worker 13 | LD 1', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w14@etnyx.com', 'Worker 14 | LD 1', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW()),
  ('lead1w15@etnyx.com', 'Worker 15 | LD 1', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, 'cd821458-0a8e-4521-b404-3ebc67f55f33', NOW(), NOW());

-- Step 5: Buat Worker 1-15 Lead 2
INSERT INTO staff_users (email, name, role, password_hash, is_active, lead_id, created_at, updated_at)
VALUES
  ('lead2w1@etnyx.com',  'Worker 1 | LD 2',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w2@etnyx.com',  'Worker 2 | LD 2',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w3@etnyx.com',  'Worker 3 | LD 2',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w4@etnyx.com',  'Worker 4 | LD 2',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w5@etnyx.com',  'Worker 5 | LD 2',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w6@etnyx.com',  'Worker 6 | LD 2',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w7@etnyx.com',  'Worker 7 | LD 2',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w8@etnyx.com',  'Worker 8 | LD 2',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w9@etnyx.com',  'Worker 9 | LD 2',  'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w10@etnyx.com', 'Worker 10 | LD 2', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w11@etnyx.com', 'Worker 11 | LD 2', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w12@etnyx.com', 'Worker 12 | LD 2', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w13@etnyx.com', 'Worker 13 | LD 2', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w14@etnyx.com', 'Worker 14 | LD 2', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW()),
  ('lead2w15@etnyx.com', 'Worker 15 | LD 2', 'worker', '$2b$12$ndYa7WmMxMZIHCAcUAC6oe78BNK5Pain/pJiMmUOpKKhsRxa4m1eK', true, '0659e2e2-93a9-4128-9dfb-1f220ef46d31', NOW(), NOW());

-- Step 6: Verifikasi
SELECT role, COUNT(*) as total FROM staff_users WHERE is_active = true GROUP BY role ORDER BY role;
-- Harusnya: admin=1, lead=2, worker=30
