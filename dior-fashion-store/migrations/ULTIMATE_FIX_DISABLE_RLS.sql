-- ============================================================================
-- ULTIMATE FIX: DISABLE RLS AND GRANT PERMISSIONS ON ALL TABLES
-- ============================================================================

-- Step 1: Disable RLS on all related tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant ALL permissions to authenticated and anon
GRANT ALL ON TABLE public.users TO authenticated, anon;
GRANT ALL ON TABLE public.orders TO authenticated, anon;
GRANT ALL ON TABLE public.order_items TO authenticated, anon;

-- Step 3: Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Step 4: Verify RLS is disabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED ⚠️' ELSE 'DISABLED ✅' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'orders', 'order_items')
ORDER BY tablename;

-- Expected: All tables should show "DISABLED ✅"
