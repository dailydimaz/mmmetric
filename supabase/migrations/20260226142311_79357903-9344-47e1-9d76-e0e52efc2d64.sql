
-- RPC: get_engagement_stats - aggregates engagement events server-side
CREATE OR REPLACE FUNCTION public.get_engagement_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  url text,
  avg_duration numeric,
  total_duration numeric,
  visits bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify site ownership
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(e.url, '/') AS url,
    ROUND(AVG((e.properties->>'duration_seconds')::numeric), 1) AS avg_duration,
    ROUND(SUM((e.properties->>'duration_seconds')::numeric), 1) AS total_duration,
    COUNT(*)::bigint AS visits
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name = 'engagement'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND (e.properties->>'duration_seconds')::numeric > 0
  GROUP BY COALESCE(e.url, '/')
  ORDER BY avg_duration DESC
  LIMIT _limit;
END;
$$;

-- RPC: get_scroll_depth_stats - aggregates scroll depth events server-side
CREATE OR REPLACE FUNCTION public.get_scroll_depth_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_agg(page_data ORDER BY total_100 DESC)
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'url', url_group,
      'milestones', jsonb_build_object(
        '25', SUM(CASE WHEN depth = 25 THEN 1 ELSE 0 END),
        '50', SUM(CASE WHEN depth = 50 THEN 1 ELSE 0 END),
        '75', SUM(CASE WHEN depth = 75 THEN 1 ELSE 0 END),
        '90', SUM(CASE WHEN depth = 90 THEN 1 ELSE 0 END),
        '100', SUM(CASE WHEN depth = 100 THEN 1 ELSE 0 END)
      ),
      'total_events', COUNT(*)
    ) AS page_data,
    SUM(CASE WHEN depth = 100 THEN 1 ELSE 0 END) AS total_100
    FROM (
      SELECT
        COALESCE(e.url, '/') AS url_group,
        (e.properties->>'percent')::integer AS depth
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.event_name = 'scroll_depth'
        AND e.created_at >= _start_date
        AND e.created_at <= _end_date
    ) raw
    GROUP BY url_group
    LIMIT _limit
  ) sub;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- RPC: get_form_analytics_stats - aggregates form events server-side
CREATE OR REPLACE FUNCTION public.get_form_analytics_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  form_id text,
  starts bigint,
  submissions bigint,
  abandons bigint,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(e.properties->>'form_id', 'unknown-form') AS form_id,
    SUM(CASE WHEN e.event_name = 'form_start' THEN 1 ELSE 0 END)::bigint AS starts,
    SUM(CASE WHEN e.event_name = 'form_submit' THEN 1 ELSE 0 END)::bigint AS submissions,
    SUM(CASE WHEN e.event_name = 'form_abandon' THEN 1 ELSE 0 END)::bigint AS abandons,
    CASE 
      WHEN SUM(CASE WHEN e.event_name = 'form_start' THEN 1 ELSE 0 END) > 0
      THEN ROUND(
        SUM(CASE WHEN e.event_name = 'form_submit' THEN 1 ELSE 0 END)::numeric /
        SUM(CASE WHEN e.event_name = 'form_start' THEN 1 ELSE 0 END)::numeric * 100, 1
      )
      ELSE 0
    END AS conversion_rate
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name IN ('form_start', 'form_submit', 'form_abandon')
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
  GROUP BY COALESCE(e.properties->>'form_id', 'unknown-form')
  ORDER BY submissions DESC;
END;
$$;

-- RPC: get_event_groups_stats - aggregates non-pageview events server-side
CREATE OR REPLACE FUNCTION public.get_event_groups_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  event_name text,
  event_count bigint,
  last_occurrence timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    e.event_name,
    COUNT(*)::bigint AS event_count,
    MAX(e.created_at) AS last_occurrence
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name != 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
  GROUP BY e.event_name
  ORDER BY event_count DESC;
END;
$$;

-- RPC: get_file_download_stats - aggregates file download events server-side
CREATE OR REPLACE FUNCTION public.get_file_download_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  filename text,
  extension text,
  href text,
  download_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(e.properties->>'filename', 'unknown') AS filename,
    COALESCE(e.properties->>'extension', 'unknown') AS extension,
    COALESCE(e.properties->>'href', '#') AS href,
    COUNT(*)::bigint AS download_count
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name = 'file_download'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
  GROUP BY
    COALESCE(e.properties->>'filename', 'unknown'),
    COALESCE(e.properties->>'extension', 'unknown'),
    COALESCE(e.properties->>'href', '#')
  ORDER BY download_count DESC
  LIMIT _limit;
END;
$$;
