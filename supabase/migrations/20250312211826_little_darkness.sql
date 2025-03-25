/*
  # Fix featured property functionality

  1. Changes
    - Drop existing trigger and function
    - Create new function to check admin role using JWT metadata
    - Create new trigger to enforce featured property restrictions

  2. Security
    - Only allow admins to set featured property flag
    - Use proper JWT metadata access
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS enforce_featured_property_admin ON properties;
DROP FUNCTION IF EXISTS check_featured_property;

-- Create new function to check featured property permissions
CREATE OR REPLACE FUNCTION check_featured_property()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if is_featured is being set to true
  IF (TG_OP = 'UPDATE' AND NEW.is_featured = true AND OLD.is_featured = false) OR
     (TG_OP = 'INSERT' AND NEW.is_featured = true) THEN
    -- Check if user is admin using JWT metadata
    IF NOT (SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin') THEN
      RAISE EXCEPTION 'Only administrators can set properties as featured';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER enforce_featured_property_admin
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION check_featured_property();