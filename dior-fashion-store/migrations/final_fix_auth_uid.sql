-- =====================================================
-- FINAL FIX: Test auth.uid() and create working policy
-- =====================================================

-- STEP 1: Test auth.uid() when logged in
DO $$
DECLARE
  current_uid uuid;
  current_email text;
  user_count int;
BEGIN
  current_uid := auth.uid();
  
  RAISE NOTICE '=== AUTH UID TEST ===';
  RAISE NOTICE 'auth.uid(): %', current_uid;
  
  IF current_uid IS NULL THEN
    RAISE NOTICE '❌ auth.uid() is NULL - You are not logged in!';
  ELSE
    -- Get email from auth.users
    SELECT email INTO current_email
    FROM auth.users
    WHERE id = current_uid;
    
    RAISE NOTICE '✅ auth.uid() found: %', current_uid;
    RAISE NOTICE '📧 Email from auth.users: %', current_email;
    
    -- Check if exists in public.users
    SELECT COUNT(*) INTO user_count
    FROM users
    WHERE id = current_uid;
    
    IF user_count = 0 THEN
      RAISE NOTICE '❌ User NOT found in public.users table!';
      RAISE NOTICE '⚠️  Need to sync auth.users with public.users';
    ELSE
      RAISE NOTICE '✅ User found in public.users';
      
      -- Get role
      RAISE NOTICE '👤 Role: %', (SELECT role FROM users WHERE id = current_uid);
    END IF;
  END IF;
END $$;

-- STEP 2: Create simplified policy that will definitely work
-- Drop existing admin policy
DROP POLICY IF EXISTS "admin_full_access_orders" ON orders;
DROP POLICY IF EXISTS "admin_access_orders" ON orders;

-- Create new simplified policy
CREATE POLICY "admin_all_access"
ON orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Same for order_items
DROP POLICY IF EXISTS "admin_full_access_order_items" ON order_items;
DROP POLICY IF EXISTS "admin_access_order_items" ON order_items;

CREATE POLICY "admin_all_access_items"
ON order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- STEP 3: Test the policy
DO $$
DECLARE
  can_access boolean;
  order_count int;
BEGIN
  RAISE NOTICE '=== POLICY TEST ===';
  
  -- Test if current user has admin role
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ) INTO can_access;
  
  RAISE NOTICE 'Can access as admin: %', can_access;
  
  -- Try to count orders
  SELECT COUNT(*) INTO order_count FROM orders;
  RAISE NOTICE 'Can see % orders', order_count;
  
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '❌ Still getting permission error!';
END $$;

-- STEP 4: Verify grants
DO $$
BEGIN
  RAISE NOTICE '=== CHECKING GRANTS ===';
  
  -- Check if authenticated role has privileges
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'orders'
    AND grantee = 'authenticated'
  ) THEN
    RAISE NOTICE '❌ No grants for authenticated on orders table';
    GRANT ALL ON orders TO authenticated;
    RAISE NOTICE '✅ Granted ALL on orders to authenticated';
  ELSE
    RAISE NOTICE '✅ Grants already exist for authenticated';
  END IF;
END $$;

-- STEP 5: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Final verification
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;
