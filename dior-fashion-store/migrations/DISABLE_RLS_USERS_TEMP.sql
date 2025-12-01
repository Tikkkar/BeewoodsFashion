-- ============================================================================
-- TEMPORARY: DISABLE RLS ON USERS TABLE FOR DEBUGGING
-- ============================================================================
-- This script temporarily disables RLS on the users table to test if that's
-- causing the infinite recursion error. 
-- WARNING: This is for debugging only! Re-enable RLS after testing.

-- Step 1: Drop ALL policies on users table
DROP POLICY IF EXISTS "admin_full_access" ON public.users CASCADE;
DROP POLICY IF EXISTS "view_own_profile" ON public.users CASCADE;
DROP POLICY IF EXISTS "employee_view_all" ON public.users CASCADE;
DROP POLICY IF EXISTS "update_own_profile" ON public.users CASCADE;
DROP POLICY IF EXISTS "insert_new_profile" ON public.users CASCADE;
DROP POLICY IF EXISTS "admin_manage_all" ON public.users CASCADE;

-- Step 2: Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'users';

-- Expected result: RLS Enabled = false
