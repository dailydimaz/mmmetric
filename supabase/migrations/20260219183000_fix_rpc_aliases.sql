-- Fix RPC name mismatches by creating aliases/wrappers and adding missing functions
-- This resolves 404 errors where frontend expects different names than backend provides.

-- DROP existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_url_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_referrer_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_country_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_os_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_browser_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);

-- 1. get_url_stats (Alias for get_top_pages)
CREATE OR REPLACE FUNCTION public.get_url_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(url text, pageviews bigint, unique_visitors bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.get_top_pages(_site_id, _start_date, _end_date, _limit, _filters);
END;
$function$;

-- 2. get_referrer_stats (Alias for get_top_referrers)
CREATE OR REPLACE FUNCTION public.get_referrer_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(referrer text, visits bigint, percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.get_top_referrers(_site_id, _start_date, _end_date, _limit, _filters);
END;
$function$;

-- 3. get_country_stats (Alias for get_geo_stats)
CREATE OR REPLACE FUNCTION public.get_country_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(country text, visits bigint, percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.get_geo_stats(_site_id, _start_date, _end_date, _limit, _filters);
END;
$function$;

-- 4. get_os_stats (New function)
CREATE OR REPLACE FUNCTION public.get_os_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(os text, visits bigint, percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_visits bigint;
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

  SELECT COUNT(*) INTO v_total_visits
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
    AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\');

  RETURN QUERY
  SELECT 
    COALESCE(e.os, 'Unknown') as os,
    COUNT(*) as visits,
    CASE WHEN v_total_visits > 0 
      THEN ROUND((COUNT(*)::numeric / v_total_visits::numeric) * 100, 1)
      ELSE 0
    END as percentage
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
    AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
  GROUP BY e.os
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;

-- 5. get_browser_stats (New function)
CREATE OR REPLACE FUNCTION public.get_browser_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(browser text, visits bigint, percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_visits bigint;
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

  SELECT COUNT(*) INTO v_total_visits
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
    AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\');

  RETURN QUERY
  SELECT 
    COALESCE(e.browser, 'Unknown') as browser,
    COUNT(*) as visits,
    CASE WHEN v_total_visits > 0 
      THEN ROUND((COUNT(*)::numeric / v_total_visits::numeric) * 100, 1)
      ELSE 0
    END as percentage
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
    AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
  GROUP BY e.browser
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;
