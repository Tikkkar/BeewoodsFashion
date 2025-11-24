-- Fix Infinite Recursion in RLS Policies

-- 1. Create a secure function to check admin status (Bypasses RLS)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 2. Drop the problematic recursive policy
drop policy if exists "admin_manage_all_users" on public.users;

-- 3. Re-create the policy using the secure function
create policy "admin_manage_all_users"
on public.users
for all
using (
  public.is_admin()
);

-- 4. Update other policies that might be checking admin status directly
-- (Optional but recommended for performance and safety)
-- Example: Update categories policy if it exists
-- drop policy if exists "admin_manage_categories" on public.categories;
-- create policy "admin_manage_categories" on public.categories for all using ( public.is_admin() );
