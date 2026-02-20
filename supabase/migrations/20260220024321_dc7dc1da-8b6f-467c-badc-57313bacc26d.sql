-- Fix brand-assets storage policy: restrict uploads to user's own folder
DROP POLICY IF EXISTS "Users can upload brand assets" ON storage.objects;

CREATE POLICY "Users can upload brand assets" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'brand-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Also fix delete policy to use folder-based ownership
DROP POLICY IF EXISTS "Users can delete brand assets" ON storage.objects;

CREATE POLICY "Users can delete brand assets" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'brand-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);