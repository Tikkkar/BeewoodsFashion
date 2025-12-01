-- =====================================================
-- Fix Admin Orders Permissions
-- Resolves 403 errors for admin viewing/creating orders
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Admin full access to orders" ON orders;
DROP POLICY IF EXISTS "Sale can view all orders" ON orders;
DROP POLICY IF EXISTS "Warehouse can view all orders" ON orders;

-- Create comprehensive policies for orders table

-- 1. Admin users have full access to all orders
CREATE POLICY "Admin can manage all orders"
ON orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 2. Sale employees can view and update orders
CREATE POLICY "Sale can manage orders"
ON orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'sale'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'sale'
  )
);

-- 3. Warehouse employees can view orders
CREATE POLICY "Warehouse can view orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'warehouse'
  )
);

-- 4. Customers can view their own orders
CREATE POLICY "Customers can view own orders"
ON orders
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR 
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 5. Customers can create orders
CREATE POLICY "Customers can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Allow anonymous users to create orders (guest checkout)
CREATE POLICY "Anonymous users can create orders"
ON orders
FOR INSERT
TO anon
WITH CHECK (true);

-- Fix order_items permissions as well
DROP POLICY IF EXISTS "Admin can manage order items" ON order_items;
DROP POLICY IF EXISTS "Sale can manage order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;

-- Order items policies
CREATE POLICY "Admin can manage all order_items"
ON order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'sale')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'sale')
  )
);

CREATE POLICY "Customers can view own order_items"
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

CREATE POLICY "Anyone can create order_items"
ON order_items
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Grant necessary table permissions
GRANT ALL ON orders TO authenticated;
GRANT ALL ON orders TO anon;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON order_items TO anon;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- Verification queries (run these to test)
-- =====================================================

-- Check if admin can select orders
-- SELECT * FROM orders WHERE created_at > now() - interval '7 days' LIMIT 5;

-- Check current user role
-- SELECT role FROM users WHERE id = auth.uid();

-- Check all policies on orders table
-- SELECT schemaname, tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'orders';
