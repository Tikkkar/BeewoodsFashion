-- ============================================================================
-- FINAL FIX: GRANT ALL NECESSARY PERMISSIONS
-- ============================================================================

-- Step 1: Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant SELECT on users table
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO postgres;

-- Step 3: Grant ALL on orders and order_items
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO anon;

-- Step 4: Grant usage on all sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 5: Grant SELECT on products table (needed for order creation)
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;

-- Step 6: Verify permissions
SELECT 
  grantee,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('users', 'orders', 'order_items', 'products')
  AND grantee IN ('authenticated', 'anon', 'postgres')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;
