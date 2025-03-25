/*
  # Create real estate database schema

  1. New Tables
    - properties
      - Basic property information (title, description, price, etc.)
      - Ownership tracking with user_id
    - property_images
      - Store image URLs for properties
      - Linked to properties via foreign key

  2. Security
    - Enable RLS on all tables
    - Policies for public read access
    - Policies for authenticated user actions
*/

-- Create enum for property types
CREATE TYPE property_type AS ENUM ('sale', 'rent');

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  location text NOT NULL,
  type property_type NOT NULL,
  bedrooms integer NOT NULL,
  bathrooms integer NOT NULL,
  area numeric(10,2) NOT NULL,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property images table
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Create policies for properties
CREATE POLICY "Public can view all properties"
  ON properties
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for property images
CREATE POLICY "Public can view all property images"
  ON property_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage images of own properties"
  ON property_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM properties
      WHERE id = property_images.property_id
      AND user_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();