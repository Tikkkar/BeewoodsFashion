-- EMERGENCY FIX: Infinite Recursion Loop
-- This script completely resets policies on the 'users' table to fix the 500 error.

-- 1. Create the helper function with SECURITY DEFINER (Crucial: Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop ALL existing policies on 'users' to ensure a clean slate
DROP POLICY IF EXISTS "admin_manage_all_users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert user profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "employees_view_users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated" ON public.users;

-- 3. Re-create Clean, Non-Recursive Policies

-- Policy A: Admins can do ANYTHING (Uses is_admin() to break recursion)
CREATE POLICY "admin_full_access"
ON public.users
FOR ALL
USING (public.is_admin());

-- Policy B: Users can VIEW their own profile
CREATE POLICY "view_own_profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy C: Users can UPDATE their own profile
CREATE POLICY "update_own_profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Policy D: Anyone can INSERT (for registration)
CREATE POLICY "insert_new_profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy E: Allow Sale/Warehouse to view basic info (Optional, helps with UI)
CREATE POLICY "employee_view_all"
ON public.users
FOR SELECT
USING (
  exists (
    select 1 from public.users 
    where id = auth.uid() and role in ('sale', 'warehouse')
  )
);
