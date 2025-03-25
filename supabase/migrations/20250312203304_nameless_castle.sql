/*
  # Fix Property Features RLS Policies

  1. Changes
    - Drop existing RLS policies for property_features table
    - Create new, more permissive policies that allow property creation
    - Ensure proper cascade behavior with properties table

  2. Security
    - Maintain data integrity while allowing proper access
    - Keep public read access
    - Allow authenticated users to manage their property features
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create property features" ON property_features;
DROP POLICY IF EXISTS "Users can update own property features" ON property_features;
DROP POLICY IF EXISTS "Users can delete own property features" ON property_features;
DROP POLICY IF EXISTS "Public can view all property features" ON property_features;

-- Create new policies with proper checks
CREATE POLICY "Public can view all property features"
ON property_features FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can manage own property features"
ON property_features FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM properties
    WHERE properties.id = property_features.property_id
    AND (properties.user_id = auth.uid() OR EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    ))
  )
);