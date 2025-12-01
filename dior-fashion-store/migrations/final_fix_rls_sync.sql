-- CONSOLIDATED FIX: RLS & Data Visibility
-- This script fixes 2 main issues:
-- 1. "Infinite Recursion" (Error 500)
-- 2. Empty Dashboard (Data not showing because policies check the wrong place for roles)

-- ==========================================
-- 1. HELPER FUNCTIONS (SECURITY DEFINER)
-- These run with "Super User" privileges to safely check roles without triggering RLS loops.
-- ==========================================

-- Function to check if current user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is Sale or Warehouse
CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('sale', 'warehouse', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. FIX 'USERS' TABLE POLICIES
-- Allow Admins to see/edit everyone.
-- ==========================================

DROP POLICY IF EXISTS "admin_manage_all_users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert user profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "employees_view_users" ON public.users;
DROP POLICY IF EXISTS "admin_full_access" ON public.users;
DROP POLICY IF EXISTS "view_own_profile" ON public.users;
DROP POLICY IF EXISTS "update_own_profile" ON public.users;
DROP POLICY IF EXISTS "insert_new_profile" ON public.users;
DROP POLICY IF EXISTS "employee_view_all" ON public.users;

-- Admin Full Access
CREATE POLICY "admin_full_access" ON public.users
FOR ALL USING (public.is_admin());

-- Users View Own
CREATE POLICY "view_own_profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Users Update Own
CREATE POLICY "update_own_profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Registration (Insert)
CREATE POLICY "insert_new_profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Employees View Basic Info (for UI)
CREATE POLICY "employee_view_all" ON public.users
FOR SELECT USING (public.is_employee());


-- ==========================================
-- 3. FIX 'ORDERS' TABLE POLICIES
-- Ensure Admins/Employees can see orders based on public.users role.
-- ==========================================

DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;
DROP POLICY IF EXISTS "admin_view_all_orders" ON public.orders;
DROP POLICY IF EXISTS "users_view_own_orders" ON public.orders;
DROP POLICY IF EXISTS "admin_update_orders" ON public.orders;
DROP POLICY IF EXISTS "public_create_orders" ON public.orders;

-- View Orders:
-- 1. Admin/Warehouse: View ALL
-- 2. Sale: View OWN (created_by = uid) OR (user_id = uid) - Simplified for now to View ALL for Sale to fix dashboard first, or filter later.
--    Let's stick to the requirement: Sale sees own orders.
-- 3. Customer: View OWN (user_id = uid)

CREATE POLICY "orders_select_policy" ON public.orders
FOR SELECT USING (
  public.is_admin() OR 
  (public.get_my_role() = 'warehouse') OR
  (public.get_my_role() = 'sale' AND created_by = auth.uid()) OR
  (auth.uid() = user_id)
);

-- Insert Orders:
-- Anyone can create (Customer buys, Sale creates)
CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT WITH CHECK (true);

-- Update Orders:
-- Admin/Warehouse/Sale can update status
CREATE POLICY "orders_update_policy" ON public.orders
FOR UPDATE USING (
  public.is_employee()
);

-- Delete Orders:
-- Only Admin
CREATE POLICY "orders_delete_policy" ON public.orders
FOR DELETE USING (public.is_admin());


-- ==========================================
-- 4. FIX 'PRODUCTS' & 'CATEGORIES' (If needed)
-- Ensure they are readable by everyone
-- ==========================================

-- Products
DROP POLICY IF EXISTS "public_read_active_products" ON public.products;
DROP POLICY IF EXISTS "admin_manage_products" ON public.products;

CREATE POLICY "public_read_products" ON public.products
FOR SELECT USING (true); -- Allow viewing all products for now to ensure UI works

CREATE POLICY "admin_manage_products" ON public.products
FOR ALL USING (public.is_admin());

-- Categories
DROP POLICY IF EXISTS "public_read_active_categories" ON public.categories;
DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;

CREATE POLICY "public_read_categories" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "admin_manage_categories" ON public.categories
FOR ALL USING (public.is_admin());

