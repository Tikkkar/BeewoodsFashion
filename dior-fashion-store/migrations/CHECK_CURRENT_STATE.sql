-- ============================================================================
-- CHECK CURRENT FUNCTIONS AND POLICIES
-- ============================================================================
-- Run this to see what functions and policies currently exist

-- 1. Check if SECURITY DEFINER functions exist
SELECT 
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_current_user_role', 'is_admin', 'is_employee')
ORDER BY routine_name;

-- 2. Check current policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 3. Check if RLS is enabled on users table
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'users';
