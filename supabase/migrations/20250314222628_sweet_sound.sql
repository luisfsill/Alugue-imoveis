/*
  # Fix watermark position constraint

  1. Changes
    - Update the watermark_position check constraint to support all positions
    - Drop existing constraint and create new one with updated values

  2. Description
    This migration modifies the watermark_position column constraint to support
    all possible watermark positions: center, top-left, top-right, bottom-left, bottom-right
*/

-- Drop existing constraint
ALTER TABLE property_features 
DROP CONSTRAINT IF EXISTS property_features_watermark_position_check;

-- Add new constraint with updated values
ALTER TABLE property_features
ADD CONSTRAINT property_features_watermark_position_check
CHECK (watermark_position IN ('center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'));