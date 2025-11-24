-- Policy to allow Admins to manage ALL user profiles (View, Update, Delete)
create policy "admin_manage_all_users"
on public.users
for all
using (
  auth.uid() in (
    select id from public.users where role = 'admin'
  )
);

-- Policy to allow Sale/Warehouse to view basic info of other users (optional, good for collaboration)
create policy "employees_view_users"
on public.users
for select
using (
  auth.uid() in (
    select id from public.users where role in ('sale', 'warehouse')
  )
);
