/*
  # Add watermark system

  1. New Tables
    - `watermarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `file_path` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on watermarks table
    - Add policies for authenticated users
*/

-- Create watermarks table
CREATE TABLE IF NOT EXISTS watermarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE watermarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own watermarks"
  ON watermarks FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR (
      SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
    )
  );

CREATE POLICY "Users can insert own watermarks"
  ON watermarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watermarks"
  ON watermarks FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR (
      SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
    )
  );

CREATE POLICY "Users can delete own watermarks"
  ON watermarks FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR (
      SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
    )
  );

-- Add watermark fields to property_features
ALTER TABLE property_features 
ADD COLUMN IF NOT EXISTS watermark_id uuid REFERENCES watermarks(id),
ADD COLUMN IF NOT EXISTS watermark_position text CHECK (watermark_position IN ('center', 'corners'));