-- ============================================
-- ETNYX Seed Data v2 (Comprehensive Testing)
-- Run this in Supabase SQL Editor
-- Password for all test accounts: Test1234
-- ALL service types covered: Paket, Per Star, Gendong, Rush Promo
-- ============================================

-- =====================
-- 0. CLEAN OLD DATA (order matters for FK)
-- =====================
DELETE FROM payout_items;
DELETE FROM payouts;
DELETE FROM commissions;
DELETE FROM salary_records;
DELETE FROM staff_salaries;
DELETE FROM reward_transactions;
DELETE FROM referrals;
DELETE FROM order_assignments;
DELETE FROM order_logs;
DELETE FROM orders;
DELETE FROM customers;
DELETE FROM boosters;
DELETE FROM staff_users;
DELETE FROM promo_codes;
DELETE FROM testimonials;
DELETE FROM portfolio;
DELETE FROM reward_catalog;
DELETE FROM settings WHERE key IN ('social_links', 'site_info');

-- =====================
-- 1. STAFF USERS (4)
-- =====================
INSERT INTO staff_users (id, email, name, password_hash, role, phone, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'lead@etnyx.id', 'Rian Lead', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'lead', '081200001111', true),
  ('a0000000-0000-0000-0000-000000000002', 'worker1@etnyx.id', 'Dimas Worker', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'worker', '081200002222', true),
  ('a0000000-0000-0000-0000-000000000003', 'worker2@etnyx.id', 'Fajar Worker', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'worker', '081200003333', true),
  ('a0000000-0000-0000-0000-000000000004', 'worker3@etnyx.id', 'Galih Worker', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'worker', '081200004444', true)
ON CONFLICT (email) DO NOTHING;

-- =====================
-- 2. BOOSTERS (5)
-- =====================
INSERT INTO boosters (id, name, whatsapp, rank_specialization, is_available, total_orders, rating) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'ProBoosted', '081300001111', 'Mythic Glory - Immortal', true, 312, 4.9),
  ('b0000000-0000-0000-0000-000000000002', 'MythicSlayer', '081300002222', 'Legend - Mythic Glory', true, 198, 4.8),
  ('b0000000-0000-0000-0000-000000000003', 'RankPusher', '081300003333', 'Epic - Legend', true, 456, 4.7),
  ('b0000000-0000-0000-0000-000000000004', 'StarHunter', '081300004444', 'Grand Master - Legend', true, 89, 4.9),
  ('b0000000-0000-0000-0000-000000000005', 'ImmortalKing', '081300005555', 'Mythic Honor - Immortal', false, 523, 5.0)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- 3. CUSTOMERS (8)
-- =====================
INSERT INTO customers (id, email, password_hash, name, whatsapp, referral_code, total_orders, total_spent, reward_points, reward_tier, lifetime_points, is_verified) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'budi@gmail.com', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'Budi Santoso', '081400001111', 'REF-BUDI01', 8, 2450000, 245, 'silver', 850, true),
  ('c0000000-0000-0000-0000-000000000002', 'rina@gmail.com', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'Rina Wati', '081400002222', 'REF-RINA01', 5, 985000, 98, 'bronze', 480, true),
  ('c0000000-0000-0000-0000-000000000003', 'andi@gmail.com', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'Andi Pratama', '081400003333', 'REF-ANDI01', 12, 4800000, 480, 'gold', 2200, true),
  ('c0000000-0000-0000-0000-000000000004', 'siti@gmail.com', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'Siti Nurhaliza', '081400004444', 'REF-SITI01', 3, 425000, 42, 'bronze', 120, true),
  ('c0000000-0000-0000-0000-000000000005', 'farhan@gmail.com', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'Farhan Rizky', '081400005555', 'REF-FARH01', 6, 1750000, 175, 'silver', 680, true),
  ('c0000000-0000-0000-0000-000000000006', 'diana@gmail.com', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'Diana Putri', '081400006666', 'REF-DIAN01', 4, 1200000, 120, 'silver', 560, true),
  ('c0000000-0000-0000-0000-000000000007', 'rizal@gmail.com', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'Rizal Fauzi', '081400007777', 'REF-RIZL01', 2, 285000, 28, 'bronze', 95, true),
  ('c0000000-0000-0000-0000-000000000008', 'mega@gmail.com', '$2b$12$5dNPM/RUr6er5fK5vZJjz.i7n1WcYWjd88AgHA9ffyOzmDFpAl/ZK', 'Mega Lestari', '081400008888', 'REF-MEGA01', 10, 5600000, 560, 'platinum', 2800, true)
ON CONFLICT (email) DO NOTHING;

-- =====================
-- 4. ORDERS - PAKET (Package Boost) - 10 orders
-- =====================
INSERT INTO orders (id, order_id, username, game_id, whatsapp, current_rank, target_rank, package, is_express, is_premium, base_price, total_price, status, progress, customer_id, assigned_worker_id, booster_id, created_at, confirmed_at, payment_status, paid_at) VALUES
  -- PAKET: GM → Epic (completed)
  ('d0000000-0000-0000-0000-000000000001', 'ETX-260301-001', 'BudiGaming', '12345678 (1234)', '081400001111', 'grandmaster', 'epic', 'Paket GM V → Epic V', false, false, 125000, 125000, 'completed', 100, 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', 'paid', NOW() - INTERVAL '30 days'),
  -- PAKET: Epic → Legend (completed, express)
  ('d0000000-0000-0000-0000-000000000002', 'ETX-260305-001', 'RinaML', '87654321 (5678)', '081400002222', 'epic', 'legend', 'Paket Epic V → Legend V', true, false, 200000, 240000, 'completed', 100, 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', 'paid', NOW() - INTERVAL '25 days'),
  -- PAKET: Legend → Mythic (completed, premium)
  ('d0000000-0000-0000-0000-000000000003', 'ETX-260308-001', 'AndiPro', '11112222 (3344)', '081400003333', 'legend', 'mythic', 'Paket Legend V → Mythic', true, true, 250000, 375000, 'completed', 100, 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', 'paid', NOW() - INTERVAL '22 days'),
  -- PAKET: Epic → Mythic (completed)
  ('d0000000-0000-0000-0000-000000000004', 'ETX-260310-001', 'FarhanGG', '22223333 (4455)', '081400005555', 'epic', 'mythic', 'Paket Epic V → Mythic', false, false, 450000, 450000, 'completed', 100, 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 'paid', NOW() - INTERVAL '20 days'),
  -- PAKET: Mythic → Mythic Glory (completed, express+premium)
  ('d0000000-0000-0000-0000-000000000005', 'ETX-260312-001', 'MegaStar', '99998888 (7766)', '081400008888', 'mythic', 'mythicglory', 'Paket Mythic → Mythic Glory', true, true, 800000, 1200000, 'completed', 100, 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', 'paid', NOW() - INTERVAL '18 days'),
  -- PAKET: GM → Legend (completed)
  ('d0000000-0000-0000-0000-000000000006', 'ETX-260315-001', 'DianaQ', '44445555 (6677)', '081400006666', 'grandmaster', 'legend', 'Paket GM V → Legend V', false, false, 325000, 325000, 'completed', 100, 'c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 'paid', NOW() - INTERVAL '15 days'),
  -- PAKET: Legend → Mythic Glory (in_progress)
  ('d0000000-0000-0000-0000-000000000007', 'ETX-260401-001', 'BudiGaming', '12345678 (1234)', '081400001111', 'legend', 'mythicglory', 'Paket Legend V → Mythic Glory', true, false, 650000, 780000, 'in_progress', 65, 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'paid', NOW() - INTERVAL '3 days'),
  -- PAKET: Mythic Honor → Mythic Immortal (in_progress)
  ('d0000000-0000-0000-0000-000000000008', 'ETX-260402-001', 'MegaStar', '99998888 (7766)', '081400008888', 'mythichonor', 'mythicimmortal', 'Paket Mythic Honor → Immortal', false, true, 1500000, 1950000, 'in_progress', 40, 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'paid', NOW() - INTERVAL '2 days'),
  -- PAKET: GM → Mythic (confirmed, waiting assignment)
  ('d0000000-0000-0000-0000-000000000009', 'ETX-260404-001', 'AndiPro', '11112222 (3344)', '081400003333', 'grandmaster', 'mythic', 'Paket GM V → Mythic', false, false, 525000, 525000, 'confirmed', 0, 'c0000000-0000-0000-0000-000000000003', NULL, NULL, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours', 'paid', NOW() - INTERVAL '8 hours'),
  -- PAKET: Legend → Mythic Immortal (pending payment)
  ('d0000000-0000-0000-0000-000000000010', 'ETX-260405-001', 'AndiPro', '11112222 (3344)', '081400003333', 'legend', 'mythicimmortal', 'Paket Legend V → Mythic Immortal', true, true, 2500000, 3750000, 'pending', 0, 'c0000000-0000-0000-0000-000000000003', NULL, NULL, NOW() - INTERVAL '2 hours', NULL, 'unpaid', NULL)
ON CONFLICT (order_id) DO NOTHING;

-- =====================
-- 5. ORDERS - PER STAR (Per Star Boost) - 10 orders
-- =====================
INSERT INTO orders (id, order_id, username, game_id, whatsapp, current_rank, target_rank, package, is_express, is_premium, base_price, total_price, status, progress, customer_id, assigned_worker_id, booster_id, created_at, confirmed_at, payment_status, paid_at) VALUES
  -- PERSTAR: GM 5 star (completed)
  ('d0000000-0000-0000-0000-000000000011', 'ETX-260302-001', 'BudiGaming', '12345678 (1234)', '081400001111', 'grandmaster', 'grandmaster', 'Per Star GM × 5 bintang', false, false, 25000, 25000, 'completed', 100, 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', 'paid', NOW() - INTERVAL '28 days'),
  -- PERSTAR: Epic 8 star (completed)
  ('d0000000-0000-0000-0000-000000000012', 'ETX-260306-001', 'SitiGamer', '55556666 (7788)', '081400004444', 'epic', 'epic', 'Per Star Epic × 8 bintang', false, false, 52000, 52000, 'completed', 100, 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days', 'paid', NOW() - INTERVAL '24 days'),
  -- PERSTAR: Legend 10 star (completed, express)
  ('d0000000-0000-0000-0000-000000000013', 'ETX-260309-001', 'DianaQ', '44445555 (6677)', '081400006666', 'legend', 'legend', 'Per Star Legend × 10 bintang', true, false, 75000, 90000, 'completed', 100, 'c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', 'paid', NOW() - INTERVAL '21 days'),
  -- PERSTAR: Mythic 5 star (completed, premium)
  ('d0000000-0000-0000-0000-000000000014', 'ETX-260311-001', 'FarhanGG', '22223333 (4455)', '081400005555', 'mythic', 'mythic', 'Per Star Mythic × 5 bintang', false, true, 90000, 117000, 'completed', 100, 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', 'paid', NOW() - INTERVAL '19 days'),
  -- PERSTAR: Mythic Grading 3 star (completed)
  ('d0000000-0000-0000-0000-000000000015', 'ETX-260314-001', 'MegaStar', '99998888 (7766)', '081400008888', 'mythicgrading', 'mythicgrading', 'Per Star Mythic Grading × 3 bintang', false, false, 60000, 60000, 'completed', 100, 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days', 'paid', NOW() - INTERVAL '17 days'),
  -- PERSTAR: Mythic Honor 6 star (completed)
  ('d0000000-0000-0000-0000-000000000016', 'ETX-260318-001', 'AndiPro', '11112222 (3344)', '081400003333', 'mythichonor', 'mythichonor', 'Per Star Mythic Honor × 6 bintang', false, false, 126000, 126000, 'completed', 100, 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 'paid', NOW() - INTERVAL '14 days'),
  -- PERSTAR: Mythic Glory 4 star (completed, express+premium)
  ('d0000000-0000-0000-0000-000000000017', 'ETX-260320-001', 'MegaStar', '99998888 (7766)', '081400008888', 'mythicglory', 'mythicglory', 'Per Star Mythic Glory × 4 bintang', true, true, 104000, 156000, 'completed', 100, 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 'paid', NOW() - INTERVAL '12 days'),
  -- PERSTAR: Mythic Immortal 3 star (completed)
  ('d0000000-0000-0000-0000-000000000018', 'ETX-260322-001', 'MegaStar', '99998888 (7766)', '081400008888', 'mythicimmortal', 'mythicimmortal', 'Per Star Mythic Immortal × 3 bintang', false, false, 93000, 93000, 'completed', 100, 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'paid', NOW() - INTERVAL '10 days'),
  -- PERSTAR: Epic 6 star (in_progress)
  ('d0000000-0000-0000-0000-000000000019', 'ETX-260403-001', 'RizalKing', '66667777 (8899)', '081400007777', 'epic', 'epic', 'Per Star Epic × 6 bintang', false, false, 39000, 39000, 'in_progress', 50, 'c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'paid', NOW() - INTERVAL '1 day'),
  -- PERSTAR: Legend 5 star (pending)
  ('d0000000-0000-0000-0000-000000000020', 'ETX-260405-002', 'RinaML', '87654321 (5678)', '081400002222', 'legend', 'legend', 'Per Star Legend × 5 bintang', false, false, 37500, 37500, 'pending', 0, 'c0000000-0000-0000-0000-000000000002', NULL, NULL, NOW() - INTERVAL '1 hour', NULL, 'unpaid', NULL)
ON CONFLICT (order_id) DO NOTHING;

-- =====================
-- 6. ORDERS - GENDONG (Duo Boost) - 10 orders
-- =====================
INSERT INTO orders (id, order_id, username, game_id, whatsapp, current_rank, target_rank, package, is_express, is_premium, base_price, total_price, status, progress, customer_id, assigned_worker_id, booster_id, created_at, confirmed_at, payment_status, paid_at) VALUES
  -- GENDONG: GM 5 star (completed)
  ('d0000000-0000-0000-0000-000000000021', 'ETX-260303-001', 'RinaML', '87654321 (5678)', '081400002222', 'grandmaster', 'grandmaster', 'Gendong GM × 5 bintang', false, false, 45000, 45000, 'completed', 100, 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days', 'paid', NOW() - INTERVAL '27 days'),
  -- GENDONG: Epic 8 star (completed, express)
  ('d0000000-0000-0000-0000-000000000022', 'ETX-260307-001', 'BudiGaming', '12345678 (1234)', '081400001111', 'epic', 'epic', 'Gendong Epic × 8 bintang', true, false, 80000, 96000, 'completed', 100, 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days', 'paid', NOW() - INTERVAL '23 days'),
  -- GENDONG: Legend 6 star (completed)
  ('d0000000-0000-0000-0000-000000000023', 'ETX-260313-001', 'FarhanGG', '22223333 (4455)', '081400005555', 'legend', 'legend', 'Gendong Legend × 6 bintang', false, false, 66000, 66000, 'completed', 100, 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', 'paid', NOW() - INTERVAL '16 days'),
  -- GENDONG: Mythic 4 star (completed, premium)
  ('d0000000-0000-0000-0000-000000000024', 'ETX-260316-001', 'AndiPro', '11112222 (3344)', '081400003333', 'mythic', 'mythic', 'Gendong Mythic × 4 bintang', false, true, 84000, 109200, 'completed', 100, 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', 'paid', NOW() - INTERVAL '13 days'),
  -- GENDONG: Mythic Grading 3 star (completed)
  ('d0000000-0000-0000-0000-000000000025', 'ETX-260319-001', 'DianaQ', '44445555 (6677)', '081400006666', 'mythicgrading', 'mythicgrading', 'Gendong Mythic Grading × 3 bintang', false, false, 69000, 69000, 'completed', 100, 'c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', 'paid', NOW() - INTERVAL '11 days'),
  -- GENDONG: Mythic Honor 5 star (completed, express)
  ('d0000000-0000-0000-0000-000000000026', 'ETX-260321-001', 'MegaStar', '99998888 (7766)', '081400008888', 'mythichonor', 'mythichonor', 'Gendong Mythic Honor × 5 bintang', true, false, 125000, 150000, 'completed', 100, 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', 'paid', NOW() - INTERVAL '9 days'),
  -- GENDONG: Mythic Glory 3 star (completed)
  ('d0000000-0000-0000-0000-000000000027', 'ETX-260325-001', 'AndiPro', '11112222 (3344)', '081400003333', 'mythicglory', 'mythicglory', 'Gendong Mythic Glory × 3 bintang', false, false, 90000, 90000, 'completed', 100, 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 'paid', NOW() - INTERVAL '8 days'),
  -- GENDONG: Mythic Immortal 3 star (completed, express+premium)
  ('d0000000-0000-0000-0000-000000000028', 'ETX-260328-001', 'MegaStar', '99998888 (7766)', '081400008888', 'mythicimmortal', 'mythicimmortal', 'Gendong Mythic Immortal × 3 bintang', true, true, 105000, 157500, 'completed', 100, 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 'paid', NOW() - INTERVAL '6 days'),
  -- GENDONG: Epic 5 star (in_progress)
  ('d0000000-0000-0000-0000-000000000029', 'ETX-260403-002', 'SitiGamer', '55556666 (7788)', '081400004444', 'epic', 'epic', 'Gendong Epic × 5 bintang', false, false, 50000, 50000, 'in_progress', 60, 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'paid', NOW() - INTERVAL '1 day'),
  -- GENDONG: Legend 4 star (confirmed)
  ('d0000000-0000-0000-0000-000000000030', 'ETX-260404-002', 'FarhanGG', '22223333 (4455)', '081400005555', 'legend', 'legend', 'Gendong Legend × 4 bintang', false, false, 44000, 44000, 'confirmed', 0, 'c0000000-0000-0000-0000-000000000005', NULL, NULL, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', 'paid', NOW() - INTERVAL '6 hours')
ON CONFLICT (order_id) DO NOTHING;

-- =====================
-- 7. ORDERS - RUSH PROMO - 8 orders
-- =====================
INSERT INTO orders (id, order_id, username, game_id, whatsapp, current_rank, target_rank, package, is_express, is_premium, base_price, total_price, status, progress, customer_id, assigned_worker_id, booster_id, created_at, confirmed_at, payment_status, paid_at) VALUES
  -- RUSH: Rush 5 Star Epic (completed)
  ('d0000000-0000-0000-0000-000000000031', 'ETX-260304-001', 'BudiGaming', '12345678 (1234)', '081400001111', 'epic', 'epic', 'Rush 5 Star Epic', false, false, 32000, 32000, 'completed', 100, 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days', 'paid', NOW() - INTERVAL '26 days'),
  -- RUSH: Rush 9 Star Epic (completed)
  ('d0000000-0000-0000-0000-000000000032', 'ETX-260310-002', 'RinaML', '87654321 (5678)', '081400002222', 'epic', 'epic', 'Rush 9 Star Epic', false, false, 56000, 56000, 'completed', 100, 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 'paid', NOW() - INTERVAL '20 days'),
  -- RUSH: Rush 5 Star Legend (completed)
  ('d0000000-0000-0000-0000-000000000033', 'ETX-260312-002', 'FarhanGG', '22223333 (4455)', '081400005555', 'legend', 'legend', 'Rush 5 Star Legend', false, false, 37000, 37000, 'completed', 100, 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', 'paid', NOW() - INTERVAL '18 days'),
  -- RUSH: Rush 5 Star Mythic (completed, express)
  ('d0000000-0000-0000-0000-000000000034', 'ETX-260316-002', 'AndiPro', '11112222 (3344)', '081400003333', 'mythic', 'mythic', 'Rush 5 Star Mythic', true, false, 90000, 108000, 'completed', 100, 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', 'paid', NOW() - INTERVAL '13 days'),
  -- RUSH: Rush 9 Star Mythic (completed)
  ('d0000000-0000-0000-0000-000000000035', 'ETX-260320-002', 'DianaQ', '44445555 (6677)', '081400006666', 'mythic', 'mythic', 'Rush 9 Star Mythic', false, false, 155000, 155000, 'completed', 100, 'c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 'paid', NOW() - INTERVAL '12 days'),
  -- RUSH: Rush 5 Star Mythic Honor (completed)
  ('d0000000-0000-0000-0000-000000000036', 'ETX-260325-002', 'MegaStar', '99998888 (7766)', '081400008888', 'mythichonor', 'mythichonor', 'Rush 5 Star Mythic Honor', false, false, 105000, 105000, 'completed', 100, 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 'paid', NOW() - INTERVAL '8 days'),
  -- RUSH: Rush 9 Star Mythic Glory (in_progress)
  ('d0000000-0000-0000-0000-000000000037', 'ETX-260402-002', 'AndiPro', '11112222 (3344)', '081400003333', 'mythicglory', 'mythicglory', 'Rush 9 Star Mythic Glory', false, true, 234000, 304200, 'in_progress', 55, 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'paid', NOW() - INTERVAL '2 days'),
  -- RUSH: Rush 5 Star Legend (pending)
  ('d0000000-0000-0000-0000-000000000038', 'ETX-260405-003', 'DianaQ', '44445555 (6677)', '081400006666', 'legend', 'legend', 'Rush 5 Star Legend', false, false, 37000, 37000, 'pending', 0, 'c0000000-0000-0000-0000-000000000006', NULL, NULL, NOW() - INTERVAL '30 minutes', NULL, 'unpaid', NULL)
ON CONFLICT (order_id) DO NOTHING;

-- =====================
-- 8. ORDERS - EXTRA MIXED (more variety) - 7 orders
-- =====================
INSERT INTO orders (id, order_id, username, game_id, whatsapp, current_rank, target_rank, package, is_express, is_premium, base_price, total_price, status, progress, customer_id, assigned_worker_id, booster_id, created_at, confirmed_at, payment_status, paid_at) VALUES
  -- PAKET: Open Grading (completed)
  ('d0000000-0000-0000-0000-000000000039', 'ETX-260315-002', 'BudiGaming', '12345678 (1234)', '081400001111', 'mythic', 'mythicgrading', 'Paket Open Grading', false, false, 120000, 120000, 'completed', 100, 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 'paid', NOW() - INTERVAL '15 days'),
  -- PAKET: Mythic Grading → Mythic Glory (completed)
  ('d0000000-0000-0000-0000-000000000040', 'ETX-260318-002', 'FarhanGG', '22223333 (4455)', '081400005555', 'mythicgrading', 'mythicglory', 'Paket Mythic Grading → Glory', true, false, 600000, 720000, 'completed', 100, 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', 'paid', NOW() - INTERVAL '11 days'),
  -- PAKET: Mythic Glory → Mythic Immortal (completed)
  ('d0000000-0000-0000-0000-000000000041', 'ETX-260322-002', 'MegaStar', '99998888 (7766)', '081400008888', 'mythicglory', 'mythicimmortal', 'Paket Mythic Glory → Immortal', false, true, 1200000, 1560000, 'completed', 100, 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'paid', NOW() - INTERVAL '7 days'),
  -- PERSTAR: GM 3 star (completed — min order)
  ('d0000000-0000-0000-0000-000000000042', 'ETX-260328-002', 'RizalKing', '66667777 (8899)', '081400007777', 'grandmaster', 'grandmaster', 'Per Star GM × 3 bintang', false, false, 15000, 15000, 'completed', 100, 'c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'paid', NOW() - INTERVAL '5 days'),
  -- GENDONG: Mythic 6 star (in_progress)
  ('d0000000-0000-0000-0000-000000000043', 'ETX-260403-003', 'BudiGaming', '12345678 (1234)', '081400001111', 'mythic', 'mythic', 'Gendong Mythic × 6 bintang', false, false, 126000, 126000, 'in_progress', 33, 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '18 hours', 'paid', NOW() - INTERVAL '18 hours'),
  -- PAKET: Epic → Legend (cancelled — changed mind)
  ('d0000000-0000-0000-0000-000000000044', 'ETX-260330-001', 'RinaML', '87654321 (5678)', '081400002222', 'epic', 'legend', 'Paket Epic V → Legend V', false, false, 200000, 200000, 'cancelled', 0, 'c0000000-0000-0000-0000-000000000002', NULL, NULL, NOW() - INTERVAL '4 days', NULL, 'unpaid', NULL),
  -- GENDONG: GM 10 star (cancelled — duplicate)
  ('d0000000-0000-0000-0000-000000000045', 'ETX-260331-001', 'SitiGamer', '55556666 (7788)', '081400004444', 'grandmaster', 'grandmaster', 'Gendong GM × 10 bintang', false, false, 90000, 90000, 'cancelled', 0, 'c0000000-0000-0000-0000-000000000004', NULL, NULL, NOW() - INTERVAL '3 days', NULL, 'unpaid', NULL)
ON CONFLICT (order_id) DO NOTHING;

-- =====================
-- 9. ORDER LOGS (comprehensive)
-- =====================
INSERT INTO order_logs (order_id, action, old_value, new_value, notes, created_by) VALUES
  -- Order 001 (Paket GM→Epic, completed)
  ('d0000000-0000-0000-0000-000000000001', 'status_change', 'pending', 'confirmed', 'Payment confirmed via QRIS', 'admin'),
  ('d0000000-0000-0000-0000-000000000001', 'status_change', 'confirmed', 'in_progress', 'Assigned to Dimas', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000001', 'progress_update', '0', '50', 'GM III now', 'worker1@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000001', 'progress_update', '50', '100', 'Epic V reached', 'worker1@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000001', 'status_change', 'in_progress', 'completed', 'Done, winrate 91%', 'worker1@etnyx.id'),
  -- Order 002 (Paket Epic→Legend, completed express)
  ('d0000000-0000-0000-0000-000000000002', 'status_change', 'pending', 'confirmed', 'Express payment confirmed', 'admin'),
  ('d0000000-0000-0000-0000-000000000002', 'status_change', 'confirmed', 'in_progress', 'Rush priority assigned Fajar', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000002', 'progress_update', '0', '100', 'Legend V done in 1 day!', 'worker2@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000002', 'status_change', 'in_progress', 'completed', 'Express completed ahead of time', 'worker2@etnyx.id'),
  -- Order 003 (Paket Legend→Mythic, completed premium)
  ('d0000000-0000-0000-0000-000000000003', 'status_change', 'pending', 'confirmed', 'Premium express payment OK', 'admin'),
  ('d0000000-0000-0000-0000-000000000003', 'status_change', 'confirmed', 'in_progress', 'Top booster ProBoosted assigned', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000003', 'progress_update', '0', '60', 'Legend I achieved', 'worker1@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000003', 'progress_update', '60', '100', 'Mythic reached, winrate 88%', 'worker1@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000003', 'status_change', 'in_progress', 'completed', 'Premium order done', 'worker1@etnyx.id'),
  -- Order 005 (Paket Mythic→Glory, completed)
  ('d0000000-0000-0000-0000-000000000005', 'status_change', 'pending', 'confirmed', 'Payment verified', 'admin'),
  ('d0000000-0000-0000-0000-000000000005', 'status_change', 'confirmed', 'in_progress', 'Assigned ProBoosted', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000005', 'progress_update', '0', '100', 'Mythic Glory reached, 20 star streak', 'worker1@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000005', 'status_change', 'in_progress', 'completed', 'Express+Premium done in 16h', 'worker1@etnyx.id'),
  -- Order 007 (Paket Legend→Glory, in_progress)
  ('d0000000-0000-0000-0000-000000000007', 'status_change', 'pending', 'confirmed', 'Payment confirmed QRIS', 'admin'),
  ('d0000000-0000-0000-0000-000000000007', 'status_change', 'confirmed', 'in_progress', 'Assigned to Dimas Worker', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000007', 'progress_update', '0', '35', 'Currently Mythic III', 'worker1@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000007', 'progress_update', '35', '65', 'Mythic Honor now, pushing Glory', 'worker1@etnyx.id'),
  -- Order 008 (Paket Honor→Immortal, in_progress)
  ('d0000000-0000-0000-0000-000000000008', 'status_change', 'pending', 'confirmed', 'Premium payment verified', 'admin'),
  ('d0000000-0000-0000-0000-000000000008', 'status_change', 'confirmed', 'in_progress', 'ImmortalKing booster assigned', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000008', 'progress_update', '0', '40', 'Mythic Glory reached, pushing Immortal', 'worker2@etnyx.id'),
  -- Order 019 (PerStar Epic 6 star, in_progress)
  ('d0000000-0000-0000-0000-000000000019', 'status_change', 'pending', 'confirmed', 'Payment OK', 'admin'),
  ('d0000000-0000-0000-0000-000000000019', 'status_change', 'confirmed', 'in_progress', 'Assigned Galih', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000019', 'progress_update', '0', '50', '3 of 6 stars done', 'worker3@etnyx.id'),
  -- Order 029 (Gendong Epic 5 star, in_progress)
  ('d0000000-0000-0000-0000-000000000029', 'status_change', 'pending', 'confirmed', 'Paid via transfer', 'admin'),
  ('d0000000-0000-0000-0000-000000000029', 'status_change', 'confirmed', 'in_progress', 'Fajar assigned for duo', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000029', 'progress_update', '0', '60', '3 of 5 stars done, fun duo!', 'worker2@etnyx.id'),
  -- Order 037 (Rush 9 Star Glory, in_progress)
  ('d0000000-0000-0000-0000-000000000037', 'status_change', 'pending', 'confirmed', 'Premium Rush paid', 'admin'),
  ('d0000000-0000-0000-0000-000000000037', 'status_change', 'confirmed', 'in_progress', 'Top booster on it', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000037', 'progress_update', '0', '55', '5 of 9 stars pushed', 'worker3@etnyx.id'),
  -- Order 043 (Gendong Mythic 6 star, in_progress)
  ('d0000000-0000-0000-0000-000000000043', 'status_change', 'pending', 'confirmed', 'Payment confirmed', 'admin'),
  ('d0000000-0000-0000-0000-000000000043', 'status_change', 'confirmed', 'in_progress', 'MythicSlayer duo assigned', 'lead@etnyx.id'),
  ('d0000000-0000-0000-0000-000000000043', 'progress_update', '0', '33', '2 of 6 stars', 'worker2@etnyx.id'),
  -- Order 044 (cancelled)
  ('d0000000-0000-0000-0000-000000000044', 'status_change', 'pending', 'cancelled', 'Customer cancelled - changed mind', 'admin'),
  -- Order 045 (cancelled)
  ('d0000000-0000-0000-0000-000000000045', 'status_change', 'pending', 'cancelled', 'Duplicate order, cancelled by customer', 'admin');

-- =====================
-- 10. ORDER ASSIGNMENTS
-- =====================
INSERT INTO order_assignments (order_id, assigned_to, assigned_by, status, notes) VALUES
  -- Completed orders
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Paket GM→Epic selesai 2 hari'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Express Epic→Legend 1 hari'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Premium Legend→Mythic done'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Epic→Mythic smooth'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Mythic→Glory express+premium 16h'),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 'GM→Legend standard'),
  ('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'completed', 'PerStar GM 5 star cepat'),
  ('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'PerStar Epic 8 star'),
  ('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 'PerStar Legend express 10 star'),
  ('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'PerStar Mythic premium 5 star'),
  ('d0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'completed', 'PerStar Mythic Grading 3'),
  ('d0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'PerStar Mythic Honor 6 star'),
  ('d0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'PerStar Mythic Glory express+premium'),
  ('d0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 'PerStar Mythic Immortal 3'),
  ('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Gendong GM 5 star'),
  ('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Gendong Epic express 8 star'),
  ('d0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Gendong Legend 6 star'),
  ('d0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Gendong Mythic premium 4 star'),
  ('d0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Gendong Mythic Grading 3'),
  ('d0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Gendong MH express 5 star'),
  ('d0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Gendong MG 3 star'),
  ('d0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Gendong MI express+premium 3'),
  ('d0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Rush 5 Star Epic fast'),
  ('d0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Rush 9 Star Epic done'),
  ('d0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Rush 5 Star Legend'),
  ('d0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Rush 5 Star Mythic express'),
  ('d0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Rush 9 Star Mythic done'),
  ('d0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Rush 5 Star MH done'),
  ('d0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Open Grading done'),
  ('d0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Mythic Grading→Glory express'),
  ('d0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 'Glory→Immortal premium'),
  ('d0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'completed', 'PerStar GM min 3 star'),
  -- In-progress orders
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'in_progress', 'Paket Legend→Glory sedang push'),
  ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'in_progress', 'MH→Immortal premium push'),
  ('d0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'in_progress', 'PerStar Epic 6 star ongoing'),
  ('d0000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'in_progress', 'Gendong Epic duo queue'),
  ('d0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'in_progress', 'Rush 9 Star Glory premium'),
  ('d0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'in_progress', 'Gendong Mythic duo push')
ON CONFLICT DO NOTHING;

-- =====================
-- 11. PROMO CODES (5)
-- =====================
INSERT INTO promo_codes (id, code, discount_type, discount_value, min_order, max_discount, max_uses, used_count, is_active, expires_at) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'WELCOME10', 'percentage', 10, 50000, 50000, 100, 12, true, NOW() + INTERVAL '30 days'),
  ('e0000000-0000-0000-0000-000000000002', 'RUSH25K', 'fixed', 25000, 100000, NULL, 50, 18, true, NOW() + INTERVAL '14 days'),
  ('e0000000-0000-0000-0000-000000000003', 'MYTHIC15', 'percentage', 15, 200000, 75000, 20, 8, true, NOW() + INTERVAL '7 days'),
  ('e0000000-0000-0000-0000-000000000004', 'NEWUSER20', 'percentage', 20, 100000, 100000, 50, 5, true, NOW() + INTERVAL '60 days'),
  ('e0000000-0000-0000-0000-000000000005', 'GENDONG10K', 'fixed', 10000, 40000, NULL, 30, 9, true, NOW() + INTERVAL '21 days')
ON CONFLICT (code) DO NOTHING;

-- =====================
-- 12. TESTIMONIALS (12)
-- =====================
INSERT INTO testimonials (name, avatar_url, rank_from, rank_to, rating, comment, is_featured, is_visible) VALUES
  ('Ahmad R.', NULL, 'epic', 'legend', 5, 'Proses cepat banget, 2 hari udah Legend. Booster ramah dan winrate tinggi. Recommended!', true, true),
  ('Dewi K.', NULL, 'grandmaster', 'epic', 5, 'Pertama kali pake joki, awalnya ragu tapi ternyata aman banget. Akun ga kenapa-napa. Thanks ETNYX!', true, true),
  ('Reza M.', NULL, 'legend', 'mythic', 5, 'Udah 3x order disini, selalu puas. Booster jago, progress cepat, support 24/7. The best!', true, true),
  ('Fitri A.', NULL, 'epic', 'mythicglory', 4, 'Dari Epic langsung ke Mythic Glory. Agak lama tapi hasilnya worth it. Booster-nya sabar banget.', false, true),
  ('Yoga P.', NULL, 'mythic', 'mythicglory', 5, 'Express package beneran express. 1 hari selesai! Ga nyesel bayar lebih.', true, true),
  ('Nita S.', NULL, 'grandmaster', 'legend', 5, 'Harga terjangkau, proses transparan bisa dilacak. Pasti order lagi next season!', false, true),
  ('Doni W.', NULL, 'legend', 'mythic', 4, 'Overall bagus, cuma sempat ada delay sehari karena booster lagi full. Tapi CS fast respond.', false, true),
  ('Maya L.', NULL, 'epic', 'legend', 5, 'Gendong service-nya seru! Bisa main bareng booster dan belajar banyak. Rank naik sambil improve skill.', true, true),
  ('Hendra T.', NULL, 'mythicglory', 'mythicimmortal', 5, 'Booster-nya Mythic Immortal beneran. Push dari Glory ke Immortal cuma 2 hari. Gila sih!', true, true),
  ('Lina F.', NULL, 'grandmaster', 'mythic', 5, 'Dari GM langsung ke Mythic, paket hemat tapi hasilnya maximal. Per Star juga bisa, fleksibel!', false, true),
  ('Bayu S.', NULL, 'mythic', 'mythichonor', 4, 'Rush promo harganya worth it banget. 5 star cuma sehari. Booster skill-nya di atas rata-rata.', true, true),
  ('Citra D.', NULL, 'mythichonor', 'mythicglory', 5, 'Gendong service dari Honor ke Glory. Seru main bareng booster pro, sambil belajar rotasi. 10/10!', true, true);

-- =====================
-- 13. PORTFOLIO (8)
-- =====================
INSERT INTO portfolio (title, rank_from, rank_to, description, is_visible) VALUES
  ('Push Rank Epic ke Legend - 2 Hari', 'epic', 'legend', 'Customer request hero Ling & Fanny. Selesai dalam 2 hari dengan winrate 89%.', true),
  ('Rush Mythic Glory - Express', 'mythic', 'mythicglory', 'Express order dari Mythic V ke Mythic Glory. Selesai 18 jam, 15 star winstreak.', true),
  ('GM ke Epic - Budget Package', 'grandmaster', 'epic', 'Paket hemat Grand Master ke Epic. 3 hari smooth, zero loss streak.', true),
  ('Legend ke Mythic - Premium', 'legend', 'mythic', 'Premium package dengan request hero Lancelot. Partner duo queue, winrate 92%.', true),
  ('Mythic Glory ke Immortal - Premium', 'mythicglory', 'mythicimmortal', 'Top booster ImmortalKing push Mythic Glory ke Immortal dalam 2 hari. Winrate 94%, MVP 18x.', true),
  ('Per Star Mythic Honor - 6 Bintang', 'mythichonor', 'mythichonor', 'Per Star service 6 bintang di Mythic Honor. Selesai 8 jam, winrate 86%, zero losing streak.', true),
  ('Gendong Epic - Duo Queue Seru', 'epic', 'epic', 'Customer main bareng booster MythicSlayer. 8 star push sambil belajar macro game. Fun experience!', true),
  ('Rush 9 Star Mythic - Speed Run', 'mythic', 'mythic', 'Rush promo 9 star Mythic. Selesai 12 jam non-stop. Booster pakai hero meta Arlott & Valentina.', true);

-- =====================
-- 14. REWARD CATALOG (7)
-- =====================
INSERT INTO reward_catalog (name, description, category, points_cost, stock, is_active, sort_order) VALUES
  ('Diskon Rp 10.000', 'Potongan Rp 10.000 untuk order berikutnya', 'discount', 100, NULL, true, 1),
  ('Diskon Rp 25.000', 'Potongan Rp 25.000 untuk order berikutnya', 'discount', 230, NULL, true, 2),
  ('Diskon Rp 50.000', 'Potongan Rp 50.000 untuk order berikutnya', 'discount', 430, NULL, true, 3),
  ('Starlight Member 1 Bulan', 'Starlight member pass untuk akun kamu', 'starlight', 500, 5, true, 4),
  ('Skin Epic (Pilihan)', 'Pilih 1 skin Epic yang kamu mau', 'skin', 800, 3, true, 5),
  ('86 Diamonds', '86 diamonds untuk akun ML kamu', 'diamond', 150, 10, true, 6),
  ('296 Diamonds', '296 diamonds untuk akun ML kamu', 'diamond', 400, 5, true, 7);

-- =====================
-- 15. REWARD TRANSACTIONS (20)
-- =====================
INSERT INTO reward_transactions (customer_id, type, points, balance_after, description, order_id) VALUES
  -- Budi (8 orders, 245 points)
  ('c0000000-0000-0000-0000-000000000001', 'earn', 13, 13, 'Poin dari order ETX-260301-001', 'd0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'earn', 25, 38, 'Poin dari order ETX-260302-001 (PerStar)', 'd0000000-0000-0000-0000-000000000011'),
  ('c0000000-0000-0000-0000-000000000001', 'earn', 32, 70, 'Poin dari Rush 5 Star Epic', 'd0000000-0000-0000-0000-000000000031'),
  ('c0000000-0000-0000-0000-000000000001', 'earn', 96, 166, 'Poin dari Gendong Epic express', 'd0000000-0000-0000-0000-000000000022'),
  ('c0000000-0000-0000-0000-000000000001', 'earn', 120, 286, 'Poin dari Open Grading', 'd0000000-0000-0000-0000-000000000039'),
  ('c0000000-0000-0000-0000-000000000001', 'redeem', -41, 245, 'Tukar Diskon Rp 10.000', NULL),
  -- Rina (5 orders, 98 points)
  ('c0000000-0000-0000-0000-000000000002', 'earn', 24, 24, 'Poin dari Paket Epic→Legend express', 'd0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000002', 'earn', 45, 69, 'Poin dari Gendong GM 5 star', 'd0000000-0000-0000-0000-000000000021'),
  ('c0000000-0000-0000-0000-000000000002', 'earn', 56, 125, 'Poin dari Rush 9 Star Epic', 'd0000000-0000-0000-0000-000000000032'),
  ('c0000000-0000-0000-0000-000000000002', 'redeem', -27, 98, 'Tukar Diskon Rp 10.000', NULL),
  -- Andi (12 orders, 480 points)
  ('c0000000-0000-0000-0000-000000000003', 'earn', 38, 38, 'Poin dari Paket Legend→Mythic premium', 'd0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000003', 'earn', 126, 164, 'Poin dari PerStar MH 6 star', 'd0000000-0000-0000-0000-000000000016'),
  ('c0000000-0000-0000-0000-000000000003', 'earn', 109, 273, 'Poin dari Gendong Mythic premium', 'd0000000-0000-0000-0000-000000000024'),
  ('c0000000-0000-0000-0000-000000000003', 'earn', 90, 363, 'Poin dari Gendong MG 3 star', 'd0000000-0000-0000-0000-000000000027'),
  ('c0000000-0000-0000-0000-000000000003', 'earn', 108, 471, 'Poin dari Rush 5 Star Mythic express', 'd0000000-0000-0000-0000-000000000034'),
  ('c0000000-0000-0000-0000-000000000003', 'bonus', 50, 521, 'Bonus upgrade ke Gold tier', NULL),
  ('c0000000-0000-0000-0000-000000000003', 'redeem', -41, 480, 'Tukar Diskon Rp 10.000', NULL),
  -- Mega (10 orders, 560 points → platinum)
  ('c0000000-0000-0000-0000-000000000008', 'earn', 120, 120, 'Poin dari Paket Mythic→Glory express+premium', 'd0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000008', 'earn', 156, 276, 'Poin dari PerStar MG express+premium', 'd0000000-0000-0000-0000-000000000017'),
  ('c0000000-0000-0000-0000-000000000008', 'earn', 93, 369, 'Poin dari PerStar MI 3 star', 'd0000000-0000-0000-0000-000000000018'),
  ('c0000000-0000-0000-0000-000000000008', 'earn', 150, 519, 'Poin dari Gendong MH express', 'd0000000-0000-0000-0000-000000000026'),
  ('c0000000-0000-0000-0000-000000000008', 'earn', 105, 624, 'Poin dari Rush 5 Star MH', 'd0000000-0000-0000-0000-000000000036'),
  ('c0000000-0000-0000-0000-000000000008', 'bonus', 100, 724, 'Bonus upgrade ke Platinum tier', NULL),
  ('c0000000-0000-0000-0000-000000000008', 'redeem', -164, 560, 'Tukar 296 Diamonds', NULL);

-- =====================
-- 16. REFERRALS (4)
-- =====================
INSERT INTO referrals (referrer_id, referred_id, reward_type, reward_value, reward_given) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'discount', 10000, true),
  ('c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'discount', 10000, true),
  ('c0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'discount', 10000, true),
  ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'discount', 10000, false);

-- =====================
-- 17. SETTINGS (CMS)
-- =====================
INSERT INTO settings (key, value) VALUES
  ('social_links', '{"instagram": "https://instagram.com/etnyx_ml", "facebook": "https://facebook.com/etnyx_ml", "tiktok": "https://tiktok.com/@etnyx_ml", "youtube": "https://youtube.com/@etnyx_ml", "whatsapp": "6281414131321"}'::jsonb),
  ('site_info', '{"supportEmail": "support@etnyx.id", "companyName": "PT Sumber Arto Moro Abadi Kreatif"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- =====================
-- 18. REVIEWS & WORKER REPORTS
-- =====================
DELETE FROM reviews WHERE order_id IN (
  'ETX-260301-001','ETX-260305-001','ETX-260308-001','ETX-260310-001','ETX-260312-001',
  'ETX-260315-001','ETX-260302-001','ETX-260306-001','ETX-260309-001','ETX-260311-001',
  'ETX-260303-001','ETX-260307-001','ETX-260313-001','ETX-260316-001','ETX-260319-001',
  'ETX-260304-001','ETX-260310-002','ETX-260312-002','ETX-260316-002','ETX-260322-002'
);

INSERT INTO reviews (
  order_id, customer_id, service_rating, service_comment,
  worker_id, worker_rating, worker_comment,
  has_worker_report, report_type, report_detail, report_status,
  customer_name, customer_whatsapp, rank_from, rank_to,
  is_visible, is_featured, google_reviewed, admin_notes, created_at
) VALUES
  -- 1. BudiGaming — Paket GM→Epic ⭐5
  ('ETX-260301-001', 'c0000000-0000-0000-0000-000000000001', 5, 'Mantap banget, cepat selesai dan winrate bagus! Recommended!',
   'b0000000-0000-0000-0000-000000000003', 5, 'Booster ramah dan profesional',
   false, NULL, NULL, 'pending',
   'BudiGaming', '081400001111', 'grandmaster', 'epic',
   true, true, true, NULL, NOW() - INTERVAL '29 days'),

  -- 2. RinaML — Paket Epic→Legend ⭐5
  ('ETX-260305-001', 'c0000000-0000-0000-0000-000000000002', 5, 'Express service super cepat! Kurang dari 24 jam udah selesai.',
   'b0000000-0000-0000-0000-000000000002', 5, 'Very professional, fast response',
   false, NULL, NULL, 'pending',
   'RinaML', '081400002222', 'epic', 'legend',
   true, true, true, NULL, NOW() - INTERVAL '24 days'),

  -- 3. AndiPro — Paket Legend→Mythic ⭐4
  ('ETX-260308-001', 'c0000000-0000-0000-0000-000000000003', 4, 'Good service, sampai mythic dengan lancar. Sedikit lama tapi worth it.',
   'b0000000-0000-0000-0000-000000000001', 4, 'Skill bagus, komunikasi cukup baik',
   false, NULL, NULL, 'pending',
   'AndiPro', '081400003333', 'legend', 'mythic',
   true, false, true, NULL, NOW() - INTERVAL '21 days'),

  -- 4. FarhanGG — Paket Epic→Mythic ⭐5
  ('ETX-260310-001', 'c0000000-0000-0000-0000-000000000005', 5, 'Gilaa dari Epic langsung ke Mythic! Service terbaik!',
   'b0000000-0000-0000-0000-000000000001', 5, 'Booster dewa, winrate 95%!',
   false, NULL, NULL, 'pending',
   'FarhanGG', '081400005555', 'epic', 'mythic',
   true, true, false, NULL, NOW() - INTERVAL '19 days'),

  -- 5. MegaStar — Paket Mythic→MG ⭐5
  ('ETX-260312-001', 'c0000000-0000-0000-0000-000000000008', 5, 'Mythic Glory tercapai! Worth every penny. Premium pilot mantap.',
   'b0000000-0000-0000-0000-000000000001', 5, 'Top tier booster, very skilled',
   false, NULL, NULL, 'pending',
   'MegaStar', '081400008888', 'mythic', 'mythicglory',
   true, true, true, NULL, NOW() - INTERVAL '17 days'),

  -- 6. DianaQ — Paket GM→Legend ⭐4
  ('ETX-260315-001', 'c0000000-0000-0000-0000-000000000006', 4, 'Proses lancar, admin responsive. Overall puas!',
   'b0000000-0000-0000-0000-000000000004', 4, 'Booster ramah dan sopan',
   false, NULL, NULL, 'pending',
   'DianaQ', '081400006666', 'grandmaster', 'legend',
   true, false, false, NULL, NOW() - INTERVAL '14 days'),

  -- 7. BudiGaming — Per Star GM ⭐5
  ('ETX-260302-001', 'c0000000-0000-0000-0000-000000000001', 5, 'Per star service bagus, bisa pilih mau berapa bintang.',
   'b0000000-0000-0000-0000-000000000004', 5, 'Tepat waktu dan rapi',
   false, NULL, NULL, 'pending',
   'BudiGaming', '081400001111', 'grandmaster', 'grandmaster',
   true, false, true, NULL, NOW() - INTERVAL '27 days'),

  -- 8. SitiGamer — Per Star Epic ⭐3 (average)
  ('ETX-260306-001', 'c0000000-0000-0000-0000-000000000004', 3, 'Selesai sih tapi agak lama prosesnya. Komunikasi kurang.',
   'b0000000-0000-0000-0000-000000000003', 3, 'Response time bisa lebih cepat',
   false, NULL, NULL, 'pending',
   'SitiGamer', '081400004444', 'epic', 'epic',
   true, false, false, NULL, NOW() - INTERVAL '23 days'),

  -- 9. DianaQ — Per Star Legend ⭐5 (express)
  ('ETX-260309-001', 'c0000000-0000-0000-0000-000000000006', 5, 'Express per star legend cepat banget! Selesai dalam hitungan jam.',
   'b0000000-0000-0000-0000-000000000002', 5, 'Speed demon! Sangat cepat',
   false, NULL, NULL, 'pending',
   'DianaQ', '081400006666', 'legend', 'legend',
   true, true, false, NULL, NOW() - INTERVAL '20 days'),

  -- 10. FarhanGG — Per Star Mythic ⭐4 (with WORKER REPORT - offering_services)
  ('ETX-260311-001', 'c0000000-0000-0000-0000-000000000005', 4, 'Boost selesai dengan baik, tapi ada masalah kecil.',
   'b0000000-0000-0000-0000-000000000001', 2, 'Booster nawarin jasa di luar ETNYX',
   true, 'offering_services', 'Booster chat saya nawarin jasa boost langsung tanpa lewat ETNYX, katanya lebih murah. Saya tolak sih tapi mohon ditindak.', 'reviewed',
   'FarhanGG', '081400005555', 'mythic', 'mythic',
   true, false, false, 'Sudah ditegur via DM. Warning pertama.', NOW() - INTERVAL '18 days'),

  -- 11. RinaML — Gendong GM ⭐5
  ('ETX-260303-001', 'c0000000-0000-0000-0000-000000000002', 5, 'Gendong GM seru banget! Booster sabar nemenin main.',
   'b0000000-0000-0000-0000-000000000004', 5, 'Duo partner yang asik dan jago',
   false, NULL, NULL, 'pending',
   'RinaML', '081400002222', 'grandmaster', 'grandmaster',
   true, false, true, NULL, NOW() - INTERVAL '26 days'),

  -- 12. BudiGaming — Gendong Epic ⭐4
  ('ETX-260307-001', 'c0000000-0000-0000-0000-000000000001', 4, 'Gendong Epic fun! Belajar banyak dari booster.',
   'b0000000-0000-0000-0000-000000000002', 4, 'Good duo partner, komunikatif',
   false, NULL, NULL, 'pending',
   'BudiGaming', '081400001111', 'epic', 'epic',
   true, false, false, NULL, NOW() - INTERVAL '22 days'),

  -- 13. FarhanGG — Gendong Legend ⭐5
  ('ETX-260313-001', 'c0000000-0000-0000-0000-000000000005', 5, 'Best gendong service! Carry team terus sampe menang.',
   'b0000000-0000-0000-0000-000000000002', 5, 'Carry god, MVP terus',
   false, NULL, NULL, 'pending',
   'FarhanGG', '081400005555', 'legend', 'legend',
   true, true, false, NULL, NOW() - INTERVAL '15 days'),

  -- 14. AndiPro — Gendong Mythic ⭐4 (with WORKER REPORT - rude)
  ('ETX-260316-001', 'c0000000-0000-0000-0000-000000000003', 4, 'Boost selesai tapi booster agak kasar di chat.',
   'b0000000-0000-0000-0000-000000000001', 2, 'Kurang sopan saat komunikasi',
   true, 'rude', 'Pas saya tanya progress, booster bales dengan nada kasar kayak "sabar dong, gw lagi push". Tolong diperhatikan attitude nya.', 'resolved',
   'AndiPro', '081400003333', 'mythic', 'mythic',
   true, false, false, 'Sudah mediasi. Booster minta maaf. Case closed.', NOW() - INTERVAL '12 days'),

  -- 15. DianaQ — Gendong Grading ⭐5
  ('ETX-260319-001', 'c0000000-0000-0000-0000-000000000006', 5, 'Gendong mythic grading lancar! Booster jago banget.',
   'b0000000-0000-0000-0000-000000000001', 5, 'Sangat terampil di rank tinggi',
   false, NULL, NULL, 'pending',
   'DianaQ', '081400006666', 'mythicgrading', 'mythicgrading',
   true, false, false, NULL, NOW() - INTERVAL '10 days'),

  -- 16. BudiGaming — Rush Epic ⭐5
  ('ETX-260304-001', 'c0000000-0000-0000-0000-000000000001', 5, 'Rush promo murah dan cepat! Pasti order lagi.',
   'b0000000-0000-0000-0000-000000000003', 5, 'Cepat dan efisien',
   false, NULL, NULL, 'pending',
   'BudiGaming', '081400001111', 'epic', 'epic',
   true, false, true, NULL, NOW() - INTERVAL '25 days'),

  -- 17. RinaML — Rush Epic ⭐4
  ('ETX-260310-002', 'c0000000-0000-0000-0000-000000000002', 4, 'Rush 9 star selesai tepat waktu. Recommended!',
   'b0000000-0000-0000-0000-000000000003', 4, 'Konsisten performanya',
   false, NULL, NULL, 'pending',
   'RinaML', '081400002222', 'epic', 'epic',
   true, false, false, NULL, NOW() - INTERVAL '19 days'),

  -- 18. FarhanGG — Rush Legend ⭐5 (with WORKER REPORT - account_issue)
  ('ETX-260312-002', 'c0000000-0000-0000-0000-000000000005', 5, 'Boost selesai bagus, tapi ada issue kecil di awal.',
   'b0000000-0000-0000-0000-000000000002', 4, 'Boost bagus, tapi sempat salah login',
   true, 'account_issue', 'Di awal booster sempat salah masukkan password 3x sampe akun ke-lock 5 menit. Untung cepat resolved. Mungkin perlu double check credentials.', 'dismissed',
   'FarhanGG', '081400005555', 'legend', 'legend',
   true, false, false, 'Minor issue, sudah normal kembali. Credentials sudah di-verify.', NOW() - INTERVAL '17 days'),

  -- 19. AndiPro — Rush Mythic ⭐5
  ('ETX-260316-002', 'c0000000-0000-0000-0000-000000000003', 5, 'Express rush mythic combo! Selesai lebih cepat dari estimasi.',
   'b0000000-0000-0000-0000-000000000001', 5, 'Speed + skill = perfect combo',
   false, NULL, NULL, 'pending',
   'AndiPro', '081400003333', 'mythic', 'mythic',
   true, false, true, NULL, NOW() - INTERVAL '12 days'),

  -- 20. MegaStar — Paket Glory→Immortal ⭐5
  ('ETX-260322-002', 'c0000000-0000-0000-0000-000000000008', 5, 'Dari Mythic Glory ke Immortal! Tidak percaya bisa secepat ini. ETNYX the best!',
   'b0000000-0000-0000-0000-000000000005', 5, 'Top 1 booster ETNYX, tidak diragukan lagi',
   false, NULL, NULL, 'pending',
   'MegaStar', '081400008888', 'mythicglory', 'mythicimmortal',
   true, true, true, NULL, NOW() - INTERVAL '6 days');

-- =====================
-- 11. PAYROLL - Staff Salaries (lead gets monthly salary)
-- =====================
INSERT INTO staff_salaries (id, staff_id, base_salary, allowances, effective_from, effective_to, notes) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1500000,
   '[{"name": "Transport", "amount": 200000}, {"name": "Internet", "amount": 150000}]'::jsonb,
   (CURRENT_DATE - INTERVAL '60 days')::date, NULL, 'Lead - base salary + allowances')
ON CONFLICT (staff_id, effective_from) DO NOTHING;

-- =====================
-- 12. PAYROLL - Salary Records (last 2 months for lead)
-- =====================
INSERT INTO salary_records (id, staff_id, salary_config_id, period_month, period_year, base_salary, allowances_total, deductions, deduction_notes, bonus_amount, bonus_notes, total_amount, status) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
   EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '30 days')::int,
   EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '30 days')::int,
   1500000, 350000, 0, NULL, 0, NULL, 1850000, 'paid'),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
   EXTRACT(MONTH FROM CURRENT_DATE)::int,
   EXTRACT(YEAR FROM CURRENT_DATE)::int,
   1500000, 350000, 0, NULL, 0, NULL, 1850000, 'pending')
ON CONFLICT (staff_id, period_month, period_year) DO NOTHING;

-- =====================
-- 13. PAYROLL - Commissions (60% of total_price for completed orders)
-- =====================
INSERT INTO commissions (order_id, order_code, worker_id, order_total, commission_rate, commission_amount, bonus_amount, total_amount, status, period_start, period_end) VALUES
  -- Worker Dimas (a...002): 12 completed orders
  ('d0000000-0000-0000-0000-000000000001', 'ETX-260301-001', 'a0000000-0000-0000-0000-000000000002', 125000, 0.60, 75000, 0, 75000, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000003', 'ETX-260308-001', 'a0000000-0000-0000-0000-000000000002', 375000, 0.60, 225000, 0, 225000, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000005', 'ETX-260312-001', 'a0000000-0000-0000-0000-000000000002', 1200000, 0.60, 720000, 0, 720000, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000012', 'ETX-260306-001', 'a0000000-0000-0000-0000-000000000002', 52000, 0.60, 31200, 0, 31200, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000014', 'ETX-260311-001', 'a0000000-0000-0000-0000-000000000002', 117000, 0.60, 70200, 0, 70200, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000016', 'ETX-260318-001', 'a0000000-0000-0000-0000-000000000002', 126000, 0.60, 75600, 0, 75600, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000017', 'ETX-260320-001', 'a0000000-0000-0000-0000-000000000002', 156000, 0.60, 93600, 0, 93600, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000023', 'ETX-260313-001', 'a0000000-0000-0000-0000-000000000002', 66000, 0.60, 39600, 0, 39600, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000026', 'ETX-260321-001', 'a0000000-0000-0000-0000-000000000002', 150000, 0.60, 90000, 0, 90000, 'pending',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000027', 'ETX-260325-001', 'a0000000-0000-0000-0000-000000000002', 90000, 0.60, 54000, 0, 54000, 'pending',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000032', 'ETX-260310-002', 'a0000000-0000-0000-0000-000000000002', 56000, 0.60, 33600, 0, 33600, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000034', 'ETX-260316-002', 'a0000000-0000-0000-0000-000000000002', 108000, 0.60, 64800, 0, 64800, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000036', 'ETX-260325-002', 'a0000000-0000-0000-0000-000000000002', 105000, 0.60, 63000, 0, 63000, 'pending',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000039', 'ETX-260315-002', 'a0000000-0000-0000-0000-000000000002', 120000, 0.60, 72000, 0, 72000, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),

  -- Worker Fajar (a...003): 8 completed orders
  ('d0000000-0000-0000-0000-000000000002', 'ETX-260305-001', 'a0000000-0000-0000-0000-000000000003', 240000, 0.60, 144000, 0, 144000, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000006', 'ETX-260315-001', 'a0000000-0000-0000-0000-000000000003', 325000, 0.60, 195000, 0, 195000, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000013', 'ETX-260309-001', 'a0000000-0000-0000-0000-000000000003', 90000, 0.60, 54000, 0, 54000, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000018', 'ETX-260322-001', 'a0000000-0000-0000-0000-000000000003', 93000, 0.60, 55800, 0, 55800, 'pending',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000022', 'ETX-260307-001', 'a0000000-0000-0000-0000-000000000003', 96000, 0.60, 57600, 0, 57600, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000024', 'ETX-260316-001', 'a0000000-0000-0000-0000-000000000003', 109200, 0.60, 65520, 0, 65520, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000033', 'ETX-260312-002', 'a0000000-0000-0000-0000-000000000003', 37000, 0.60, 22200, 0, 22200, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000040', 'ETX-260318-002', 'a0000000-0000-0000-0000-000000000003', 720000, 0.60, 432000, 0, 432000, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),

  -- Worker Galih (a...004): 6 completed orders
  ('d0000000-0000-0000-0000-000000000004', 'ETX-260310-001', 'a0000000-0000-0000-0000-000000000004', 450000, 0.60, 270000, 0, 270000, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000011', 'ETX-260302-001', 'a0000000-0000-0000-0000-000000000004', 25000, 0.60, 15000, 0, 15000, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000015', 'ETX-260314-001', 'a0000000-0000-0000-0000-000000000004', 60000, 0.60, 36000, 0, 36000, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000021', 'ETX-260303-001', 'a0000000-0000-0000-0000-000000000004', 45000, 0.60, 27000, 0, 27000, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000025', 'ETX-260319-001', 'a0000000-0000-0000-0000-000000000004', 69000, 0.60, 41400, 0, 41400, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date),
  ('d0000000-0000-0000-0000-000000000031', 'ETX-260304-001', 'a0000000-0000-0000-0000-000000000004', 32000, 0.60, 19200, 0, 19200, 'paid',
   (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '16 days')::date),
  ('d0000000-0000-0000-0000-000000000035', 'ETX-260320-002', 'a0000000-0000-0000-0000-000000000004', 155000, 0.60, 93000, 0, 93000, 'approved',
   (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '1 day')::date)
ON CONFLICT (order_id, worker_id) DO NOTHING;

-- ============================================
-- DONE! Comprehensive seed data inserted.
-- ============================================
-- 4 staff, 5 boosters, 8 customers
-- 45 orders total:
--   10 Paket (package boost) — all rank combos
--   10 Per Star — all rank tiers (GM/Epic/Legend/Mythic/Grading/Honor/Glory/Immortal)
--   10 Gendong (duo) — all rank tiers
--    8 Rush Promo — various star counts
--    7 Extra mixed (Open Grading, MG→Glory, Glory→Immortal, cancelled, etc.)
--
-- Status breakdown:
--   32 completed, 6 in_progress, 2 confirmed, 3 pending, 3 cancelled
--
-- All services covered:
--   ✅ Paket (package boost)
--   ✅ Per Star (flexible)
--   ✅ Gendong (duo boost)
--   ✅ Rush Promo
--   ✅ Express add-on
--   ✅ Premium Pilot add-on
--   ✅ All ranks: GM/Epic/Legend/Mythic/Grading/Honor/Glory/Immortal
--
-- 5 promo codes, 12 testimonials, 8 portfolios
-- 7 reward catalog, 24 transactions, 4 referrals
-- 20 reviews (3 with worker reports), 6 featured, 8 google_reviewed
-- Payroll: 2 salary configs, 10+ commissions (auto-generated from completed orders)
-- ============================================
