
-- Batch 8: Add region column to events_partitioned and create region stats RPC
-- Add region column
ALTER TABLE public.events_partitioned ADD COLUMN IF NOT EXISTS region TEXT;

-- Create index for region queries
CREATE INDEX IF NOT EXISTS idx_events_partitioned_region ON public.events_partitioned (site_id, region) WHERE region IS NOT NULL;

-- Create get_region_stats RPC
CREATE OR REPLACE FUNCTION public.get_region_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _country text DEFAULT NULL,
  _limit int DEFAULT 20,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(region text, country text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND e.region IS NOT NULL
    AND (_country IS NULL OR e.country = _country)
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
    AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\');

  RETURN QUERY
  SELECT 
    e.region,
    COALESCE(e.country, 'Unknown') as country,
    COUNT(*) as visits,
    CASE WHEN v_total_visits > 0 
      THEN ROUND((COUNT(*)::numeric / v_total_visits::numeric) * 100, 1)
      ELSE 0
    END as percentage
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.region IS NOT NULL
    AND (_country IS NULL OR e.country = _country)
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
    AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
  GROUP BY e.region, e.country
  ORDER BY visits DESC
  LIMIT _limit;
END;
$$;

-- Batch 7: Add year-over-year comparison RPC
CREATE OR REPLACE FUNCTION public.get_yoy_comparison(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  date text,
  pageviews bigint,
  visitors bigint,
  yoy_pageviews bigint,
  yoy_visitors bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url_filter TEXT;
  v_ref_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');

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
  yoy_data AS (
    SELECT 
      to_char(e.created_at + interval '1 year', 'YYYY-MM-DD') as day,
      COUNT(*) as pv,
      COUNT(DISTINCT e.visitor_id) as vis
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date - interval '1 year'
      AND e.created_at <= _end_date - interval '1 year'
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
      AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
    GROUP BY to_char(e.created_at + interval '1 year', 'YYYY-MM-DD')
  ),
  all_dates AS (
    SELECT day FROM current_data
    UNION
    SELECT day FROM yoy_data
  )
  SELECT 
    ad.day,
    COALESCE(c.pv, 0)::bigint,
    COALESCE(c.vis, 0)::bigint,
    COALESCE(y.pv, 0)::bigint,
    COALESCE(y.vis, 0)::bigint
  FROM all_dates ad
  LEFT JOIN current_data c ON c.day = ad.day
  LEFT JOIN yoy_data y ON y.day = ad.day
  ORDER BY ad.day;
END;
$$;
