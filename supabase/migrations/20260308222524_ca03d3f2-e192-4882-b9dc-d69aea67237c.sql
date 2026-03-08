CREATE OR REPLACE FUNCTION public.get_custom_properties_breakdown(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _event_name text DEFAULT NULL,
  _property_key text DEFAULT NULL,
  _limit int DEFAULT 20
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF _property_key IS NOT NULL THEN
    -- Get breakdown of values for a specific property key
    SELECT json_agg(t ORDER BY count DESC)
    INTO result
    FROM (
      SELECT 
        e.properties->>_property_key as value,
        COUNT(*) as count,
        COUNT(DISTINCT e.visitor_id) as unique_visitors
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.created_at >= _start_date
        AND e.created_at <= _end_date
        AND e.event_name != 'pageview'
        AND (_event_name IS NULL OR e.event_name = _event_name)
        AND e.properties->>_property_key IS NOT NULL
      GROUP BY e.properties->>_property_key
      ORDER BY count DESC
      LIMIT _limit
    ) t;
  ELSE
    -- Get top property keys across all custom events
    SELECT json_agg(t ORDER BY occurrences DESC)
    INTO result
    FROM (
      SELECT 
        key,
        COUNT(*) as occurrences
      FROM events_partitioned e,
        jsonb_object_keys(e.properties) AS key
      WHERE e.site_id = _site_id
        AND e.created_at >= _start_date
        AND e.created_at <= _end_date
        AND e.event_name != 'pageview'
        AND (_event_name IS NULL OR e.event_name = _event_name)
        AND e.properties IS NOT NULL
        AND e.properties != '{}'::jsonb
        AND key NOT IN ('utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'duration_seconds', 'percent', 'custom_id', 'data')
      GROUP BY key
      ORDER BY occurrences DESC
      LIMIT _limit
    ) t;
  END IF;

  RETURN COALESCE(result, '[]'::json);
END;
$$;