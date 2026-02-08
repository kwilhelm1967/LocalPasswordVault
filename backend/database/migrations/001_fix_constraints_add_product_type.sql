-- =============================================================================
-- Migration 001: Fix constraints and add missing columns
-- =============================================================================
-- Run this in Supabase SQL Editor if the database was created with the original schema.
-- These changes fix constraint mismatches between the schema and the application code.
-- =============================================================================

-- 1. Add product_type column to trials table (used by trialService for LPV/LLV detection)
ALTER TABLE trials ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'lpv';

-- 2. Fix licenses.plan_type CHECK constraint to support all plan types
--    The webhook handler creates licenses with afterpassing_addon and afterpassing_standalone
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_plan_type_check;
ALTER TABLE licenses ADD CONSTRAINT licenses_plan_type_check 
  CHECK (plan_type IN ('personal', 'family', 'llv_personal', 'llv_family', 'afterpassing_addon', 'afterpassing_standalone', 'trial'));

-- 3. Fix licenses.product_type CHECK constraint to support afterpassing products
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_product_type_check;
ALTER TABLE licenses ADD CONSTRAINT licenses_product_type_check 
  CHECK (product_type IN ('lpv', 'llv', 'afterpassing'));

-- Verify changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'trials' AND column_name = 'product_type';

SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE 'licenses_%_check';
