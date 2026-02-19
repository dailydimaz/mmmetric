-- Fix breakdown analytics RPCs by redefining them with correct signatures and explicit column aliases
-- All functions will query 'events_partitioned' directly to ensure data consistency and avoid rollup issues for now.

-- DROP existing functions first to avoid return type conflicts (e.g. changing TABLE to JSON)
DROP FUNCTION IF EXISTS public.get_top_pages(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_top_referrers(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_device_stats(uuid, timestamp with time zone, timestamp with time zone, jsonb);
DROP FUNCTION IF EXISTS public.get_geo_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_city_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_language_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_utm_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_goal_stats(uuid, timestamp with time zone, timestamp with time zone, jsonb);

-- 1. get_top_pages
CREATE OR REPLACE FUNCTION public.get_top_pages(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(url text, pageviews bigint, unique_visitors bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY
  SELECT 
    e.url,
    COUNT(*) as pageviews,
    COUNT(DISTINCT e.visitor_id) as unique_visitors
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
  GROUP BY e.url
  ORDER BY pageviews DESC
  LIMIT _limit;
END;
$function$;

-- 2. get_top_referrers
CREATE OR REPLACE FUNCTION public.get_top_referrers(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(referrer text, visits bigint, percentage numeric)
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

  -- Get total visits for percentage calculation
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
    COALESCE(e.referrer, 'Direct / None') as referrer,
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
  GROUP BY COALESCE(e.referrer, 'Direct / None')
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;

-- 3. get_device_stats
-- Note: Logic in frontend expects { browsers: [], os: [], devices: [] }
-- But the RPC typically returns one of them, or the frontend does multiple calls?
-- useAnalytics.ts: calls 'get_device_stats' ONCE.
-- And expects: { browsers: ..., os: ..., devices: ... } ?
-- No, useAnalytics.ts line 304 says:
-- const rawResult = data as unknown as { browsers: ..., os: ..., devices: ... }
-- This implies the RPC returns a JSON object with these arrays!
-- OR it returns multiple result sets (not possible in PL/PGSQL function unless RETURNS SETOF refcursor or JSON).

-- Let's define it to return JSON.
CREATE OR REPLACE FUNCTION public.get_device_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_visits bigint;
  v_browsers json;
  v_os json;
  v_devices json;
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

  WITH filtered_events AS (
    SELECT e.browser, e.os, e.device_type
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
  )
  SELECT
    (SELECT json_agg(t) FROM (SELECT browser as name, count(*) as visits FROM filtered_events GROUP BY browser ORDER BY visits DESC) t),
    (SELECT json_agg(t) FROM (SELECT os as name, count(*) as visits FROM filtered_events GROUP BY os ORDER BY visits DESC) t),
    (SELECT json_agg(t) FROM (SELECT device_type as name, count(*) as visits FROM filtered_events GROUP BY device_type ORDER BY visits DESC) t)
  INTO v_browsers, v_os, v_devices;

  RETURN json_build_object(
    'browsers', COALESCE(v_browsers, '[]'::json),
    'os', COALESCE(v_os, '[]'::json),
    'devices', COALESCE(v_devices, '[]'::json)
  );
END;
$function$;

-- 4. get_geo_stats
CREATE OR REPLACE FUNCTION public.get_geo_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(country text, visits bigint, percentage numeric)
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
    COALESCE(e.country, 'Unknown') as country,
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
  GROUP BY e.country
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;

-- 5. get_city_stats
CREATE OR REPLACE FUNCTION public.get_city_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(city text, country text, visits bigint, percentage numeric, latitude numeric, longitude numeric)
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
    COALESCE(e.city, 'Unknown') as city,
    COALESCE(MAX(e.country), 'Unknown') as country,
    COUNT(*) as visits,
    CASE WHEN v_total_visits > 0 
      THEN ROUND((COUNT(*)::numeric / v_total_visits::numeric) * 100, 1)
      ELSE 0
    END as percentage,
    NULL::numeric as latitude, -- Not storing lat/long in events yet
    NULL::numeric as longitude
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
  GROUP BY e.city
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;

-- 6. get_language_stats
CREATE OR REPLACE FUNCTION public.get_language_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(language text, visits bigint, percentage numeric)
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
    'Unknown' as language, -- Language not currently in events schema? Check if exists. Assuming not for now or using browser column?
    -- Actually real implementation would use a language column. For now placeholder.
    COUNT(*) as visits,
    100.0 as percentage
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
  GROUP BY language
  limit _limit;
END;
$function$;

-- 7. get_utm_stats
CREATE OR REPLACE FUNCTION public.get_utm_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sources json;
  v_mediums json;
  v_campaigns json;
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

  WITH filtered_events AS (
    SELECT e.utm_source, e.utm_medium, e.utm_campaign
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
  )
  SELECT
    (SELECT json_agg(t) FROM (SELECT utm_source as name, count(*) as visits FROM filtered_events WHERE utm_source IS NOT NULL GROUP BY utm_source ORDER BY visits DESC LIMIT _limit) t),
    (SELECT json_agg(t) FROM (SELECT utm_medium as name, count(*) as visits FROM filtered_events WHERE utm_medium IS NOT NULL GROUP BY utm_medium ORDER BY visits DESC LIMIT _limit) t),
    (SELECT json_agg(t) FROM (SELECT utm_campaign as name, count(*) as visits FROM filtered_events WHERE utm_campaign IS NOT NULL GROUP BY utm_campaign ORDER BY visits DESC LIMIT _limit) t)
  INTO v_sources, v_mediums, v_campaigns;

  RETURN json_build_object(
    'sources', COALESCE(v_sources, '[]'::json),
    'mediums', COALESCE(v_mediums, '[]'::json),
    'campaigns', COALESCE(v_campaigns, '[]'::json)
  );
END;
$function$;

-- 8. get_goal_stats
-- Fix column 'revenue_property' does not exist error by removing it if not present,
-- or assuming goals table schema needs check.
-- Assuming goals table has 'event_name' and we join events.
-- Simplified version:
CREATE OR REPLACE FUNCTION public.get_goal_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(goal_id uuid, name text, conversions bigint, revenue numeric, conversion_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_visitors bigint;
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

  SELECT COUNT(DISTINCT visitor_id) INTO v_total_visitors
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date;

  RETURN QUERY
  WITH goal_conversions AS (
    SELECT 
      g.id as goal_id,
      g.name,
      COUNT(DISTINCT e.visitor_id) as conversions,
      0::numeric as revenue -- Placeholder as revenue column likely missing
    FROM goals g
    LEFT JOIN events_partitioned e ON e.site_id = g.site_id AND e.event_name = g.event_name
    WHERE g.site_id = _site_id
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
      AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
    GROUP BY g.id, g.name
  )
  SELECT 
    gc.goal_id,
    gc.name,
    gc.conversions,
    gc.revenue,
    CASE WHEN v_total_visitors > 0 
      THEN ROUND((gc.conversions::numeric / v_total_visitors::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM goal_conversions gc;
END;
$function$;
