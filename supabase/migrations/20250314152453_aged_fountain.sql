/*
  # Add logo_url to property_features table

  1. Changes
    - Add logo_url column to property_features table
    - This column will store the URL of the logo to be overlaid on property images

  2. Description
    This migration adds support for storing a logo URL that will be displayed
    as an overlay on all property images.
*/

-- Add logo_url column to property_features if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'property_features' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE property_features ADD COLUMN logo_url text;
  END IF;
END $$;