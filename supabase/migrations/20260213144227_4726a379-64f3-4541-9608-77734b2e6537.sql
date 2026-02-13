-- Fix session_recordings: restrict INSERT/UPDATE to service_role only
-- Drop overly permissive public policies
DROP POLICY IF EXISTS "Service role can insert recordings" ON public.session_recordings;
DROP POLICY IF EXISTS "Service role can update recordings" ON public.session_recordings;

-- Re-create with service_role restriction
CREATE POLICY "Service role can insert recordings"
ON public.session_recordings
FOR INSERT
TO service_role
WITH CHECK (
  EXISTS (SELECT 1 FROM public.sites WHERE sites.id = session_recordings.site_id)
);

CREATE POLICY "Service role can update recordings"
ON public.session_recordings
FOR UPDATE
TO service_role
USING (
  EXISTS (SELECT 1 FROM public.sites WHERE sites.id = session_recordings.site_id)
);