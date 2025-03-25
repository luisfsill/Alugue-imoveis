/*
  # Add property features

  1. New Tables
    - `property_features`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `has_pool` (boolean)
      - `has_garden` (boolean)
      - `has_garage` (boolean)
      - `has_security_system` (boolean)
      - `has_air_conditioning` (boolean)
      - `has_premium_appliances` (boolean)

  2. Security
    - Enable RLS on `property_features` table
    - Add policies for authenticated users to manage their property features
*/

-- Create property_features table
CREATE TABLE IF NOT EXISTS property_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  has_pool boolean DEFAULT false,
  has_garden boolean DEFAULT false,
  has_garage boolean DEFAULT false,
  has_security_system boolean DEFAULT false,
  has_air_conditioning boolean DEFAULT false,
  has_premium_appliances boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_features ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create property features" ON property_features
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_features.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own property features" ON property_features
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_features.property_id
      AND properties.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_features.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own property features" ON property_features
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_features.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view all property features" ON property_features
  FOR SELECT TO public
  USING (true);