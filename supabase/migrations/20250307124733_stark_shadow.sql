/*
  # Add user password update function

  1. New Functions
    - `update_user_password`: Securely updates a user's password
      - Takes user_id and new_password as parameters
      - Uses pgcrypto for password hashing
      - Only allows admins to update passwords
      - Returns void

  2. Security
    - Function is only accessible to authenticated users
    - Checks if the executing user is an admin
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to update user password
CREATE OR REPLACE FUNCTION update_user_password(user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  executing_user_id uuid;
  is_admin boolean;
BEGIN
  -- Get the ID of the executing user
  executing_user_id := auth.uid();
  
  -- Check if the executing user is an admin
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = executing_user_id
    AND raw_user_meta_data->>'role' = 'admin'
  ) INTO is_admin;

  -- Only allow admins to update passwords
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only administrators can update user passwords';
  END IF;

  -- Update the user's password
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = user_id;
END;
$$;