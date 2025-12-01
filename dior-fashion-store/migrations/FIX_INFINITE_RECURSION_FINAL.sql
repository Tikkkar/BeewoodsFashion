-- ============================================================================
-- FIX INFINITE RECURSION IN USERS TABLE RLS POLICIES
-- ============================================================================
-- This script fixes the "infinite recursion detected in policy for relation users" error
-- by using SECURITY DEFINER functions that bypass RLS when checking user roles

-- Step 1: Drop and recreate helper functions with SECURITY DEFINER
-- ============================================================================

-- Drop old functions
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_employee() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- Create SECURITY DEFINER function to get current user role
-- This bypasses RLS when querying the users table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Bypass RLS because SECURITY DEFINER runs as postgres owner
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid() 
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'customer');
END;
$$;

-- Create SECURITY DEFINER function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_current_user_role() = 'admin';
END;
$$;

-- Create SECURITY DEFINER function to check if user is employee
CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('sale', 'warehouse', 'admin');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_employee() TO authenticated, anon;

-- Step 2: Recreate users table policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "admin_full_access" ON public.users;
DROP POLICY IF EXISTS "view_own_profile" ON public.users;
DROP POLICY IF EXISTS "employee_view_all" ON public.users;
DROP POLICY IF EXISTS "update_own_profile" ON public.users;
DROP POLICY IF EXISTS "insert_new_profile" ON public.users;
DROP POLICY IF EXISTS "admin_manage_all" ON public.users;

-- Admin: Full access to all users
CREATE POLICY "admin_full_access" ON public.users
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users: View own profile
CREATE POLICY "view_own_profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- Employees: View all user profiles (needed for order management)
CREATE POLICY "employee_view_all" ON public.users
  FOR SELECT 
  USING (public.is_employee());

-- Users: Update own profile
CREATE POLICY "update_own_profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Users: Insert own profile (for signup)
CREATE POLICY "insert_new_profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Step 3: Verify orders and order_items policies
-- ============================================================================

-- Enable RLS on orders and order_items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "admin_full_access_orders" ON public.orders;
DROP POLICY IF EXISTS "admin_full_access_order_items" ON public.order_items;
DROP POLICY IF EXISTS "sale_full_access_orders" ON public.orders;
DROP POLICY IF EXISTS "sale_full_access_order_items" ON public.order_items;
DROP POLICY IF EXISTS "warehouse_view_orders" ON public.orders;
DROP POLICY IF EXISTS "warehouse_view_order_items" ON public.order_items;
DROP POLICY IF EXISTS "customer_view_own_orders" ON public.orders;
DROP POLICY IF EXISTS "customer_view_own_order_items" ON public.order_items;
DROP POLICY IF EXISTS "customer_create_orders" ON public.orders;
DROP POLICY IF EXISTS "anyone_create_order_items" ON public.order_items;

-- Orders policies
-- Admin: Full access
CREATE POLICY "admin_full_access_orders" ON public.orders
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Sale: Full access to own orders
CREATE POLICY "sale_full_access_orders" ON public.orders
  FOR ALL
  USING (
    public.get_current_user_role() = 'sale' AND 
    created_by = auth.uid()
  )
  WITH CHECK (
    public.get_current_user_role() = 'sale' AND 
    created_by = auth.uid()
  );

-- Warehouse: View all orders
CREATE POLICY "warehouse_view_orders" ON public.orders
  FOR SELECT
  USING (public.get_current_user_role() = 'warehouse');

-- Customers: View own orders
CREATE POLICY "customer_view_own_orders" ON public.orders
  FOR SELECT
  USING (
    public.get_current_user_role() = 'customer' AND 
    user_id = auth.uid()
  );

-- Customers: Create orders
CREATE POLICY "customer_create_orders" ON public.orders
  FOR INSERT
  WITH CHECK (
    public.get_current_user_role() = 'customer' AND 
    user_id = auth.uid()
  );

-- Order Items policies
-- Admin: Full access
CREATE POLICY "admin_full_access_order_items" ON public.order_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Sale: Full access to own order items
CREATE POLICY "sale_full_access_order_items" ON public.order_items
  FOR ALL
  USING (
    public.get_current_user_role() = 'sale' AND 
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.get_current_user_role() = 'sale' AND 
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.created_by = auth.uid()
    )
  );

-- Warehouse: View all order items
CREATE POLICY "warehouse_view_order_items" ON public.order_items
  FOR SELECT
  USING (public.get_current_user_role() = 'warehouse');

-- Customers: View own order items
CREATE POLICY "customer_view_own_order_items" ON public.order_items
  FOR SELECT
  USING (
    public.get_current_user_role() = 'customer' AND 
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Anyone: Create order items (needed for checkout)
CREATE POLICY "anyone_create_order_items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================================================

-- Test 1: Check if functions work
-- SELECT public.get_current_user_role();
-- SELECT public.is_admin();
-- SELECT public.is_employee();

-- Test 2: Query users table (should not cause recursion)
-- SELECT id, email, role FROM public.users LIMIT 5;

-- Test 3: Query orders with user joins (should work now)
-- SELECT o.*, u.email, u.full_name 
-- FROM public.orders o
-- LEFT JOIN public.users u ON o.user_id = u.id
-- LIMIT 5;
