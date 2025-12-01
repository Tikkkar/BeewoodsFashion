-- =====================================================
-- ULTIMATE FIX: Use EMAIL instead of auth.uid()
-- Problem: auth.uid() returns NULL in policies
-- Solution: Use auth.jwt()->>'email' which is ALWAYS present
-- =====================================================

-- THỰC HÀNH TỐT NHẤT:
-- Khi auth.uid() không hoạt động, dùng email từ JWT token
-- JWT luôn chứa email, ngay cả khi metadata bị lỗi

-- Drop ALL old policies
DROP POLICY IF EXISTS "admin_all_access" ON orders;
DROP POLICY IF EXISTS "admin_all_access_items" ON order_items;
DROP POLICY IF EXISTS "admin_full_access_orders" ON orders;
DROP POLICY IF EXISTS "admin_full_access_order_items" ON order_items;
DROP POLICY IF EXISTS "sale_full_access_orders" ON orders;
DROP POLICY IF EXISTS "sale_full_access_order_items" ON order_items;

-- Create NEW policies using EMAIL instead of uid
CREATE POLICY "admin_full_access_orders"
ON orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.email = auth.jwt()->>'email'
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.email = auth.jwt()->>'email'
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
    WHERE users.email = auth.jwt()->>'email'
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.email = auth.jwt()->>'email'
    AND users.role = 'admin'
  )
);

-- Sale policies using email
CREATE POLICY "sale_full_access_orders"
ON orders
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE email = auth.jwt()->>'email') = 'sale'
)
WITH CHECK (
  (SELECT role FROM users WHERE email = auth.jwt()->>'email') = 'sale'
);

CREATE POLICY "sale_full_access_order_items"
ON order_items
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE email = auth.jwt()->>'email') = 'sale'
)
WITH CHECK (
  (SELECT role FROM users WHERE email = auth.jwt()->>'email') = 'sale'
);

-- Refresh schema
NOTIFY pgrst, 'reload schema';

-- KIỂM TRA SAU KHI CHẠY (trong Supabase SQL Editor)
-- Chạy query này để verify:
/*
SELECT 
  auth.jwt()->>'email' as current_email,
  (SELECT role FROM users WHERE email = auth.jwt()->>'email') as role_from_users;
*/

-- Query này PHẢI trả về:
-- current_email: "devil199xd@gmail.com"
-- role_from_users: "admin"

-- Nếu đúng → policies sẽ hoạt động!
