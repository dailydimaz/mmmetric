-- Create storage bucket for log imports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('log-imports', 'log-imports', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "Users can upload log files" ON storage.objects;
CREATE POLICY "Users can upload log files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'log-imports' 
);

-- Allow users to read their own log files
DROP POLICY IF EXISTS "Users can read own log files" ON storage.objects;
CREATE POLICY "Users can read own log files" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'log-imports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own log files
DROP POLICY IF EXISTS "Users can delete own log files" ON storage.objects;
CREATE POLICY "Users can delete own log files" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'log-imports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
