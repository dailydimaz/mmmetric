-- Fix ambiguous column references in analytics RPCs
-- The returned columns (pageviews, unique_visitors, etc.) conflicted with table columns in the queries

-- 1. Fix get_site_stats
CREATE OR REPLACE FUNCTION public.get_site_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _filters jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(total_pageviews bigint, unique_visitors bigint, avg_session_duration numeric, bounce_rate numeric, pageviews_change numeric, visitors_change numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pageviews BIGINT := 0;
  v_visitors BIGINT := 0;
  v_sessions BIGINT := 0;
  v_bounces BIGINT := 0;
  v_duration BIGINT := 0;
  v_bounce_rate NUMERIC := 0;
  v_prev_pageviews BIGINT := 0;
  v_prev_visitors BIGINT := 0;
  v_prev_start_date TIMESTAMPTZ;
  v_prev_end_date TIMESTAMPTZ;
  v_date_range INTERVAL;
  v_has_filters BOOLEAN;
  v_current_hour TIMESTAMPTZ;
  v_current_hour_data RECORD;
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', NOW());
  v_date_range := _end_date - _start_date;
  v_prev_end_date := _start_date;
  v_prev_start_date := _start_date - v_date_range;
  
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
    -- Filtered path (using events_partitioned directly)
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

    SELECT 
      COUNT(*) FILTER (WHERE e.event_name = 'pageview'),
      COUNT(DISTINCT e.visitor_id)
    INTO v_prev_pageviews, v_prev_visitors
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.created_at >= v_prev_start_date
      AND e.created_at <= v_prev_end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
      AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\');
  ELSE
    -- Hybrid path (rollups + recent data)
    SELECT 
      COALESCE(SUM(ah.pageviews), 0),
      COALESCE(SUM(ah.unique_visitors), 0),
      COALESCE(SUM(ah.sessions), 0),
      COALESCE(SUM(ah.bounces), 0),
      COALESCE(SUM(ah.total_session_duration), 0)
    INTO v_pageviews, v_visitors, v_sessions, v_bounces, v_duration
    FROM analytics_hourly ah
    WHERE ah.site_id = _site_id
      AND ah.hour_timestamp >= _start_date
      AND ah.hour_timestamp < LEAST(_end_date, v_current_hour);

    SELECT 
      COUNT(*) FILTER (WHERE e.event_name = 'pageview'),
      COUNT(DISTINCT e.visitor_id),
      COUNT(DISTINCT e.session_id)
    INTO v_current_hour_data
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.created_at >= v_current_hour
      AND e.created_at <= _end_date;

    IF v_current_hour_data IS NOT NULL THEN
      v_pageviews := v_pageviews + COALESCE(v_current_hour_data.count, 0);
    END IF;

    IF v_duration = 0 AND v_sessions > 0 THEN
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
        GROUP BY e.session_id
        HAVING COUNT(*) > 1
      ) durations;
    END IF;

    SELECT 
      COALESCE(SUM(ah.pageviews), 0),
      COALESCE(SUM(ah.unique_visitors), 0)
    INTO v_prev_pageviews, v_prev_visitors
    FROM analytics_hourly ah
    WHERE ah.site_id = _site_id
      AND ah.hour_timestamp >= v_prev_start_date
      AND ah.hour_timestamp < v_prev_end_date;
  END IF;

  IF v_sessions > 0 THEN
    v_bounce_rate := ROUND((v_bounces::numeric / v_sessions::numeric) * 100, 1);
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

-- 2. Fix get_timeseries_stats
CREATE OR REPLACE FUNCTION public.get_timeseries_stats(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _prev_start_date timestamp with time zone, _prev_end_date timestamp with time zone, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(date text, pageviews bigint, visitors bigint, prev_pageviews bigint, prev_visitors bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_has_filters BOOLEAN;
  period_days int;
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  v_has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;
  period_days := EXTRACT(DAY FROM (_end_date - _start_date))::int + 1;

  -- Escape LIKE wildcards
  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

  IF v_has_filters THEN
    RETURN QUERY
    WITH current_data AS (
      SELECT 
        to_char(e.created_at, 'YYYY-MM-DD') as day,
        COUNT(*) as pv,
        COUNT(DISTINCT e.visitor_id) as vis
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
      GROUP BY to_char(e.created_at, 'YYYY-MM-DD')
    ),
    prev_data AS (
      SELECT 
        to_char(e.created_at + (period_days || ' days')::interval, 'YYYY-MM-DD') as day,
        COUNT(*) as pv,
        COUNT(DISTINCT e.visitor_id) as vis
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.event_name = 'pageview'
        AND e.created_at >= _prev_start_date
        AND e.created_at <= _prev_end_date
        AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
        AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
        AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
        AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
        AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
        AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
      GROUP BY to_char(e.created_at + (period_days || ' days')::interval, 'YYYY-MM-DD')
    ),
    all_dates AS (
      SELECT day FROM current_data
      UNION
      SELECT day FROM prev_data
    )
    SELECT 
      ad.day,
      COALESCE(c.pv, 0)::bigint,
      COALESCE(c.vis, 0)::bigint,
      COALESCE(p.pv, 0)::bigint,
      COALESCE(p.vis, 0)::bigint
    FROM all_dates ad
    LEFT JOIN current_data c ON c.day = ad.day
    LEFT JOIN prev_data p ON p.day = ad.day
    ORDER BY ad.day;
  ELSE
    RETURN QUERY
    WITH hourly_current AS (
      SELECT 
        to_char(ah.hour_timestamp, 'YYYY-MM-DD') as day,
        SUM(ah.pageviews) as pv,
        SUM(ah.unique_visitors) as vis
      FROM analytics_hourly ah
      WHERE ah.site_id = _site_id
        AND ah.hour_timestamp >= _start_date
        AND ah.hour_timestamp < LEAST(_end_date, v_current_hour)
      GROUP BY to_char(ah.hour_timestamp, 'YYYY-MM-DD')
    ),
    hourly_prev AS (
      SELECT 
        to_char(ah.hour_timestamp + (period_days || ' days')::interval, 'YYYY-MM-DD') as day,
        SUM(ah.pageviews) as pv,
        SUM(ah.unique_visitors) as vis
      FROM analytics_hourly ah
      WHERE ah.site_id = _site_id
        AND ah.hour_timestamp >= _prev_start_date
        AND ah.hour_timestamp < _prev_end_date
      GROUP BY to_char(ah.hour_timestamp + (period_days || ' days')::interval, 'YYYY-MM-DD')
    ),
    all_dates AS (
      SELECT day FROM hourly_current
      UNION
      SELECT day FROM hourly_prev
    )
    SELECT 
      ad.day,
      COALESCE(hc.pv, 0)::bigint,
      COALESCE(hc.vis, 0)::bigint,
      COALESCE(hp.pv, 0)::bigint,
      COALESCE(hp.vis, 0)::bigint
    FROM all_dates ad
    LEFT JOIN hourly_current hc ON hc.day = ad.day
    LEFT JOIN hourly_prev hp ON hp.day = ad.day
    ORDER BY ad.day;
  END IF;
END;
$function$;
