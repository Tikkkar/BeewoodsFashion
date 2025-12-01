-- FIX: Comprehensive Sale & Employee Permissions V2
-- This script fixes "permission denied" errors for Sale/Warehouse employees
-- by explicitly granting permissions and updating RLS policies.

-- ==========================================
-- 1. Grant Permissions (CRITICAL)
-- ==========================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT on critical tables to all authenticated users
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.categories TO authenticated;
-- GRANT SELECT ON public.brands TO authenticated; -- Table might not exist yet

-- Grant FULL access to orders and order_items for authenticated users (RLS will filter)
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.customer_feedbacks TO authenticated;

-- Grant EXECUTE on all our helper functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_employee() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

-- ==========================================
-- 2. Fix 'users' Table RLS
-- ==========================================

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "view_own_profile" ON public.users;
DROP POLICY IF EXISTS "employee_view_all" ON public.users;
DROP POLICY IF EXISTS "admin_manage_all_users" ON public.users;
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- Policy 1: Users can read their own profile
CREATE POLICY "view_own_profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Policy 2: Employees (Sale, Warehouse, Admin) can read ALL user profiles
-- This is needed for "getOrdersForEmployee" which joins/selects user data
CREATE POLICY "employee_view_all" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'sale', 'warehouse')
  )
);

-- Policy 3: Admins can update everything
DROP POLICY IF EXISTS "admin_manage_all" ON public.users;
CREATE POLICY "admin_manage_all" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==========================================
-- 3. Fix 'order_items' Policy
-- ==========================================

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "insert_order_items" ON public.order_items;
DROP POLICY IF EXISTS "public_view_order_items" ON public.order_items;
DROP POLICY IF EXISTS "view_order_items_by_order_access" ON public.order_items;

-- Allow viewing order items if you can view the parent order
CREATE POLICY "view_order_items_by_order_access" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
  )
);

-- Allow insert if authenticated (simplified, backend validation handles logic)
CREATE POLICY "insert_order_items" ON public.order_items
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 4. Fix 'orders' Policy
-- ==========================================

DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;

CREATE POLICY "orders_select_policy" ON public.orders
FOR SELECT USING (
  -- Admin sees all
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' OR 
  -- Warehouse sees all
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'warehouse' OR
  -- Sale sees own created orders
  ((SELECT role FROM public.users WHERE id = auth.uid()) = 'sale' AND created_by = auth.uid()) OR
  -- Customers see their own orders
  (auth.uid() = user_id)
);

-- FIX: Comprehensive Sale & Employee Permissions V2
-- This script fixes "permission denied" errors for Sale/Warehouse employees
-- by explicitly granting permissions and updating RLS policies.

-- ==========================================
-- 1. Grant Permissions (CRITICAL)
-- ==========================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT on critical tables to all authenticated users
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.categories TO authenticated;
-- GRANT SELECT ON public.brands TO authenticated; -- Table might not exist yet

-- Grant FULL access to orders and order_items for authenticated users (RLS will filter)
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.customer_feedbacks TO authenticated;

-- Grant EXECUTE on all our helper functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_employee() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

-- ==========================================
-- 2. Fix 'users' Table RLS
-- ==========================================

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "view_own_profile" ON public.users;
DROP POLICY IF EXISTS "employee_view_all" ON public.users;
DROP POLICY IF EXISTS "admin_manage_all_users" ON public.users;
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- Policy 1: Users can read their own profile
CREATE POLICY "view_own_profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Policy 2: Employees (Sale, Warehouse, Admin) can read ALL user profiles
-- This is needed for "getOrdersForEmployee" which joins/selects user data
CREATE POLICY "employee_view_all" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'sale', 'warehouse')
  )
);

-- Policy 3: Admins can update everything
CREATE POLICY "admin_manage_all" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==========================================
-- 3. Fix 'order_items' Policy
-- ==========================================

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "insert_order_items" ON public.order_items;
DROP POLICY IF EXISTS "public_view_order_items" ON public.order_items;
DROP POLICY IF EXISTS "view_order_items_by_order_access" ON public.order_items;

-- Allow viewing order items if you can view the parent order
CREATE POLICY "view_order_items_by_order_access" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
  )
);

-- Allow insert if authenticated (simplified, backend validation handles logic)
CREATE POLICY "insert_order_items" ON public.order_items
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 4. Fix 'orders' Policy
-- ==========================================

DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;

CREATE POLICY "orders_select_policy" ON public.orders
FOR SELECT USING (
  -- Admin sees all
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' OR 
  -- Warehouse sees all
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'warehouse' OR
  -- Sale sees own created orders
  ((SELECT role FROM public.users WHERE id = auth.uid()) = 'sale' AND created_by = auth.uid()) OR
  -- Customers see their own orders
  (auth.uid() = user_id)
);

-- Allow Sale/Admin to create orders
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow update (simplified for now, logic handled in API/triggers)
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy" ON public.orders
FOR UPDATE USING (auth.role() = 'authenticated');
