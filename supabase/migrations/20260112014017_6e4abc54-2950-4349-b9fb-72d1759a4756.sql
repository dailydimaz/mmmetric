-- Drop existing function first, then recreate with new return type including avg_session_duration
DROP FUNCTION IF EXISTS public.get_site_stats(uuid, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, jsonb);

CREATE OR REPLACE FUNCTION public.get_site_stats(
  _site_id uuid,
  _start_date timestamp with time zone,
  _end_date timestamp with time zone,
  _prev_start_date timestamp with time zone,
  _prev_end_date timestamp with time zone,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  total_pageviews bigint,
  unique_visitors bigint,
  bounce_rate numeric,
  pageviews_change numeric,
  visitors_change numeric,
  avg_session_duration numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_pageviews bigint;
  current_visitors bigint;
  current_bounces bigint;
  current_sessions bigint;
  prev_pageviews bigint;
  prev_visitors bigint;
  session_duration_avg numeric;
BEGIN
  -- Verify access
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Current period stats
  SELECT 
    COUNT(*) FILTER (WHERE event_name = 'pageview'),
    COUNT(DISTINCT visitor_id)
  INTO current_pageviews, current_visitors
  FROM events
  WHERE site_id = _site_id
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND ((_filters->>'country') IS NULL OR country = _filters->>'country')
    AND ((_filters->>'browser') IS NULL OR browser = _filters->>'browser')
    AND ((_filters->>'os') IS NULL OR os = _filters->>'os')
    AND ((_filters->>'device') IS NULL OR device_type = _filters->>'device')
    AND ((_filters->>'url') IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
    AND ((_filters->>'referrerPattern') IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

  -- Calculate bounce rate (sessions with only 1 pageview)
  WITH session_counts AS (
    SELECT session_id, COUNT(*) FILTER (WHERE event_name = 'pageview') as pv_count
    FROM events
    WHERE site_id = _site_id
      AND created_at >= _start_date
      AND created_at <= _end_date
      AND session_id IS NOT NULL
      AND ((_filters->>'country') IS NULL OR country = _filters->>'country')
      AND ((_filters->>'browser') IS NULL OR browser = _filters->>'browser')
      AND ((_filters->>'os') IS NULL OR os = _filters->>'os')
      AND ((_filters->>'device') IS NULL OR device_type = _filters->>'device')
      AND ((_filters->>'url') IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
      AND ((_filters->>'referrerPattern') IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
    GROUP BY session_id
  )
  SELECT 
    COUNT(*) FILTER (WHERE pv_count = 1),
    COUNT(*)
  INTO current_bounces, current_sessions
  FROM session_counts;

  -- Calculate average session duration (in seconds)
  -- Only for sessions with more than 1 event
  WITH session_times AS (
    SELECT 
      session_id,
      EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration_seconds
    FROM events
    WHERE site_id = _site_id
      AND created_at >= _start_date
      AND created_at <= _end_date
      AND session_id IS NOT NULL
      AND ((_filters->>'country') IS NULL OR country = _filters->>'country')
      AND ((_filters->>'browser') IS NULL OR browser = _filters->>'browser')
      AND ((_filters->>'os') IS NULL OR os = _filters->>'os')
      AND ((_filters->>'device') IS NULL OR device_type = _filters->>'device')
      AND ((_filters->>'url') IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
      AND ((_filters->>'referrerPattern') IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
    GROUP BY session_id
    HAVING COUNT(*) > 1
  )
  SELECT COALESCE(AVG(duration_seconds), 0)
  INTO session_duration_avg
  FROM session_times;

  -- Previous period stats
  SELECT 
    COUNT(*) FILTER (WHERE event_name = 'pageview'),
    COUNT(DISTINCT visitor_id)
  INTO prev_pageviews, prev_visitors
  FROM events
  WHERE site_id = _site_id
    AND created_at >= _prev_start_date
    AND created_at <= _prev_end_date
    AND ((_filters->>'country') IS NULL OR country = _filters->>'country')
    AND ((_filters->>'browser') IS NULL OR browser = _filters->>'browser')
    AND ((_filters->>'os') IS NULL OR os = _filters->>'os')
    AND ((_filters->>'device') IS NULL OR device_type = _filters->>'device')
    AND ((_filters->>'url') IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
    AND ((_filters->>'referrerPattern') IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

  RETURN QUERY SELECT
    current_pageviews,
    current_visitors,
    CASE WHEN current_sessions > 0 
      THEN ROUND((current_bounces::numeric / current_sessions) * 100, 1) 
      ELSE 0 
    END,
    CASE WHEN prev_pageviews > 0 
      THEN ROUND(((current_pageviews - prev_pageviews)::numeric / prev_pageviews) * 100, 1) 
      ELSE 0 
    END,
    CASE WHEN prev_visitors > 0 
      THEN ROUND(((current_visitors - prev_visitors)::numeric / prev_visitors) * 100, 1) 
      ELSE 0 
    END,
    ROUND(session_duration_avg, 0);
END;
$$;