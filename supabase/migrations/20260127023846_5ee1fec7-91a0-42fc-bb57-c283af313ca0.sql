-- Create storage bucket for log imports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'log-imports', 
    'log-imports', 
    false,
    20971520, -- 20MB limit
    ARRAY['text/plain', 'text/csv', 'application/json', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for log-imports bucket
CREATE POLICY "Users can upload log files to their sites"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'log-imports' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can read their own log files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'log-imports' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own log files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'log-imports' 
    AND auth.uid() IS NOT NULL
);