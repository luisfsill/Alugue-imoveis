/*
  # Fix RLS policies for property features and images

  1. Changes
    - Drop existing policies
    - Create new policies with proper USING and WITH CHECK clauses
    - Fix permission issues for property_features and property_images tables

  2. Security
    - Allow public read access
    - Restrict write access to authenticated users
    - Allow admins to manage all properties
*/

-- Drop existing policies for property_features
DROP POLICY IF EXISTS "Users can create property features" ON property_features;
DROP POLICY IF EXISTS "Users can update own property features" ON property_features;
DROP POLICY IF EXISTS "Users can delete own property features" ON property_features;
DROP POLICY IF EXISTS "Public can view all property features" ON property_features;
DROP POLICY IF EXISTS "Users can manage own property features" ON property_features;

-- Create new policies for property_features
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
    AND (properties.user_id = auth.uid() OR (
      SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
    ))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM properties
    WHERE properties.id = property_features.property_id
    AND (properties.user_id = auth.uid() OR (
      SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
    ))
  )
);

-- Drop existing policies for property_images
DROP POLICY IF EXISTS "Public can view all property images" ON property_images;
DROP POLICY IF EXISTS "Users can manage images of own properties" ON property_images;
DROP POLICY IF EXISTS "Users can manage own property images" ON property_images;

-- Create new policies for property_images
CREATE POLICY "Public can view all property images"
ON property_images FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can manage own property images"
ON property_images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM properties
    WHERE properties.id = property_images.property_id
    AND (properties.user_id = auth.uid() OR (
      SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
    ))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM properties
    WHERE properties.id = property_images.property_id
    AND (properties.user_id = auth.uid() OR (
      SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
    ))
  )
);