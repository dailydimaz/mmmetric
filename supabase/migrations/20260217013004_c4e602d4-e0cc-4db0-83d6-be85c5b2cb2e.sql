-- Block direct SELECT access to the integrations table from clients
-- Tokens should only be accessed via edge functions (service_role)
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can insert own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can update own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can delete own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Site owners can view integrations" ON public.integrations;
DROP POLICY IF EXISTS "Site owners can manage integrations" ON public.integrations;

-- Create a safe view that excludes token columns
CREATE OR REPLACE VIEW public.integrations_safe
WITH (security_invoker = true) AS
SELECT 
  id, site_id, provider, is_active, last_sync_at, 
  expires_at, metadata, created_at, updated_at
FROM public.integrations;

-- RLS policies: authenticated users can see integration status (not tokens) for their sites
CREATE POLICY "Site owners can view integrations"
ON public.integrations FOR SELECT
TO authenticated
USING (
  site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  OR site_id IN (SELECT site_id FROM team_members WHERE user_id = auth.uid())
);

-- Only service_role (edge functions) can INSERT/UPDATE/DELETE
CREATE POLICY "Service role manages integrations"
ON public.integrations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create rate_limit_counters table for persistent rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  ip_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', now()),
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_start)
);

-- Enable RLS - only service_role should access this
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
ON public.rate_limit_counters FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create an RPC for atomic rate limit check-and-increment
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_hash TEXT,
  p_max_requests INTEGER DEFAULT 200
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window := date_trunc('minute', now());
  
  -- Upsert and get current count
  INSERT INTO rate_limit_counters (ip_hash, window_start, request_count)
  VALUES (p_ip_hash, v_window, 1)
  ON CONFLICT (ip_hash, window_start) 
  DO UPDATE SET request_count = rate_limit_counters.request_count + 1
  RETURNING request_count INTO v_count;
  
  -- Clean old windows periodically (1 in 100 chance)
  IF random() < 0.01 THEN
    DELETE FROM rate_limit_counters WHERE window_start < now() - INTERVAL '5 minutes';
  END IF;
  
  RETURN v_count <= p_max_requests;
END;
$$;
