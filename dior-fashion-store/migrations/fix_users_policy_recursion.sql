-- Fix infinite recursion error 42P17 in users relation policies
-- Cause: RLS policies and helper functions (is_admin, is_employee) query users table
-- which triggers the same policies -> recursion
-- Solution: Replace helper functions with plpgsql SECURITY DEFINER versions
-- SECURITY DEFINER runs as DB owner (bypasses RLS entirely when querying inside function)

-- 1. Revoke execute permissions on old functions to prevent use during migration
REVOKE ALL ON FUNCTION public.is_admin() FROM authenticated, anon;
REVOKE ALL ON FUNCTION public.is_employee() FROM authenticated, anon;
REVOKE ALL ON FUNCTION public.get_my_role() FROM authenticated, anon;
REVOKE ALL ON FUNCTION public.get_current_user_role() FROM authenticated, anon;

-- 2. Drop old functions if they exist (safe)
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_employee();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- 3. Create new SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.get_current_user_role() = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('sale', 'warehouse', 'admin');
END;
$$;

-- 4. Grant execute permissions back
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_employee() TO authenticated, anon;

-- 5. Recreate key users policies using the new functions (drop old to reset)
-- Enable RLS if not already
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access" ON public.users;
CREATE POLICY "admin_full_access" ON public.users
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "view_own_profile" ON public.users;
CREATE POLICY "view_own_profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "employee_view_all" ON public.users;
CREATE POLICY "employee_view_all" ON public.users
  FOR SELECT USING (public.is_employee());

DROP POLICY IF EXISTS "update_own_profile" ON public.users;
CREATE POLICY "update_own_profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_new_profile" ON public.users;
CREATE POLICY "insert_new_profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. For orders and other tables, policies should now work without recursion
-- No change needed if they already use is_admin()/is_employee()

-- Verify: these should work without recursion now
-- SELECT public.is_admin(); 
-- SELECT * FROM users WHERE id = auth.uid();
