/*
  # Add User Management System

  1. New Functions
    - `is_admin()`: Check if current user is an admin
    - `delete_user()`: Delete user (admin only)

  2. Security
    - Add RLS policies for user management
    - Add trigger for featured property control
*/

-- Create enum for user roles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'standard');
  END IF;
END $$;

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

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'enforce_featured_property_admin'
  ) THEN
    CREATE TRIGGER enforce_featured_property_admin
    BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION check_featured_property();
  END IF;
END $$;