-- ============================================
-- ETNYX Fake Seed Data
-- Jalankan SETELAH supabase-schema-v10.sql
-- Data ini untuk testing/demo saja
-- ============================================

-- Password: "test1234" (bcrypt hash, 12 rounds)
-- Semua customer pakai password yang sama untuk testing

-- ============ FAKE CUSTOMERS ============
INSERT INTO customers (id, email, password_hash, name, whatsapp, total_orders, total_spent, referral_code, is_verified, reward_points, reward_tier, lifetime_points, created_at, last_login_at)
VALUES
  -- Platinum tier customer (heavy spender)
  ('a1000000-0000-0000-0000-000000000001', 'aldo.gaming@gmail.com',
   '$2b$12$E2J1DN7EY0uXHkt2md/IgupkMhWzA6.v35NoO1cAZtnJvM7BR28H2',
   'Aldo Gaming', '6281234567001', 12, 3500000, 'ALDO2024', TRUE,
   350, 'platinum', 3500, '2025-08-15T10:00:00Z', '2026-04-04T14:30:00Z'),

  -- Gold tier customer
  ('a1000000-0000-0000-0000-000000000002', 'sari.mlbb@gmail.com',
   '$2b$12$E2J1DN7EY0uXHkt2md/IgupkMhWzA6.v35NoO1cAZtnJvM7BR28H2',
   'Sari MLBB', '6281234567002', 7, 1800000, 'SARI2024', TRUE,
   180, 'gold', 1800, '2025-10-20T08:00:00Z', '2026-04-03T20:15:00Z'),

  -- Silver tier customer
  ('a1000000-0000-0000-0000-000000000003', 'budi.pro@gmail.com',
   '$2b$12$E2J1DN7EY0uXHkt2md/IgupkMhWzA6.v35NoO1cAZtnJvM7BR28H2',
   'Budi Pro Player', '6281234567003', 4, 750000, 'BUDI2024', TRUE,
   75, 'silver', 750, '2025-12-01T12:00:00Z', '2026-04-02T18:00:00Z'),

  -- Silver tier customer
  ('a1000000-0000-0000-0000-000000000004', 'dina.rank@gmail.com',
   '$2b$12$E2J1DN7EY0uXHkt2md/IgupkMhWzA6.v35NoO1cAZtnJvM7BR28H2',
   'Dina Ranker', '6281234567004', 3, 600000, 'DINA2024', TRUE,
   60, 'silver', 600, '2026-01-10T09:00:00Z', '2026-04-01T10:00:00Z'),

  -- Bronze tier customer (new)
  ('a1000000-0000-0000-0000-000000000005', 'rizky.newbie@gmail.com',
   '$2b$12$E2J1DN7EY0uXHkt2md/IgupkMhWzA6.v35NoO1cAZtnJvM7BR28H2',
   'Rizky Newbie', '6281234567005', 1, 150000, 'RIZKY2024', TRUE,
   15, 'bronze', 15, '2026-03-01T14:00:00Z', '2026-04-04T09:00:00Z'),

  -- Bronze tier customer (baru register, belum order)
  ('a1000000-0000-0000-0000-000000000006', 'maya.gamer@gmail.com',
   '$2b$12$E2J1DN7EY0uXHkt2md/IgupkMhWzA6.v35NoO1cAZtnJvM7BR28H2',
   'Maya Gamer', '6281234567006', 0, 0, 'MAYA2024', TRUE,
   0, 'bronze', 0, '2026-04-01T11:00:00Z', '2026-04-04T16:00:00Z'),

  -- Gold tier - loyal customer
  ('a1000000-0000-0000-0000-000000000007', 'fajar.mythic@gmail.com',
   '$2b$12$E2J1DN7EY0uXHkt2md/IgupkMhWzA6.v35NoO1cAZtnJvM7BR28H2',
   'Fajar Mythic', '6281234567007', 8, 2200000, 'FAJAR2024', TRUE,
   220, 'gold', 1200, '2025-09-05T07:00:00Z', '2026-04-05T08:00:00Z'),

  -- Bronze tier - casual
  ('a1000000-0000-0000-0000-000000000008', 'lina.casual@gmail.com',
   '$2b$12$E2J1DN7EY0uXHkt2md/IgupkMhWzA6.v35NoO1cAZtnJvM7BR28H2',
   'Lina Casual', '6281234567008', 2, 350000, 'LINA2024', TRUE,
   35, 'bronze', 35, '2026-02-14T13:00:00Z', '2026-04-03T11:00:00Z')

ON CONFLICT (email) DO NOTHING;


-- ============ FAKE ORDERS ============
-- Aldo Gaming - 12 orders (mix of statuses)
INSERT INTO orders (id, order_id, username, game_id, whatsapp, current_rank, target_rank, package, base_price, total_price, status, progress, created_at, updated_at, completed_at, customer_id)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'ETX-ALDO-001', 'AldoGaming', '12345678 (1234)', '6281234567001', 'Epic I', 'Legend V', 'rank-boost', 250000, 250000, 'completed', 100, '2025-09-01T10:00:00Z', '2025-09-03T18:00:00Z', '2025-09-03T18:00:00Z', 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000002', 'ETX-ALDO-002', 'AldoGaming', '12345678 (1234)', '6281234567001', 'Legend V', 'Legend I', 'rank-boost', 300000, 300000, 'completed', 100, '2025-10-15T08:00:00Z', '2025-10-17T20:00:00Z', '2025-10-17T20:00:00Z', 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000003', 'ETX-ALDO-003', 'AldoGaming', '12345678 (1234)', '6281234567001', 'Legend I', 'Mythic V', 'rank-boost', 350000, 350000, 'completed', 100, '2025-11-20T12:00:00Z', '2025-11-23T15:00:00Z', '2025-11-23T15:00:00Z', 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000004', 'ETX-ALDO-004', 'AldoGaming', '12345678 (1234)', '6281234567001', 'Mythic V', 'Mythic III', 'rank-boost', 400000, 400000, 'completed', 100, '2026-01-05T09:00:00Z', '2026-01-08T14:00:00Z', '2026-01-08T14:00:00Z', 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000005', 'ETX-ALDO-005', 'AldoGaming', '12345678 (1234)', '6281234567001', 'Mythic III', 'Mythic I', 'rank-boost', 500000, 500000, 'completed', 100, '2026-02-10T11:00:00Z', '2026-02-13T19:00:00Z', '2026-02-13T19:00:00Z', 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000006', 'ETX-ALDO-006', 'AldoGaming', '12345678 (1234)', '6281234567001', 'Mythic I', 'Mythical Glory', 'rank-boost', 700000, 700000, 'in_progress', 65, '2026-04-01T10:00:00Z', '2026-04-04T16:00:00Z', NULL, 'a1000000-0000-0000-0000-000000000001'),

  -- Sari MLBB - 7 orders
  ('b1000000-0000-0000-0000-000000000010', 'ETX-SARI-001', 'SariMLBB', '87654321 (5678)', '6281234567002', 'Grandmaster I', 'Epic V', 'rank-boost', 200000, 200000, 'completed', 100, '2025-11-01T08:00:00Z', '2025-11-02T20:00:00Z', '2025-11-02T20:00:00Z', 'a1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000011', 'ETX-SARI-002', 'SariMLBB', '87654321 (5678)', '6281234567002', 'Epic V', 'Epic I', 'rank-boost', 250000, 250000, 'completed', 100, '2025-12-10T10:00:00Z', '2025-12-12T16:00:00Z', '2025-12-12T16:00:00Z', 'a1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000012', 'ETX-SARI-003', 'SariMLBB', '87654321 (5678)', '6281234567002', 'Epic I', 'Legend III', 'rank-boost', 300000, 300000, 'completed', 100, '2026-01-20T14:00:00Z', '2026-01-22T18:00:00Z', '2026-01-22T18:00:00Z', 'a1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000013', 'ETX-SARI-004', 'SariMLBB', '87654321 (5678)', '6281234567002', 'Legend III', 'Legend I', 'rank-boost', 250000, 250000, 'completed', 100, '2026-02-15T09:00:00Z', '2026-02-17T12:00:00Z', '2026-02-17T12:00:00Z', 'a1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000014', 'ETX-SARI-005', 'SariMLBB', '87654321 (5678)', '6281234567002', 'Legend I', 'Mythic V', 'rank-boost', 350000, 350000, 'completed', 100, '2026-03-05T11:00:00Z', '2026-03-08T15:00:00Z', '2026-03-08T15:00:00Z', 'a1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000015', 'ETX-SARI-006', 'SariMLBB', '87654321 (5678)', '6281234567002', 'Mythic V', 'Mythic III', 'rank-boost', 400000, 400000, 'confirmed', 0, '2026-04-03T08:00:00Z', '2026-04-03T10:00:00Z', NULL, 'a1000000-0000-0000-0000-000000000002'),

  -- Budi Pro - 4 orders
  ('b1000000-0000-0000-0000-000000000020', 'ETX-BUDI-001', 'BudiPro', '11223344 (9012)', '6281234567003', 'Epic III', 'Legend V', 'rank-boost', 200000, 200000, 'completed', 100, '2026-01-05T13:00:00Z', '2026-01-07T17:00:00Z', '2026-01-07T17:00:00Z', 'a1000000-0000-0000-0000-000000000003'),
  ('b1000000-0000-0000-0000-000000000021', 'ETX-BUDI-002', 'BudiPro', '11223344 (9012)', '6281234567003', 'Legend V', 'Legend I', 'rank-boost', 250000, 250000, 'completed', 100, '2026-02-20T10:00:00Z', '2026-02-22T14:00:00Z', '2026-02-22T14:00:00Z', 'a1000000-0000-0000-0000-000000000003'),
  ('b1000000-0000-0000-0000-000000000022', 'ETX-BUDI-003', 'BudiPro', '11223344 (9012)', '6281234567003', 'Legend I', 'Mythic V', 'rank-boost', 300000, 300000, 'completed', 100, '2026-03-15T09:00:00Z', '2026-03-18T12:00:00Z', '2026-03-18T12:00:00Z', 'a1000000-0000-0000-0000-000000000003'),
  ('b1000000-0000-0000-0000-000000000023', 'ETX-BUDI-004', 'BudiPro', '11223344 (9012)', '6281234567003', 'Mythic V', 'Mythic III', 'rank-boost', 400000, 400000, 'in_progress', 40, '2026-04-02T11:00:00Z', '2026-04-04T15:00:00Z', NULL, 'a1000000-0000-0000-0000-000000000003'),

  -- Dina Ranker - 3 orders
  ('b1000000-0000-0000-0000-000000000030', 'ETX-DINA-001', 'DinaRanker', '55667788 (3456)', '6281234567004', 'Grandmaster III', 'Epic V', 'rank-boost', 150000, 150000, 'completed', 100, '2026-01-20T08:00:00Z', '2026-01-21T18:00:00Z', '2026-01-21T18:00:00Z', 'a1000000-0000-0000-0000-000000000004'),
  ('b1000000-0000-0000-0000-000000000031', 'ETX-DINA-002', 'DinaRanker', '55667788 (3456)', '6281234567004', 'Epic V', 'Epic I', 'rank-boost', 200000, 200000, 'completed', 100, '2026-02-25T10:00:00Z', '2026-02-27T14:00:00Z', '2026-02-27T14:00:00Z', 'a1000000-0000-0000-0000-000000000004'),
  ('b1000000-0000-0000-0000-000000000032', 'ETX-DINA-003', 'DinaRanker', '55667788 (3456)', '6281234567004', 'Epic I', 'Legend III', 'rank-boost', 250000, 250000, 'completed', 100, '2026-03-20T12:00:00Z', '2026-03-22T16:00:00Z', '2026-03-22T16:00:00Z', 'a1000000-0000-0000-0000-000000000004'),

  -- Rizky Newbie - 1 order
  ('b1000000-0000-0000-0000-000000000040', 'ETX-RIZK-001', 'RizkyNewbie', '99887766 (7890)', '6281234567005', 'Warrior I', 'Elite V', 'rank-boost', 100000, 100000, 'completed', 100, '2026-03-10T14:00:00Z', '2026-03-11T10:00:00Z', '2026-03-11T10:00:00Z', 'a1000000-0000-0000-0000-000000000005'),

  -- Fajar Mythic - 8 orders
  ('b1000000-0000-0000-0000-000000000050', 'ETX-FAJR-001', 'FajarMythic', '44556677 (2345)', '6281234567007', 'Legend III', 'Legend I', 'rank-boost', 200000, 200000, 'completed', 100, '2025-10-01T10:00:00Z', '2025-10-03T12:00:00Z', '2025-10-03T12:00:00Z', 'a1000000-0000-0000-0000-000000000007'),
  ('b1000000-0000-0000-0000-000000000051', 'ETX-FAJR-002', 'FajarMythic', '44556677 (2345)', '6281234567007', 'Legend I', 'Mythic V', 'rank-boost', 300000, 300000, 'completed', 100, '2025-11-15T09:00:00Z', '2025-11-18T14:00:00Z', '2025-11-18T14:00:00Z', 'a1000000-0000-0000-0000-000000000007'),
  ('b1000000-0000-0000-0000-000000000052', 'ETX-FAJR-003', 'FajarMythic', '44556677 (2345)', '6281234567007', 'Mythic V', 'Mythic III', 'rank-boost', 350000, 350000, 'completed', 100, '2026-01-10T11:00:00Z', '2026-01-13T15:00:00Z', '2026-01-13T15:00:00Z', 'a1000000-0000-0000-0000-000000000007'),
  ('b1000000-0000-0000-0000-000000000053', 'ETX-FAJR-004', 'FajarMythic', '44556677 (2345)', '6281234567007', 'Mythic III', 'Mythic I', 'rank-boost', 450000, 450000, 'completed', 100, '2026-02-20T08:00:00Z', '2026-02-23T18:00:00Z', '2026-02-23T18:00:00Z', 'a1000000-0000-0000-0000-000000000007'),
  ('b1000000-0000-0000-0000-000000000054', 'ETX-FAJR-005', 'FajarMythic', '44556677 (2345)', '6281234567007', 'Mythic I', 'Mythical Glory', 'rank-boost', 600000, 600000, 'completed', 100, '2026-03-10T10:00:00Z', '2026-03-14T20:00:00Z', '2026-03-14T20:00:00Z', 'a1000000-0000-0000-0000-000000000007'),
  ('b1000000-0000-0000-0000-000000000055', 'ETX-FAJR-006', 'FajarMythic', '44556677 (2345)', '6281234567007', 'Mythic V', 'Mythic I', 'rank-boost', 500000, 500000, 'pending', 0, '2026-04-04T07:00:00Z', '2026-04-04T07:00:00Z', NULL, 'a1000000-0000-0000-0000-000000000007'),

  -- Lina Casual - 2 orders
  ('b1000000-0000-0000-0000-000000000060', 'ETX-LINA-001', 'LinaCasual', '33221100 (6789)', '6281234567008', 'Elite I', 'Grandmaster V', 'rank-boost', 150000, 150000, 'completed', 100, '2026-02-20T13:00:00Z', '2026-02-21T17:00:00Z', '2026-02-21T17:00:00Z', 'a1000000-0000-0000-0000-000000000008'),
  ('b1000000-0000-0000-0000-000000000061', 'ETX-LINA-002', 'LinaCasual', '33221100 (6789)', '6281234567008', 'Grandmaster V', 'Epic V', 'rank-boost', 200000, 200000, 'completed', 100, '2026-03-25T10:00:00Z', '2026-03-27T14:00:00Z', '2026-03-27T14:00:00Z', 'a1000000-0000-0000-0000-000000000008')

ON CONFLICT (order_id) DO NOTHING;


-- ============ REWARD TRANSACTIONS ============
-- Simulating earn history from completed orders

-- Aldo (5 completed orders = 25+30+35+40+50 = 180 earned, spent 530 on catalog, has 350 left... adjusted)
INSERT INTO reward_transactions (customer_id, type, points, balance_after, description, order_id, created_by, created_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'earn', 25, 25, 'Poin dari order ETX-ALDO-001', 'b1000000-0000-0000-0000-000000000001', 'system', '2025-09-03T18:00:00Z'),
  ('a1000000-0000-0000-0000-000000000001', 'earn', 30, 55, 'Poin dari order ETX-ALDO-002', 'b1000000-0000-0000-0000-000000000002', 'system', '2025-10-17T20:00:00Z'),
  ('a1000000-0000-0000-0000-000000000001', 'earn', 35, 90, 'Poin dari order ETX-ALDO-003', 'b1000000-0000-0000-0000-000000000003', 'system', '2025-11-23T15:00:00Z'),
  ('a1000000-0000-0000-0000-000000000001', 'earn', 40, 130, 'Poin dari order ETX-ALDO-004', 'b1000000-0000-0000-0000-000000000004', 'system', '2026-01-08T14:00:00Z'),
  ('a1000000-0000-0000-0000-000000000001', 'earn', 50, 180, 'Poin dari order ETX-ALDO-005', 'b1000000-0000-0000-0000-000000000005', 'system', '2026-02-13T19:00:00Z'),
  ('a1000000-0000-0000-0000-000000000001', 'bonus', 200, 380, 'Bonus loyal customer Platinum', NULL, 'admin', '2026-03-01T10:00:00Z'),
  ('a1000000-0000-0000-0000-000000000001', 'redeem', -30, 350, 'Tukar: Diskon 50rb untuk order', NULL, 'system', '2026-03-15T12:00:00Z'),

  -- Sari (5 completed = 20+25+30+25+35 = 135 earned + bonus 50 = 185, spent 5 => 180)
  ('a1000000-0000-0000-0000-000000000002', 'earn', 20, 20, 'Poin dari order ETX-SARI-001', 'b1000000-0000-0000-0000-000000000010', 'system', '2025-11-02T20:00:00Z'),
  ('a1000000-0000-0000-0000-000000000002', 'earn', 25, 45, 'Poin dari order ETX-SARI-002', 'b1000000-0000-0000-0000-000000000011', 'system', '2025-12-12T16:00:00Z'),
  ('a1000000-0000-0000-0000-000000000002', 'earn', 30, 75, 'Poin dari order ETX-SARI-003', 'b1000000-0000-0000-0000-000000000012', 'system', '2026-01-22T18:00:00Z'),
  ('a1000000-0000-0000-0000-000000000002', 'earn', 25, 100, 'Poin dari order ETX-SARI-004', 'b1000000-0000-0000-0000-000000000013', 'system', '2026-02-17T12:00:00Z'),
  ('a1000000-0000-0000-0000-000000000002', 'earn', 35, 135, 'Poin dari order ETX-SARI-005', 'b1000000-0000-0000-0000-000000000014', 'system', '2026-03-08T15:00:00Z'),
  ('a1000000-0000-0000-0000-000000000002', 'bonus', 50, 185, 'Bonus naik tier Gold', NULL, 'admin', '2026-03-10T10:00:00Z'),
  ('a1000000-0000-0000-0000-000000000002', 'redeem', -5, 180, 'Tukar poin untuk diskon', NULL, 'system', '2026-03-20T09:00:00Z'),

  -- Budi (3 completed = 20+25+30 = 75)
  ('a1000000-0000-0000-0000-000000000003', 'earn', 20, 20, 'Poin dari order ETX-BUDI-001', 'b1000000-0000-0000-0000-000000000020', 'system', '2026-01-07T17:00:00Z'),
  ('a1000000-0000-0000-0000-000000000003', 'earn', 25, 45, 'Poin dari order ETX-BUDI-002', 'b1000000-0000-0000-0000-000000000021', 'system', '2026-02-22T14:00:00Z'),
  ('a1000000-0000-0000-0000-000000000003', 'earn', 30, 75, 'Poin dari order ETX-BUDI-003', 'b1000000-0000-0000-0000-000000000022', 'system', '2026-03-18T12:00:00Z'),

  -- Dina (3 completed = 15+20+25 = 60)
  ('a1000000-0000-0000-0000-000000000004', 'earn', 15, 15, 'Poin dari order ETX-DINA-001', 'b1000000-0000-0000-0000-000000000030', 'system', '2026-01-21T18:00:00Z'),
  ('a1000000-0000-0000-0000-000000000004', 'earn', 20, 35, 'Poin dari order ETX-DINA-002', 'b1000000-0000-0000-0000-000000000031', 'system', '2026-02-27T14:00:00Z'),
  ('a1000000-0000-0000-0000-000000000004', 'earn', 25, 60, 'Poin dari order ETX-DINA-003', 'b1000000-0000-0000-0000-000000000032', 'system', '2026-03-22T16:00:00Z'),

  -- Rizky (1 completed = 10... adjusted to 15 for min)
  ('a1000000-0000-0000-0000-000000000005', 'earn', 15, 15, 'Poin dari order ETX-RIZK-001', 'b1000000-0000-0000-0000-000000000040', 'system', '2026-03-11T10:00:00Z'),

  -- Fajar (5 completed = 20+30+35+45+60 = 190 + bonus 30 = 220)
  ('a1000000-0000-0000-0000-000000000007', 'earn', 20, 20, 'Poin dari order ETX-FAJR-001', 'b1000000-0000-0000-0000-000000000050', 'system', '2025-10-03T12:00:00Z'),
  ('a1000000-0000-0000-0000-000000000007', 'earn', 30, 50, 'Poin dari order ETX-FAJR-002', 'b1000000-0000-0000-0000-000000000051', 'system', '2025-11-18T14:00:00Z'),
  ('a1000000-0000-0000-0000-000000000007', 'earn', 35, 85, 'Poin dari order ETX-FAJR-003', 'b1000000-0000-0000-0000-000000000052', 'system', '2026-01-13T15:00:00Z'),
  ('a1000000-0000-0000-0000-000000000007', 'earn', 45, 130, 'Poin dari order ETX-FAJR-004', 'b1000000-0000-0000-0000-000000000053', 'system', '2026-02-23T18:00:00Z'),
  ('a1000000-0000-0000-0000-000000000007', 'earn', 60, 190, 'Poin dari order ETX-FAJR-005', 'b1000000-0000-0000-0000-000000000054', 'system', '2026-03-14T20:00:00Z'),
  ('a1000000-0000-0000-0000-000000000007', 'bonus', 30, 220, 'Bonus referral aktif', NULL, 'admin', '2026-03-20T09:00:00Z'),

  -- Lina (2 completed = 15+20 = 35)
  ('a1000000-0000-0000-0000-000000000008', 'earn', 15, 15, 'Poin dari order ETX-LINA-001', 'b1000000-0000-0000-0000-000000000060', 'system', '2026-02-21T17:00:00Z'),
  ('a1000000-0000-0000-0000-000000000008', 'earn', 20, 35, 'Poin dari order ETX-LINA-002', 'b1000000-0000-0000-0000-000000000061', 'system', '2026-03-27T14:00:00Z');


-- ============ REWARD REDEMPTIONS (catalog) ============
-- Some customers have redeemed catalog items

-- Get catalog item IDs (we'll use subqueries since UUIDs are auto-generated)
-- Aldo redeemed "100 Diamonds" (200 pts) - completed
INSERT INTO reward_redemptions (customer_id, catalog_item_id, points_spent, status, admin_notes, game_id, completed_at, created_at)
SELECT
  'a1000000-0000-0000-0000-000000000001',
  id, 200, 'completed', 'Diamond sudah dikirim ke akun', '12345678 (1234)', '2026-03-18T14:00:00Z', '2026-03-16T10:00:00Z'
FROM reward_catalog WHERE name = '100 Diamonds' LIMIT 1;

-- Aldo redeemed "Skin Elite pilihan" (300 pts) - processing
INSERT INTO reward_redemptions (customer_id, catalog_item_id, points_spent, status, admin_notes, game_id, created_at)
SELECT
  'a1000000-0000-0000-0000-000000000001',
  id, 300, 'processing', 'Customer mau skin Alucard - Fiery Inferno', '12345678 (1234)', '2026-04-02T11:00:00Z'
FROM reward_catalog WHERE name = 'Skin Elite pilihan' LIMIT 1;

-- Sari redeemed "Starlight Member 1 Bulan" (800 pts) - pending
INSERT INTO reward_redemptions (customer_id, catalog_item_id, points_spent, status, game_id, created_at)
SELECT
  'a1000000-0000-0000-0000-000000000002',
  id, 800, 'pending', '87654321 (5678)', '2026-04-04T09:00:00Z'
FROM reward_catalog WHERE name = 'Starlight Member 1 Bulan' LIMIT 1;

-- Fajar redeemed "250 Diamonds" (450 pts) - completed
INSERT INTO reward_redemptions (customer_id, catalog_item_id, points_spent, status, admin_notes, game_id, completed_at, created_at)
SELECT
  'a1000000-0000-0000-0000-000000000007',
  id, 450, 'completed', '250 DM sudah masuk', '44556677 (2345)', '2026-03-25T16:00:00Z', '2026-03-22T08:00:00Z'
FROM reward_catalog WHERE name = '250 Diamonds' LIMIT 1;

-- Fajar redeemed "Skin Special pilihan" (500 pts) - pending
INSERT INTO reward_redemptions (customer_id, catalog_item_id, points_spent, status, game_id, created_at)
SELECT
  'a1000000-0000-0000-0000-000000000007',
  id, 500, 'pending', '44556677 (2345)', '2026-04-05T07:30:00Z'
FROM reward_catalog WHERE name = 'Skin Special pilihan' LIMIT 1;

-- Budi redeemed "Diskon 50rb" (500 pts) - rejected (poin sudah dikembalikan)
INSERT INTO reward_redemptions (customer_id, catalog_item_id, points_spent, status, admin_notes, game_id, created_at)
SELECT
  'a1000000-0000-0000-0000-000000000003',
  id, 500, 'rejected', 'Stok habis, poin sudah dikembalikan', '11223344 (9012)', '2026-03-28T15:00:00Z'
FROM reward_catalog WHERE name = 'Diskon 50rb untuk order' LIMIT 1;


-- ============================================
-- SUMMARY
-- ============================================
-- 8 Customers:
--   Aldo Gaming    → Platinum, 350 pts, 12 orders, Rp 3.5jt spent
--   Sari MLBB      → Gold,     180 pts, 7 orders,  Rp 1.8jt spent  
--   Budi Pro Player → Silver,  75 pts,  4 orders,  Rp 750rb spent
--   Dina Ranker    → Silver,   60 pts,  3 orders,  Rp 600rb spent
--   Rizky Newbie   → Bronze,   15 pts,  1 order,   Rp 150rb spent
--   Maya Gamer     → Bronze,   0 pts,   0 orders,  Baru register
--   Fajar Mythic   → Gold,     220 pts, 8 orders,  Rp 2.2jt spent
--   Lina Casual    → Bronze,   35 pts,  2 orders,  Rp 350rb spent
--
-- Login: email + password "test1234"
--
-- 6 Reward Redemptions:
--   2x completed, 2x pending, 1x processing, 1x rejected
-- ============================================
