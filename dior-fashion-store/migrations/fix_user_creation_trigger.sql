-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'customer', -- Default role
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid conflicts
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill missing users (optional, but good for fixing existing broken users)
insert into public.users (id, email, full_name, role, created_at, updated_at)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', email), 
  'customer', 
  created_at, 
  created_at
from auth.users
where id not in (select id from public.users);
