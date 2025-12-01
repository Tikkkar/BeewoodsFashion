-- =====================================================
-- Fix Admin Orders Permissions V2
-- Step-by-step fix with verification
-- =====================================================

-- STEP 1: Check current user role
DO $$
BEGIN
  RAISE NOTICE '=== STEP 1: Checking user role ===';
  RAISE NOTICE 'Current user email: %', (SELECT email FROM auth.users WHERE id = auth.uid());
  RAISE NOTICE 'Current user role: %', (SELECT role FROM users WHERE id = auth.uid());
END $$;

-- STEP 2: Disable RLS temporarily to test
-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
-- NOTE: Uncomment above if you want to test without RLS first

-- STEP 3: Drop ALL existing policies (clean slate)
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  RAISE NOTICE '=== STEP 2: Dropping all existing policies ===';
  
  -- Drop all policies on orders table
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'orders'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON orders CASCADE', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
  
  -- Drop all policies on order_items table
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'order_items'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON order_items CASCADE', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- STEP 4: Ensure RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- STEP 5: Grant basic permissions
GRANT ALL ON orders TO authenticated;
GRANT ALL ON orders TO anon;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON order_items TO anon;

-- STEP 6: Create SIMPLE admin policy first (for testing)
CREATE POLICY "admin_full_access_orders"
ON orders
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "admin_full_access_order_items"
ON order_items
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- STEP 7: Add sale employee policy
CREATE POLICY "sale_full_access_orders"
ON orders
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'sale'
);

CREATE POLICY "sale_full_access_order_items"
ON order_items
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'sale'
);

-- STEP 8: Add warehouse view policy
CREATE POLICY "warehouse_view_orders"
ON orders
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'warehouse'
);

-- STEP 9: Add customer policies
CREATE POLICY "customer_view_own_orders"
ON orders
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR 
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "customer_create_orders"
ON orders
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "customer_view_own_order_items"
ON order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (
      orders.user_id = auth.uid()
      OR
      orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

CREATE POLICY "anyone_create_order_items"
ON order_items
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- STEP 10: Refresh schema
NOTIFY pgrst, 'reload schema';

-- STEP 11: Verification
DO $$
BEGIN
  RAISE NOTICE '=== STEP 3: Verification ===';
  RAISE NOTICE 'RLS on orders: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'orders');
  RAISE NOTICE 'RLS on order_items: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'order_items');
  RAISE NOTICE 'Total policies on orders: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'orders');
  RAISE NOTICE 'Total policies on order_items: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'order_items');
END $$;

-- STEP 12: List all new policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
