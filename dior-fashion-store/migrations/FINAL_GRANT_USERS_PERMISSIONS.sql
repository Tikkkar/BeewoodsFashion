-- ============================================================================
-- FINAL SOLUTION: GRANT PERMISSIONS ON USERS TABLE
-- ============================================================================
-- This grants SELECT permission on users table to authenticated and anon roles
-- and disables RLS to allow queries to work

-- Step 1: Grant SELECT permission on users table
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.users TO anon;
GRANT SELECT ON TABLE public.users TO postgres;

-- Step 2: Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify permissions
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND grantee IN ('authenticated', 'anon', 'postgres')
ORDER BY grantee, privilege_type;

-- Step 4: Verify RLS status
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED ⚠️' ELSE 'DISABLED ✅' END as rls_status
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Expected results:
-- 1. authenticated, anon, and postgres should have SELECT privilege on users
-- 2. RLS status should be "DISABLED ✅"
