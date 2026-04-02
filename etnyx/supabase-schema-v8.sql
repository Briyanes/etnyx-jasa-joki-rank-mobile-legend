-- =============================================
-- ETNYX Database Schema V8 - Storage Bucket for Portfolio Images
-- Run this in Supabase SQL Editor AFTER v7
-- =============================================

-- Create storage bucket for portfolio images (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (admin) to upload files
CREATE POLICY "Admin can upload portfolio images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio');

-- Allow authenticated users (admin) to update files
CREATE POLICY "Admin can update portfolio images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'portfolio');

-- Allow authenticated users (admin) to delete files
CREATE POLICY "Admin can delete portfolio images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio');

-- Allow public read access to portfolio images
CREATE POLICY "Public can view portfolio images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolio');
