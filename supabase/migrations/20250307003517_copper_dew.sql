/*
  # Add broker contact fields to properties table

  1. Changes
    - Add broker_phone column to properties table
    - Add broker_email column to properties table

  2. Description
    This migration adds contact information fields for the broker associated with each property.
    These fields will store the phone number and email address that potential buyers/renters
    can use to contact the broker about a specific property.
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'broker_phone'
  ) THEN
    ALTER TABLE properties ADD COLUMN broker_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'broker_email'
  ) THEN
    ALTER TABLE properties ADD COLUMN broker_email text;
  END IF;
END $$;