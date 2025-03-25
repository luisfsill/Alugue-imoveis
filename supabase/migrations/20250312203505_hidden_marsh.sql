/*
  # Fix RLS Policies for Property Images

  1. Changes
    - Drop existing property_images policies
    - Create new policies for property_images
    - Add proper RLS policies for authenticated users

  2. Security
    - Maintain data integrity
    - Allow proper access for authenticated users
    - Keep public read access
*/

-- Drop existing policies for property_images
DROP POLICY IF EXISTS "Public can view all property images" ON property_images;
DROP POLICY IF EXISTS "Users can manage images of own properties" ON property_images;

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
    AND (properties.user_id = auth.uid() OR EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    ))
  )
);