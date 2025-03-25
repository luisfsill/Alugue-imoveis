/*
  # Add User Management Functions
  
  1. New Functions
    - `update_user_email`: Updates a user's email address
    - `update_user_password`: Updates a user's password
  
  2. Security
    - Functions are only accessible to authenticated users with admin role
    - Input validation to prevent empty or invalid values
*/

-- Function to update user email
CREATE OR REPLACE FUNCTION update_user_email(
  user_id UUID,
  new_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user exists and caller has admin role
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id
  ) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF NOT (
    SELECT is_admin()
  ) THEN
    RAISE EXCEPTION 'Only administrators can update user email';
  END IF;

  -- Validate new email
  IF new_email IS NULL OR new_email = '' THEN
    RAISE EXCEPTION 'Email cannot be empty';
  END IF;

  -- Update the user's email
  UPDATE auth.users
  SET email = new_email,
      updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Function to update user password
CREATE OR REPLACE FUNCTION update_user_password(
  user_id UUID,
  new_password TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user exists and caller has admin role
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id
  ) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF NOT (
    SELECT is_admin()
  ) THEN
    RAISE EXCEPTION 'Only administrators can update user password';
  END IF;

  -- Validate new password
  IF new_password IS NULL OR length(new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long';
  END IF;

  -- Update the user's password
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = user_id;
END;
$$;