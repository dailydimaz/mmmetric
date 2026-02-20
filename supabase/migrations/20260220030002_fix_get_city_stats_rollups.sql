-- supabase/migrations/20260220030002_fix_get_city_stats_rollups.sql
-- Restores the missing analytics_geo_hourly rollup logic dropped in 20260219180000_fix_breakdown_rpcs.sql

CREATE OR REPLACE FUNCTION public.get_city_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 10, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(city text, country text, visits bigint, percentage numeric, latitude numeric, longitude numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_visits bigint;
  has_filters BOOLEAN;
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');
  
  -- Check if any meaningful filters are active
  has_filters := (_filters->>'country' IS NOT NULL) OR 
                 (_filters->>'browser' IS NOT NULL) OR 
                 (_filters->>'os' IS NOT NULL) OR 
                 (_filters->>'device' IS NOT NULL) OR 
                 (v_url_filter IS NOT NULL) OR 
                 (v_ref_filter IS NOT NULL);

  IF has_filters THEN
      -- Get total visits from events table if we need to filter
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
        AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
        AND e.city IS NOT NULL;
  ELSE
      -- Extremely fast count using the rollup table when no filters are present
      SELECT COALESCE(SUM(ah.visits), 0) INTO v_total_visits
      FROM analytics_geo_hourly ah
      WHERE ah.site_id = _site_id
        AND ah.hour_timestamp >= _start_date
        AND ah.hour_timestamp <= _end_date
        AND ah.city IS NOT NULL;
  END IF;

  IF v_total_visits = 0 THEN
      v_total_visits := 1; -- Protect against division by zero
  END IF;

  IF has_filters THEN
      RETURN QUERY
      SELECT 
        COALESCE(e.city, 'Unknown') as city,
        COALESCE(MAX(e.country), 'Unknown') as country,
        COUNT(*)::bigint as visits,
        ROUND((COUNT(*)::numeric / v_total_visits::numeric) * 100, 1) as percentage,
        MAX(cc.latitude)::numeric as latitude,
        MAX(cc.longitude)::numeric as longitude
      FROM events_partitioned e
      LEFT JOIN city_coordinates cc ON cc.country_code = e.country AND cc.city_name = e.city
      WHERE e.site_id = _site_id
        AND e.event_name = 'pageview'
        AND e.created_at >= _start_date
        AND e.created_at <= _end_date
        AND e.city IS NOT NULL
        AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
        AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
        AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
        AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
        AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
        AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
      GROUP BY e.city
      ORDER BY visits DESC
      LIMIT _limit;
  ELSE
      RETURN QUERY
      SELECT 
        COALESCE(ah.city, 'Unknown') as city,
        COALESCE(MAX(ah.country), 'Unknown') as country,
        SUM(ah.visits)::bigint as visits,
        ROUND((SUM(ah.visits)::numeric / v_total_visits::numeric) * 100, 1) as percentage,
        MAX(cc.latitude)::numeric as latitude,
        MAX(cc.longitude)::numeric as longitude
      FROM analytics_geo_hourly ah
      LEFT JOIN city_coordinates cc ON cc.country_code = ah.country AND cc.city_name = ah.city
      WHERE ah.site_id = _site_id
        AND ah.hour_timestamp >= _start_date
        AND ah.hour_timestamp <= _end_date
        AND ah.city IS NOT NULL
      GROUP BY ah.city
      ORDER BY visits DESC
      LIMIT _limit;
  END IF;
END;
$function$;
