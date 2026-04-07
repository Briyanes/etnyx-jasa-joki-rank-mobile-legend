-- ============================================================
-- ETNYX Schema Migration v18: Star/Division Tracking
-- ============================================================
-- Adds current_star and target_star columns to orders table
-- Stars represent division within a rank tier (V=5, IV=4, III=3, II=2, I=1)
-- Only ranks Warrior-Legend have stars. Mythic+ tiers have NULL stars.
-- ============================================================

-- Add star columns (nullable - Mythic+ tiers don't have stars)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_star INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS target_star INTEGER;

-- Add constraint: star values must be 1-5 (I-V) when set
ALTER TABLE orders ADD CONSTRAINT chk_current_star CHECK (current_star IS NULL OR (current_star >= 1 AND current_star <= 5));
ALTER TABLE orders ADD CONSTRAINT chk_target_star CHECK (target_star IS NULL OR (target_star >= 1 AND target_star <= 5));

-- Comment for documentation
COMMENT ON COLUMN orders.current_star IS 'Current rank star/division: 5=V, 4=IV, 3=III, 2=II, 1=I. NULL for Mythic+ tiers.';
COMMENT ON COLUMN orders.target_star IS 'Target rank star/division: 5=V, 4=IV, 3=III, 2=II, 1=I. NULL for Mythic+ tiers.';
