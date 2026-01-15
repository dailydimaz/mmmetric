-- Enable RLS on public_dashboard_attempts table
ALTER TABLE public.public_dashboard_attempts ENABLE ROW LEVEL SECURITY;

-- No direct user access needed - table is only accessed via SECURITY DEFINER function
-- We don't add any policies since the RPC function handles all access