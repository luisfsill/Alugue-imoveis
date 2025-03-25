/*
  # Add user roles and permissions

  1. Changes
    - Add admin check function
    - Add user deletion function
    - Update RLS policies for properties
    - Add trigger for featured properties
*/

-- Function to check if user is admin
create or replace function is_admin()
returns boolean as $$
begin
  return coalesce(
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role')::text = 'admin',
    false
  );
end;
$$ language plpgsql security definer;

-- Function to delete user (admin only)
create or replace function delete_user(user_id uuid)
returns void as $$
begin
  -- Check if the executing user is an admin
  if not is_admin() then
    raise exception 'Only administrators can delete users';
  end if;

  -- Delete user's properties first (cascade will handle related records)
  delete from properties where user_id = $1;
  
  -- Delete the user from auth.users
  delete from auth.users where id = $1;
end;
$$ language plpgsql security definer;

-- Drop existing policies if they exist
drop policy if exists "Users can view own properties" on properties;
drop policy if exists "Users can insert own properties" on properties;
drop policy if exists "Users can update own properties" on properties;
drop policy if exists "Users can delete own properties" on properties;

-- Update RLS policies for properties
alter table properties enable row level security;

create policy "Users can view own properties"
on properties for select
to authenticated
using (
  auth.uid() = user_id
  or is_admin()
);

create policy "Users can insert own properties"
on properties for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "Users can update own properties"
on properties for update
to authenticated
using (
  auth.uid() = user_id
  or is_admin()
);

create policy "Users can delete own properties"
on properties for delete
to authenticated
using (
  auth.uid() = user_id
  or is_admin()
);

-- Drop existing trigger if it exists
drop trigger if exists enforce_featured_property_admin on properties;

-- Add trigger to prevent non-admins from setting featured properties
create or replace function check_featured_property()
returns trigger as $$
begin
  if new.is_featured and not is_admin() then
    raise exception 'Only administrators can set properties as featured';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_featured_property_admin
before insert or update on properties
for each row
execute function check_featured_property();