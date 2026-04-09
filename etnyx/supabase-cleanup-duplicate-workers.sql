-- ============================================================
-- ETNYX — Cleanup duplicate staff_users
-- Run this in Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- Step 1: PREVIEW — See which workers are duplicated
-- Run this FIRST to verify before deleting
SELECT name, role, lead_id, COUNT(*) as count, 
       array_agg(id ORDER BY created_at ASC) as ids,
       array_agg(created_at ORDER BY created_at ASC) as created_dates
FROM staff_users
WHERE role = 'worker'
GROUP BY name, role, lead_id
HAVING COUNT(*) > 1
ORDER BY name;

-- Step 2: DELETE duplicates — keep the OLDEST record (first created)
-- Uncomment and run AFTER verifying Step 1 results
/*
DELETE FROM staff_users
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY name, role, lead_id ORDER BY created_at ASC) as rn
    FROM staff_users
    WHERE role = 'worker'
  ) sub
  WHERE rn > 1
);
*/

-- Step 3: Add UNIQUE constraint to prevent future duplicates
-- Uncomment and run AFTER Step 2
/*
ALTER TABLE staff_users
ADD CONSTRAINT staff_users_name_role_lead_unique 
UNIQUE (name, role, lead_id);
*/
