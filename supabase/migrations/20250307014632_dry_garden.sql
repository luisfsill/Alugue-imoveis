/*
  # Add user roles and policies

  1. New Types and Functions
    - Add user_role enum type
    - Add functions for role management
    - Add trigger for featured properties

  2. Security
    - Only admins can set featured properties (via trigger)
    - Add policies for admin access
*/

-- Create an enum type for user roles
create type public.user_role as enum ('admin', 'standard');

-- Function to get user role from JWT
create or replace function public.get_user_role()
returns user_role as $$
begin
  return (current_setting('request.jwt.claims', true)::json->>'role')::user_role;
exception
  when others then
    return 'standard'::user_role;
end;
$$ language plpgsql security definer;

-- Function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return get_user_role() = 'admin'::user_role;
end;
$$ language plpgsql security definer;

-- Function to handle featured property updates
create or replace function public.handle_featured_property()
returns trigger as $$
begin
  if NEW.is_featured = true and not is_admin() then
    raise exception 'Only administrators can set properties as featured';
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger for featured properties
create trigger enforce_featured_property_admin
  before insert or update on properties
  for each row
  execute function handle_featured_property();

-- Update RLS policies for properties table
create policy "Admins can update any property"
on properties
for update
to authenticated
using (is_admin() or auth.uid() = user_id)
with check (is_admin() or auth.uid() = user_id);

create policy "Admins can delete any property"
on properties
for delete
to authenticated
using (is_admin() or auth.uid() = user_id);

-- Function to delete user (admin only)
create or replace function public.delete_user(user_id uuid)
returns void as $$
begin
  if not is_admin() then
    raise exception 'Only administrators can delete users';
  end if;
  
  -- Delete user's properties first
  delete from properties where user_id = $1;
  
  -- Delete the user from auth.users
  delete from auth.users where id = $1;
end;
$$ language plpgsql security definer;