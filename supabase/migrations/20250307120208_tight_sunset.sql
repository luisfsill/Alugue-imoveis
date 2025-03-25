/*
  # User Management Setup

  1. Functions
    - Create function to check if user is admin
    - Create function to delete users (admin only)
    - Create function to update user roles (admin only)

  2. Policies
    - Enable RLS on auth.users
    - Add policies for user management
*/

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  metadata jsonb;
BEGIN
  -- Get the user's metadata from the JWT
  metadata := (auth.jwt() ->> 'user_metadata')::jsonb;
  
  -- Check if the role in metadata is 'admin'
  RETURN COALESCE(
    metadata ->> 'role' = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a user (admin only)
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Delete user's data
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role text)
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can update user roles';
  END IF;

  IF new_role NOT IN ('admin', 'standard') THEN
    RAISE EXCEPTION 'Invalid role. Must be either "admin" or "standard"';
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN 
        jsonb_build_object('role', new_role)
      ELSE 
        raw_user_meta_data || jsonb_build_object('role', new_role)
    END
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list users (admin only)
CREATE OR REPLACE FUNCTION list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can list users';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE((u.raw_user_meta_data->>'role')::TEXT, 'standard'),
    u.created_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;