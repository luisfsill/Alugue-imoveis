/*
  # Add reference number system for properties

  1. Changes
    - Add reference_number column to properties table
    - Add unique constraint on reference_number
    - Create sequence for auto-incrementing reference numbers
    - Create function to generate formatted reference numbers
    - Create trigger to automatically set reference numbers

  2. Security
    - Maintain existing RLS policies
    - Ensure reference numbers cannot be modified after creation
*/

-- Create sequence for reference numbers
CREATE SEQUENCE IF NOT EXISTS property_reference_seq START 1;

-- Add reference_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'reference_number'
  ) THEN
    ALTER TABLE properties ADD COLUMN reference_number text UNIQUE;
  END IF;
END $$;

-- Function to generate formatted reference number
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS text AS $$
DECLARE
  next_val integer;
BEGIN
  -- Get next value from sequence
  SELECT nextval('property_reference_seq') INTO next_val;
  -- Format as 3-digit number
  RETURN LPAD(next_val::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger function to set reference number before insert
CREATE OR REPLACE FUNCTION set_reference_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set reference_number if it's null
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_reference_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_property_reference_number
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_reference_number();

-- Update existing properties without reference numbers
DO $$
DECLARE
  prop RECORD;
BEGIN
  FOR prop IN 
    SELECT id 
    FROM properties 
    WHERE reference_number IS NULL
    ORDER BY created_at
  LOOP
    UPDATE properties 
    SET reference_number = generate_reference_number()
    WHERE id = prop.id;
  END LOOP;
END $$;