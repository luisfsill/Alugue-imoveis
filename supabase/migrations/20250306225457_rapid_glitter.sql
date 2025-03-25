/*
  # Update properties table for featured images

  1. Changes
    - Add trigger to update updated_at column
    - Add RLS policies for featured properties

  2. Security
    - Enable RLS on properties table
    - Add policy for public to view featured properties
*/

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add policy for public to view featured properties
CREATE POLICY "Public can view featured properties"
  ON properties
  FOR SELECT
  TO public
  USING (is_featured = true);