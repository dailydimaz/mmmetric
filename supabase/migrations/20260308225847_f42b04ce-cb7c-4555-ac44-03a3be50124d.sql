
-- Fix: Remove overly permissive INSERT policy and restrict to service role only
DROP POLICY IF EXISTS "Service role can insert content impressions" ON public.content_impressions;

-- The service role bypasses RLS, so no INSERT policy needed for the track function.
-- Add a policy for authenticated users to insert their own data if needed via dashboard:
-- (Not needed - edge function uses service role which bypasses RLS)
