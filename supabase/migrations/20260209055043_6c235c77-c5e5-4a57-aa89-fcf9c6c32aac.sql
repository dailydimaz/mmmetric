-- Fix the SECURITY DEFINER view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_dashboards_safe;

CREATE VIEW public.public_dashboards_safe 
WITH (security_invoker = true) AS
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
  (password_hash IS NOT NULL) AS has_password
FROM public.public_dashboards;

-- Grant access to authenticated users
GRANT SELECT ON public.public_dashboards_safe TO authenticated;