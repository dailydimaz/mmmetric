-- General Analytics RPCs
-- These functions handle all general dashboard statistics server-side for scalability

-- =====================================================
-- 1. GET_SITE_STATS - Overall dashboard numbers
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_site_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _prev_start_date timestamptz,
  _prev_end_date timestamptz
)
RETURNS TABLE(
  total_pageviews bigint,
  unique_visitors bigint,
  avg_session_duration numeric,
  bounce_rate numeric,
  pageviews_change numeric,
  visitors_change numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  curr_pageviews bigint;
  curr_visitors bigint;
  curr_bounces bigint;
  curr_sessions bigint;
  prev_pageviews bigint;
  prev_visitors bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Current Period Stats
  SELECT 
    COUNT(*),
    COUNT(DISTINCT visitor_id),
    COUNT(DISTINCT session_id)
  INTO curr_pageviews, curr_visitors, curr_sessions
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date;

  -- Bounce Rate Calculation
  -- Count sessions with exactly one pageview
  WITH session_counts AS (
    SELECT session_id
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND created_at >= _start_date
      AND created_at <= _end_date
      AND session_id IS NOT NULL
    GROUP BY session_id
    HAVING COUNT(*) = 1
  )
  SELECT COUNT(*) INTO curr_bounces FROM session_counts;

  -- Previous Period Stats (for comparison)
  SELECT 
    COUNT(*),
    COUNT(DISTINCT visitor_id)
  INTO prev_pageviews, prev_visitors
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _prev_start_date
    AND created_at <= _prev_end_date;

  -- Return results
  RETURN QUERY SELECT
    COALESCE(curr_pageviews, 0),
    COALESCE(curr_visitors, 0),
    0::numeric, -- Avg session duration requires more complex tracking, placeholder for now
    CASE WHEN curr_sessions > 0 
      THEN ROUND((curr_bounces::numeric / curr_sessions::numeric) * 100, 1)
      ELSE 0
    END,
    CASE WHEN prev_pageviews > 0 
      THEN ROUND(((curr_pageviews - prev_pageviews)::numeric / prev_pageviews::numeric) * 100, 1)
      ELSE 0
    END,
    CASE WHEN prev_visitors > 0 
      THEN ROUND(((curr_visitors - prev_visitors)::numeric / prev_visitors::numeric) * 100, 1)
      ELSE 0
    END;
END;
$$;

-- =====================================================
-- 2. GET_TIMESERIES_STATS - Chart data
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_timeseries_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  date text,
  pageviews bigint,
  visitors bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      DATE(created_at) as stat_date,
      COUNT(*) as pv,
      COUNT(DISTINCT visitor_id) as uv
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND created_at >= _start_date
      AND created_at <= _end_date
    GROUP BY DATE(created_at)
  )
  SELECT
    to_char(d, 'YYYY-MM-DD'),
    COALESCE(ds.pv, 0),
    COALESCE(ds.uv, 0)
  FROM generate_series(_start_date, _end_date, '1 day'::interval) d
  LEFT JOIN daily_stats ds ON ds.stat_date = DATE(d)
  ORDER BY d;
END;
$$;

-- =====================================================
-- 3. GET_TOP_PAGES
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_top_pages(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  url text,
  pageviews bigint,
  unique_visitors bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(e.url, '/'),
    COUNT(*) as pv,
    COUNT(DISTINCT e.visitor_id) as uv
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
  GROUP BY COALESCE(e.url, '/')
  ORDER BY pv DESC
  LIMIT _limit;
END;
$$;

-- =====================================================
-- 4. GET_TOP_REFERRERS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_top_referrers(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  referrer text,
  visits bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_refs bigint;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Count total requests with a referrer to calculate percentage
  SELECT COUNT(*) INTO total_refs
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND referrer IS NOT NULL;

  RETURN QUERY
  SELECT
    split_part(e.referrer, '/', 3) as ref_domain, -- Simple extraction of domain
    COUNT(*) as val,
    CASE WHEN total_refs > 0 
      THEN ROUND((COUNT(*)::numeric / total_refs::numeric) * 100, 1)
      ELSE 0
    END
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.referrer IS NOT NULL
  GROUP BY ref_domain
  ORDER BY val DESC
  LIMIT _limit;
END;
$$;

-- =====================================================
-- 5. GET_DEVICE_STATS (Combined)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_device_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_events bigint;
  browsers jsonb;
  os jsonb;
  devices jsonb;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_events
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date;

  -- Browsers
  SELECT jsonb_agg(jsonb_build_object('name', name, 'value', val, 'percentage', 
    CASE WHEN total_events > 0 THEN ROUND((val::numeric / total_events::numeric) * 100, 1) ELSE 0 END))
  INTO browsers
  FROM (
    SELECT browser as name, COUNT(*) as val
    FROM events
    WHERE site_id = _site_id AND event_name = 'pageview' AND created_at >= _start_date AND created_at <= _end_date AND browser IS NOT NULL
    GROUP BY browser ORDER BY val DESC LIMIT 10
  ) t;

  -- OS
  SELECT jsonb_agg(jsonb_build_object('name', name, 'value', val, 'percentage', 
    CASE WHEN total_events > 0 THEN ROUND((val::numeric / total_events::numeric) * 100, 1) ELSE 0 END))
  INTO os
  FROM (
    SELECT os as name, COUNT(*) as val
    FROM events
    WHERE site_id = _site_id AND event_name = 'pageview' AND created_at >= _start_date AND created_at <= _end_date AND os IS NOT NULL
    GROUP BY os ORDER BY val DESC LIMIT 10
  ) t;

  -- Devices
  SELECT jsonb_agg(jsonb_build_object('name', name, 'value', val, 'percentage', 
    CASE WHEN total_events > 0 THEN ROUND((val::numeric / total_events::numeric) * 100, 1) ELSE 0 END))
  INTO devices
  FROM (
    SELECT device_type as name, COUNT(*) as val
    FROM events
    WHERE site_id = _site_id AND event_name = 'pageview' AND created_at >= _start_date AND created_at <= _end_date AND device_type IS NOT NULL
    GROUP BY device_type ORDER BY val DESC LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'browsers', COALESCE(browsers, '[]'::jsonb),
    'operatingSystems', COALESCE(os, '[]'::jsonb),
    'devices', COALESCE(devices, '[]'::jsonb)
  );
END;
$$;

-- =====================================================
-- 6. GET_GEO_STATS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_geo_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  country text,
  visits bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_geo bigint;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_geo
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date;

  RETURN QUERY
  SELECT
    e.country,
    COUNT(*) as val,
    CASE WHEN total_geo > 0 
      THEN ROUND((COUNT(*)::numeric / total_geo::numeric) * 100, 1)
      ELSE 0
    END
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.country IS NOT NULL
  GROUP BY e.country
  ORDER BY val DESC
  LIMIT 10;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_site_stats(uuid, timestamptz, timestamptz, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_timeseries_stats(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pages(uuid, timestamptz, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_referrers(uuid, timestamptz, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_device_stats(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_geo_stats(uuid, timestamptz, timestamptz) TO authenticated;
