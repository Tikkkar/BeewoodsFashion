-- ============================================================================
-- REMOVE FOREIGN KEY CONSTRAINTS BETWEEN ORDERS AND USERS
-- ============================================================================
-- This script removes the foreign key constraints that link orders table to users table
-- This will prevent permission denied errors when querying orders

-- Step 1: Drop foreign key constraint on orders.user_id
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Step 2: Drop foreign key constraint on orders.created_by
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_created_by_fkey;

-- Step 3: Verify constraints are removed
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND contype = 'f'
  AND confrelid = 'public.users'::regclass;

-- Expected result: No rows (all foreign keys to users table removed)

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. The columns user_id and created_by will still exist in the orders table
-- 2. They will just be regular UUID columns without foreign key constraints
-- 3. You can still store user IDs in these columns
-- 4. The database will no longer enforce referential integrity
-- 5. You won't get permission denied errors when querying orders
