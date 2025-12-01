-- =====================================================
-- FINAL FIX: Add WITH CHECK clauses for INSERT
-- This is the missing piece for admin INSERT permissions
-- =====================================================

-- EXPLANATION:
-- FOR ALL policies need BOTH:
-- - USING clause (for SELECT/UPDATE/DELETE) 
-- - WITH CHECK clause (for INSERT/UPDATE)
-- Our current policies only have USING, blocking INSERT!

-- Drop current admin policies
DROP POLICY IF EXISTS "admin_all_access" ON orders;
DROP POLICY IF EXISTS "admin_all_access_items" ON order_items;
DROP POLICY IF EXISTS "admin_full_access_orders" ON orders;
DROP POLICY IF EXISTS "admin_full_access_order_items" ON order_items;

-- Create NEW policies with BOTH USING and WITH CHECK
CREATE POLICY "admin_full_access_orders"
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

CREATE POLICY "admin_full_access_order_items"
ON order_items
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

-- Also update sale policies with WITH CHECK
DROP POLICY IF EXISTS "sale_full_access_orders" ON orders;
DROP POLICY IF EXISTS "sale_full_access_order_items" ON order_items;

CREATE POLICY "sale_full_access_orders"
ON orders
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'sale'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'sale'
);

CREATE POLICY "sale_full_access_order_items"
ON order_items
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'sale'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'sale'
);

-- Refresh schema
NOTIFY pgrst, 'reload schema';

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;
