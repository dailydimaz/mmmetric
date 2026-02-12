
-- Session recordings metadata table (stores metadata, actual recording data goes to R3)
CREATE TABLE public.session_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_count INTEGER DEFAULT 1,
  pages TEXT[] DEFAULT '{}',
  country TEXT,
  city TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  recording_url TEXT, -- R3 object URL
  recording_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'completed', 'processing', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_session_recordings_site_id ON public.session_recordings(site_id);
CREATE INDEX idx_session_recordings_session_id ON public.session_recordings(session_id);
CREATE INDEX idx_session_recordings_started_at ON public.session_recordings(started_at DESC);
CREATE INDEX idx_session_recordings_status ON public.session_recordings(status);

-- Enable RLS
ALTER TABLE public.session_recordings ENABLE ROW LEVEL SECURITY;

-- Users can view recordings for sites they own
CREATE POLICY "Users can view recordings for their sites"
ON public.session_recordings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = session_recordings.site_id
    AND s.user_id = auth.uid()
  )
);

-- Service role inserts (from edge function)
CREATE POLICY "Service role can insert recordings"
ON public.session_recordings
FOR INSERT
WITH CHECK (true);

-- Service role can update recordings
CREATE POLICY "Service role can update recordings"
ON public.session_recordings
FOR UPDATE
USING (true);

-- Users can delete recordings for their sites
CREATE POLICY "Users can delete recordings for their sites"
ON public.session_recordings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = session_recordings.site_id
    AND s.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_session_recordings_updated_at
BEFORE UPDATE ON public.session_recordings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
