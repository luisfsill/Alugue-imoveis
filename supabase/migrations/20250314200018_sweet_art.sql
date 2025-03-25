/*
  # Fix watermark RLS policies

  1. Changes
    - Drop existing RLS policies for watermarks table
    - Create new policies with proper USING and WITH CHECK clauses
    - Fix permission issues for watermark management

  2. Security
    - Allow authenticated users to manage their own watermarks
    - Allow admins to manage all watermarks
    - Maintain data integrity
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own watermarks" ON watermarks;
DROP POLICY IF EXISTS "Users can insert own watermarks" ON watermarks;
DROP POLICY IF EXISTS "Users can update own watermarks" ON watermarks;
DROP POLICY IF EXISTS "Users can delete own watermarks" ON watermarks;

-- Create new policies
CREATE POLICY "Users can view own watermarks"
ON watermarks FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR (
    SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
  )
);

CREATE POLICY "Users can manage own watermarks"
ON watermarks FOR ALL
TO authenticated
USING (
  auth.uid() = user_id OR (
    SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id OR (
    SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', 'standard') = 'admin'
  )
);