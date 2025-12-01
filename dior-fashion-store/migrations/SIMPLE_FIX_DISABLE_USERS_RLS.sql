-- ============================================================================
-- SIMPLE FIX: DISABLE RLS ON USERS TABLE
-- ============================================================================
-- This is a simple solution to fix the infinite recursion error
-- by disabling RLS on the users table entirely.
-- 
-- SECURITY NOTE: This means anyone authenticated can read all user data.
-- This is acceptable for an admin-only application, but if you have
-- customer-facing features, you should re-enable RLS with proper policies later.

-- Step 1: Drop ALL existing policies on users table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users CASCADE';
    END LOOP;
END $$;

-- Step 2: Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify RLS is disabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED ⚠️' ELSE 'DISABLED ✅' END as rls_status
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Expected output: DISABLED ✅

-- ============================================================================
-- IMPORTANT: After running this script, refresh your browser at /admin/orders
-- Orders should now display correctly!
-- ============================================================================
