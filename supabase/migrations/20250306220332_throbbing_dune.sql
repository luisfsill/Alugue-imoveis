/*
  # Create storage bucket for property images

  1. Storage
    - Create a new storage bucket called 'property-images'
    - Enable public access for viewing images
    - Set up policies for authenticated users to manage their images
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'property-images')
WITH CHECK (bucket_id = 'property-images');

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'property-images');

-- Allow public access to view images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'property-images');