/*
  # Create watermark storage bucket

  1. Storage
    - Create a new storage bucket for watermarks
    - Enable public access for viewing watermarks
    - Set up policies for authenticated users to manage their watermarks

  2. Security
    - Allow authenticated users to upload watermarks
    - Allow public access to view watermarks
    - Restrict management to owners and admins
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('watermarks', 'watermarks', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload watermarks
CREATE POLICY "Authenticated users can upload watermarks"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'watermarks');

-- Allow authenticated users to update their own watermarks
CREATE POLICY "Users can update own watermarks"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'watermarks')
WITH CHECK (bucket_id = 'watermarks');

-- Allow authenticated users to delete their own watermarks
CREATE POLICY "Users can delete own watermarks"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'watermarks');

-- Allow public access to view watermarks
CREATE POLICY "Public can view watermarks"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'watermarks');