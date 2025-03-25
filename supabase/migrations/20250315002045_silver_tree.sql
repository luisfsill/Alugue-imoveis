/*
  # Fix watermark position constraint and handling

  1. Changes
    - Update watermark_position check constraint to include all valid positions
    - Add proper validation for watermark position values

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Drop existing constraint if it exists
ALTER TABLE property_features 
DROP CONSTRAINT IF EXISTS property_features_watermark_position_check;

-- Add new constraint with correct values
ALTER TABLE property_features
ADD CONSTRAINT property_features_watermark_position_check
CHECK (
  watermark_position IS NULL OR 
  watermark_position IN ('center', 'top-left', 'top-right', 'bottom-left', 'bottom-right')
);