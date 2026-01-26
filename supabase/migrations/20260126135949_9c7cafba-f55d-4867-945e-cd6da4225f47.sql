-- RPC to get aggregated stats for a site group

CREATE OR REPLACE FUNCTION public.get_site_group_stats(
  _group_id UUID,
  _start_date DATE,
  _end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _site_ids UUID[];
  _result JSON;
BEGIN
  -- Get site IDs in the group
  SELECT array_agg(site_id) INTO _site_ids
  FROM site_group_members
  WHERE group_id = _group_id;

  IF _site_ids IS NULL THEN
    RETURN json_build_object(
      'visitors', 0,
      'pageviews', 0,
      'timeseries', '[]'::json
    );
  END IF;

  -- Aggregate stats
  SELECT json_build_object(
    'visitors', (
      SELECT COUNT(DISTINCT visitor_id) 
      FROM events 
      WHERE site_id = ANY(_site_ids) AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
    ),
    'pageviews', (
      SELECT COUNT(*) 
      FROM events 
      WHERE site_id = ANY(_site_ids) AND event_name = 'pageview' AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
    ),
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
    )
  ) INTO _result;

  RETURN _result;
END;
$$;