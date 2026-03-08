
-- Phase 3: Create failed_events dead-letter table for insert failures
CREATE TABLE IF NOT EXISTS public.failed_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL,
    event_name text NOT NULL DEFAULT 'pageview',
    payload jsonb NOT NULL,
    error_code text,
    error_message text,
    source text DEFAULT 'track',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only service_role can insert/read
ALTER TABLE public.failed_events ENABLE ROW LEVEL SECURITY;

-- No public policies — only service_role can access
CREATE INDEX IF NOT EXISTS idx_failed_events_created_at ON public.failed_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_events_site_id ON public.failed_events (site_id);
