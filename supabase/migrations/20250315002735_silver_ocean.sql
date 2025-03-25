/*
  # Implement Watermark System

  1. New Functions
    - `process_image_with_watermark`: Processes an image URL with a watermark
    - Updates property_images table to include processed_url column
    - Adds trigger to automatically process images on insert/update

  2. Changes
    - Add processed_url column to property_images
    - Create function to handle watermark processing
    - Add trigger for automatic watermark application
*/

-- Add processed_url column to property_images
ALTER TABLE property_images
ADD COLUMN IF NOT EXISTS processed_url text;

-- Create function to process image with watermark
CREATE OR REPLACE FUNCTION process_image_with_watermark()
RETURNS TRIGGER AS $$
DECLARE
  watermark_data record;
  base_url text;
  transform_options text;
BEGIN
  -- Get watermark information if available
  SELECT w.file_path, pf.watermark_position
  INTO watermark_data
  FROM property_features pf
  LEFT JOIN watermarks w ON w.id = pf.watermark_id
  WHERE pf.property_id = NEW.property_id
  LIMIT 1;

  -- If no watermark is set, use original image
  IF watermark_data.file_path IS NULL THEN
    NEW.processed_url := NEW.image_url;
    RETURN NEW;
  END IF;

  -- Extract base URL (before any existing transformation)
  base_url := split_part(NEW.image_url, '?', 1);
  
  -- Build transformation options based on watermark position
  CASE watermark_data.watermark_position
    WHEN 'center' THEN
      transform_options := format('?watermark=%s&position=center', watermark_data.file_path);
    WHEN 'top-left' THEN
      transform_options := format('?watermark=%s&position=top-left', watermark_data.file_path);
    WHEN 'top-right' THEN
      transform_options := format('?watermark=%s&position=top-right', watermark_data.file_path);
    WHEN 'bottom-left' THEN
      transform_options := format('?watermark=%s&position=bottom-left', watermark_data.file_path);
    WHEN 'bottom-right' THEN
      transform_options := format('?watermark=%s&position=bottom-right', watermark_data.file_path);
    ELSE
      transform_options := format('?watermark=%s&position=center', watermark_data.file_path);
  END CASE;

  -- Set the processed URL with watermark
  NEW.processed_url := base_url || transform_options;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically process images
CREATE TRIGGER process_image_watermark
  BEFORE INSERT OR UPDATE OF image_url
  ON property_images
  FOR EACH ROW
  EXECUTE FUNCTION process_image_with_watermark();

-- Update existing images to apply watermarks
DO $$
BEGIN
  UPDATE property_images
  SET image_url = image_url
  WHERE processed_url IS NULL;
END $$;