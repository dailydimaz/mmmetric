CREATE OR REPLACE FUNCTION public.get_site_group_stats(
  _group_id UUID,
  _start_date DATE,
  _end_date DATE,
  _prev_start_date DATE DEFAULT NULL,
  _prev_end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _site_ids UUID[];
  _result JSON;
  _current_stats JSON;
  _prev_stats JSON;
BEGIN
  -- Get site IDs in the group
  SELECT array_agg(site_id) INTO _site_ids
  FROM site_group_members
  WHERE group_id = _group_id;

  IF _site_ids IS NULL THEN
    RETURN json_build_object(
      'visitors', 0,
      'pageviews', 0,
      'bounce_rate', 0,
      'timeseries', '[]'::json,
      'top_referrers', '[]'::json,
      'top_sites', '[]'::json,
      'previous', NULL
    );
  END IF;

  -- Calculate current period stats
  SELECT json_build_object(
    'visitors', COUNT(DISTINCT visitor_id),
    'pageviews', COUNT(*),
    'sessions', COUNT(DISTINCT session_id),
    'bounced_sessions', COUNT(DISTINCT session_id) FILTER (WHERE session_id IN (
      SELECT session_id 
      FROM events 
      WHERE site_id = ANY(_site_ids) AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
      GROUP BY session_id 
      HAVING count(*) = 1
    ))
  ) INTO _current_stats
  FROM events
  WHERE site_id = ANY(_site_ids) AND created_at >= _start_date AND created_at < _end_date + interval '1 day';

  -- Calculate previous period stats if dates provided
  IF _prev_start_date IS NOT NULL AND _prev_end_date IS NOT NULL THEN
    SELECT json_build_object(
      'visitors', COUNT(DISTINCT visitor_id),
      'pageviews', COUNT(*),
      'sessions', COUNT(DISTINCT session_id),
      'bounced_sessions', COUNT(DISTINCT session_id) FILTER (WHERE session_id IN (
        SELECT session_id 
        FROM events 
        WHERE site_id = ANY(_site_ids) AND created_at >= _prev_start_date AND created_at < _prev_end_date + interval '1 day'
        GROUP BY session_id 
        HAVING count(*) = 1
      ))
    ) INTO _prev_stats
    FROM events
    WHERE site_id = ANY(_site_ids) AND created_at >= _prev_start_date AND created_at < _prev_end_date + interval '1 day';
  END IF;

  -- Build final result
  SELECT json_build_object(
    'visitors', (_current_stats->>'visitors')::int,
    'pageviews', (_current_stats->>'pageviews')::int,
    'sessions', (_current_stats->>'sessions')::int,
    'bounce_rate', CASE 
      WHEN (_current_stats->>'sessions')::int > 0 
      THEN ROUND(((_current_stats->>'bounced_sessions')::float / (_current_stats->>'sessions')::float * 100)::numeric, 1)
      ELSE 0 
    END,
    'previous', CASE WHEN _prev_stats IS NOT NULL THEN json_build_object(
      'visitors', (_prev_stats->>'visitors')::int,
      'pageviews', (_prev_stats->>'pageviews')::int,
      'sessions', (_prev_stats->>'sessions')::int,
      'bounce_rate', CASE 
        WHEN (_prev_stats->>'sessions')::int > 0 
        THEN ROUND(((_prev_stats->>'bounced_sessions')::float / (_prev_stats->>'sessions')::float * 100)::numeric, 1)
        ELSE 0 
      END
    ) ELSE NULL END,
    'timeseries', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          date_trunc('day', created_at) as date,
          COUNT(*) as pageviews,
          COUNT(DISTINCT visitor_id) as visitors
        FROM events
        WHERE site_id = ANY(_site_ids) AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
        GROUP BY 1
        ORDER BY 1
      ) t
    ),
    'top_sites', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          s.name, 
          COUNT(*) as pageviews,
          COUNT(DISTINCT e.visitor_id) as visitors
        FROM events e
        JOIN sites s ON e.site_id = s.id
        WHERE e.site_id = ANY(_site_ids) AND e.created_at >= _start_date AND e.created_at < _end_date + interval '1 day'
        GROUP BY s.name
        ORDER BY pageviews DESC
        LIMIT 10
      ) t
    ),
    'top_referrers', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          referrer,
          COUNT(*) as pageviews,
          COUNT(DISTINCT visitor_id) as visitors
        FROM events
        WHERE site_id = ANY(_site_ids) 
          AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
          AND referrer IS NOT NULL
        GROUP BY referrer
        ORDER BY pageviews DESC
        LIMIT 10
      ) t
    )
  ) INTO _result;

  RETURN _result;
END;
$$;
