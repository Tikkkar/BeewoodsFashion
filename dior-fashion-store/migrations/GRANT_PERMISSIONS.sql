-- ============================================================================
-- FIX PERMISSION DENIED ERROR ON USERS TABLE
-- ============================================================================
-- After disabling RLS, we need to grant SELECT permissions to authenticated users

-- Step 1: Grant SELECT permission on users table to authenticated users
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Step 2: Also grant permissions on orders and order_items if needed
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;

-- Step 3: Grant usage on sequences (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 4: Verify permissions
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('users', 'orders', 'order_items')
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- Expected output: You should see SELECT granted to authenticated on users table
