-- Fix get_site_stats (6-param overload) to include current hour duration and sessions
-- Previously, it ignored current hour data for duration/sessions in the Hybrid path

CREATE OR REPLACE FUNCTION public.get_site_stats(
  _site_id uuid,
  _start_date timestamp with time zone,
  _end_date timestamp with time zone,
  _prev_start_date timestamp with time zone,
  _prev_end_date timestamp with time zone,
  _filters jsonb DEFAULT NULL::jsonb
)
 RETURNS TABLE(total_pageviews bigint, unique_visitors bigint, avg_session_duration numeric, bounce_rate numeric, pageviews_change numeric, visitors_change numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_pageviews BIGINT := 0;
  v_visitors BIGINT := 0;
  v_sessions BIGINT := 0;
  v_bounces BIGINT := 0;
  v_duration BIGINT := 0;
  v_prev_pageviews BIGINT := 0;
  v_prev_visitors BIGINT := 0;
  v_bounce_rate NUMERIC := 0;
  v_has_filters BOOLEAN;
  v_current_hour_data RECORD;
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  
  v_has_filters := _filters IS NOT NULL AND (
    _filters->>'country' IS NOT NULL OR
    _filters->>'browser' IS NOT NULL OR
    _filters->>'os' IS NOT NULL OR
    _filters->>'device' IS NOT NULL OR
    _filters->>'url' IS NOT NULL OR
    _filters->>'referrerPattern' IS NOT NULL
  );

  -- Escape LIKE wildcards in user input
  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

  IF v_has_filters THEN
    -- Filtered path uses events_partitioned (BRIN-optimized)
    SELECT 
      COUNT(*) FILTER (WHERE e.event_name = 'pageview'),
      COUNT(DISTINCT e.visitor_id),
      COUNT(DISTINCT e.session_id)
    INTO v_pageviews, v_visitors, v_sessions
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
      AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\');

    SELECT COALESCE(SUM(session_dur), 0)::BIGINT
    INTO v_duration
    FROM (
      SELECT 
        e.session_id,
        EXTRACT(EPOCH FROM (MAX(e.created_at) - MIN(e.created_at))) AS session_dur
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.created_at >= _start_date
        AND e.created_at <= _end_date
        AND e.session_id IS NOT NULL
        AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
        AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
        AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
        AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
        AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
        AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
      GROUP BY e.session_id
      HAVING COUNT(*) > 1
    ) durations;

    SELECT COUNT(DISTINCT e.session_id)
    INTO v_bounces
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND e.session_id IS NOT NULL
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
      AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
      AND e.session_id IN (
        SELECT ep.session_id 
        FROM events_partitioned ep 
        WHERE ep.site_id = _site_id
          AND ep.created_at >= _start_date
          AND ep.created_at <= _end_date
        GROUP BY ep.session_id 
        HAVING COUNT(*) = 1
      );

    -- Previous period fetch (filtered)
    SELECT 
      COUNT(*) FILTER (WHERE e.event_name = 'pageview'),
      COUNT(DISTINCT e.visitor_id)
    INTO v_prev_pageviews, v_prev_visitors
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.created_at >= _prev_start_date
      AND e.created_at <= _prev_end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
      AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\');

  ELSE
    -- HYBRID: Rollups + Current Hour from events_partitioned
    SELECT 
      COALESCE(SUM(ah.pageviews), 0),
      COALESCE(SUM(ah.unique_visitors), 0),
      COALESCE(SUM(ah.sessions), 0),
      COALESCE(SUM(ah.bounces), 0),
      COALESCE(SUM(ah.total_session_duration), 0)
    INTO v_pageviews, v_visitors, v_sessions, v_bounces, v_duration
    FROM analytics_hourly ah
    WHERE ah.site_id = _site_id
      AND ah.hour_timestamp >= date_trunc('hour', _start_date)
      AND ah.hour_timestamp < v_current_hour
      AND ah.hour_timestamp <= _end_date;
    
    -- Add current hour from events_partitioned
    -- 1. Counts
    SELECT 
      v_pageviews + COUNT(*) FILTER (WHERE e.event_name = 'pageview'),
      v_visitors + COUNT(DISTINCT e.visitor_id),
      v_sessions + COUNT(DISTINCT e.session_id)
    INTO v_pageviews, v_visitors, v_sessions
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.created_at >= v_current_hour
      AND e.created_at <= _end_date;
      
   -- 2. Duration for current hour
   SELECT v_duration + COALESCE(SUM(session_dur), 0)::BIGINT
   INTO v_duration
   FROM (
      SELECT 
        EXTRACT(EPOCH FROM (MAX(e.created_at) - MIN(e.created_at))) AS session_dur
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.created_at >= v_current_hour
        AND e.created_at <= _end_date
        AND e.session_id IS NOT NULL
      GROUP BY e.session_id
      HAVING COUNT(*) > 1
   ) durations;
   
   -- 3. Bounces for current hour
    WITH session_counts AS (
      SELECT session_id, COUNT(*) as cnt
      FROM events_partitioned
      WHERE site_id = _site_id
        AND event_name = 'pageview'
        AND created_at >= v_current_hour
        AND created_at <= _end_date
        AND session_id IS NOT NULL
      GROUP BY session_id
    )
    SELECT v_bounces + COUNT(*)
    INTO v_bounces
    FROM session_counts
    WHERE cnt = 1;

    -- Previous period from rollups
    SELECT 
      COALESCE(SUM(ah.pageviews), 0),
      COALESCE(SUM(ah.unique_visitors), 0)
    INTO v_prev_pageviews, v_prev_visitors
    FROM analytics_hourly ah
    WHERE ah.site_id = _site_id
      AND ah.hour_timestamp >= date_trunc('hour', _prev_start_date)
      AND ah.hour_timestamp <= _prev_end_date;
  END IF;

  -- Calculate bounce rate from aggregated values
  IF v_sessions > 0 THEN
    v_bounce_rate := ROUND((v_bounces::numeric / v_sessions::numeric) * 100, 1);
  ELSE
    v_bounce_rate := 0;
  END IF;

  RETURN QUERY SELECT 
    v_pageviews,
    v_visitors,
    CASE WHEN v_sessions > 0 THEN ROUND(v_duration::numeric / v_sessions::numeric, 1) ELSE 0 END,
    v_bounce_rate,
    CASE WHEN v_prev_pageviews > 0 
      THEN ROUND(((v_pageviews - v_prev_pageviews)::numeric / v_prev_pageviews::numeric) * 100, 1)
      ELSE 0
    END,
    CASE WHEN v_prev_visitors > 0 
      THEN ROUND(((v_visitors - v_prev_visitors)::numeric / v_prev_visitors::numeric) * 100, 1)
      ELSE 0
    END;
END;
$function$;
