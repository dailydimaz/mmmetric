-- Create storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own site's folder
CREATE POLICY "Users can upload brand assets" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'brand-assets'
);

-- Public read access for brand assets
CREATE POLICY "Public can view brand assets" ON storage.objects
FOR SELECT TO public USING (
  bucket_id = 'brand-assets'
);

-- Users can delete their own brand assets
CREATE POLICY "Users can delete brand assets" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'brand-assets' AND
  auth.uid() = owner
);

-- Update existing sites to have default values if null
UPDATE public.sites SET remove_branding = false WHERE remove_branding IS NULL;
