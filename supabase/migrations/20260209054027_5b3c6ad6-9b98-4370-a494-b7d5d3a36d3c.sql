-- Fix 1: Create a view for public_dashboards that excludes password_hash
-- and add a has_password computed column instead

-- Create a secure view that excludes password_hash
CREATE OR REPLACE VIEW public.public_dashboards_safe AS
SELECT 
  id,
  site_id,
  share_token,
  is_enabled,
  title,
  show_visitors,
  show_pageviews,
  show_top_pages,
  show_referrers,
  show_devices,
  show_geo,
  created_at,
  updated_at,
  -- Computed column: tells if password is set without exposing the hash
  (password_hash IS NOT NULL) AS has_password
FROM public.public_dashboards;

-- Grant access to authenticated users (view inherits table RLS)
GRANT SELECT ON public.public_dashboards_safe TO authenticated;

-- Create a SECURITY DEFINER function to verify dashboard password server-side
-- This prevents clients from needing to read the hash
CREATE OR REPLACE FUNCTION public.verify_dashboard_password(
  _share_token TEXT,
  _password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_password_hash TEXT;
  v_is_enabled BOOLEAN;
BEGIN
  -- Get the password hash (only accessible via this function)
  SELECT password_hash, is_enabled 
  INTO v_password_hash, v_is_enabled
  FROM public.public_dashboards
  WHERE share_token = _share_token;
  
  -- Dashboard not found or not enabled
  IF v_password_hash IS NULL AND NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- No password required
  IF v_password_hash IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Dashboard must be enabled
  IF NOT v_is_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Verify password using bcrypt
  RETURN v_password_hash = crypt(_password, v_password_hash);
END;
$$;

-- Grant execute to anon (for public dashboard access)
GRANT EXECUTE ON FUNCTION public.verify_dashboard_password(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_dashboard_password(TEXT, TEXT) TO authenticated;