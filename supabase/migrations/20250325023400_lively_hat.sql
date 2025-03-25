/*
  # Add cover photo index to properties table

  1. Changes
    - Add cover_photo_index column to properties table
    - Set default value to 0 (first image)
    - Add check constraint to ensure valid index values

  2. Description
    This migration adds support for selecting which image should be the cover photo
    for a property listing.
*/

-- Add cover_photo_index column to properties
ALTER TABLE properties
ADD COLUMN cover_photo_index integer DEFAULT 0;

-- Add check constraint to ensure valid index values
ALTER TABLE properties
ADD CONSTRAINT properties_cover_photo_index_check
CHECK (cover_photo_index >= 0);