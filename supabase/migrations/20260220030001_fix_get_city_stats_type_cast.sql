-- supabase/migrations/20260220030001_fix_get_city_stats_type_cast.sql

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
    MAX(cc.latitude)::numeric as latitude,
    MAX(cc.longitude)::numeric as longitude
  FROM events_partitioned e
  LEFT JOIN city_coordinates cc ON cc.country_code = e.country AND cc.city_name = e.city
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
