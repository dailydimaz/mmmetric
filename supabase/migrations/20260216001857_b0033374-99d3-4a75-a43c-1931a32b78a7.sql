-- Fix: Drop overly permissive INSERT/UPDATE policies on session_recordings
-- Service role bypasses RLS anyway, so these open policies only expose risk to anon/authenticated roles
DROP POLICY IF EXISTS "Service role can insert recordings" ON public.session_recordings;
DROP POLICY IF EXISTS "Service role can update recordings" ON public.session_recordings;

-- No replacement INSERT/UPDATE policies needed for anon/authenticated users
-- The edge function uses service_role which bypasses RLS
-- Site owners can still SELECT via existing ownership policy