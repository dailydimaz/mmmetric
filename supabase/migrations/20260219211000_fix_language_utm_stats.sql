-- Fix get_language_stats: ambiguous column "language" (return column name clashes with GROUP BY alias)
-- Fix get_utm_stats: column e.utm_source does not exist (UTM data is in properties JSONB, not direct columns)

-- Drop and recreate to ensure clean state
DROP FUNCTION IF EXISTS public.get_language_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_utm_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);

-- 1. get_language_stats - Fixed: use e.language explicitly and GROUP BY e.language
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
    COALESCE(e.language, 'Unknown')::text as language,
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
  GROUP BY e.language
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;

-- 2. get_utm_stats - Fixed: UTM data lives in properties JSONB, not direct columns
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
  v_total_with_utm bigint;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

  -- Get total events with any UTM parameter
  SELECT COUNT(*) INTO v_total_with_utm
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND (
      e.properties->>'utm_source' IS NOT NULL OR
      e.properties->'utm'->>'utm_source' IS NOT NULL OR
      e.properties->>'utm_medium' IS NOT NULL OR
      e.properties->'utm'->>'utm_medium' IS NOT NULL OR
      e.properties->>'utm_campaign' IS NOT NULL OR
      e.properties->'utm'->>'utm_campaign' IS NOT NULL
    );

  -- Sources
  SELECT json_agg(t) INTO v_sources FROM (
    SELECT 
      COALESCE(e.properties->>'utm_source', e.properties->'utm'->>'utm_source') as name,
      COUNT(*) as visits,
      CASE WHEN v_total_with_utm > 0 
        THEN ROUND((COUNT(*)::numeric / v_total_with_utm::numeric) * 100, 1)
        ELSE 0
      END as percentage
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND COALESCE(e.properties->>'utm_source', e.properties->'utm'->>'utm_source') IS NOT NULL
    GROUP BY COALESCE(e.properties->>'utm_source', e.properties->'utm'->>'utm_source')
    ORDER BY visits DESC
    LIMIT _limit
  ) t;

  -- Mediums
  SELECT json_agg(t) INTO v_mediums FROM (
    SELECT 
      COALESCE(e.properties->>'utm_medium', e.properties->'utm'->>'utm_medium') as name,
      COUNT(*) as visits,
      CASE WHEN v_total_with_utm > 0 
        THEN ROUND((COUNT(*)::numeric / v_total_with_utm::numeric) * 100, 1)
        ELSE 0
      END as percentage
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND COALESCE(e.properties->>'utm_medium', e.properties->'utm'->>'utm_medium') IS NOT NULL
    GROUP BY COALESCE(e.properties->>'utm_medium', e.properties->'utm'->>'utm_medium')
    ORDER BY visits DESC
    LIMIT _limit
  ) t;

  -- Campaigns
  SELECT json_agg(t) INTO v_campaigns FROM (
    SELECT 
      COALESCE(e.properties->>'utm_campaign', e.properties->'utm'->>'utm_campaign') as name,
      COUNT(*) as visits,
      CASE WHEN v_total_with_utm > 0 
        THEN ROUND((COUNT(*)::numeric / v_total_with_utm::numeric) * 100, 1)
        ELSE 0
      END as percentage
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND COALESCE(e.properties->>'utm_campaign', e.properties->'utm'->>'utm_campaign') IS NOT NULL
    GROUP BY COALESCE(e.properties->>'utm_campaign', e.properties->'utm'->>'utm_campaign')
    ORDER BY visits DESC
    LIMIT _limit
  ) t;

  RETURN json_build_object(
    'sources', COALESCE(v_sources, '[]'::json),
    'mediums', COALESCE(v_mediums, '[]'::json),
    'campaigns', COALESCE(v_campaigns, '[]'::json)
  );
END;
$function$;
