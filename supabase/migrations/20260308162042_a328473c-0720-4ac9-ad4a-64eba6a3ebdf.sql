
-- Add tag filter support to get_site_stats
-- We need to check existing function signature first - the tag filter needs to be added
-- to the WHERE clauses in functions that accept _filters JSONB

-- Update get_language_stats to support tag filter
CREATE OR REPLACE FUNCTION public.get_language_stats(
    _site_id UUID,
    _start_date TIMESTAMPTZ,
    _end_date TIMESTAMPTZ,
    _limit INTEGER DEFAULT 10,
    _filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(language TEXT, visits BIGINT, percentage NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_visits bigint;
  v_url_filter TEXT;
  v_ref_filter TEXT;
  v_tag_filter TEXT;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_url_filter := replace(replace(replace(_filters->>'url', '\', '\\'), '%', '\%'), '_', '\_');
  v_ref_filter := replace(replace(replace(_filters->>'referrerPattern', '\', '\\'), '%', '\%'), '_', '\_');
  v_tag_filter := _filters->>'tag';

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
    AND (v_tag_filter IS NULL OR e.tag = v_tag_filter);

  RETURN QUERY
  SELECT 
    COALESCE(e.language, 'Unknown')::text as language,
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
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (v_url_filter IS NULL OR e.url ILIKE '%' || v_url_filter || '%' ESCAPE '\')
    AND (v_ref_filter IS NULL OR e.referrer ILIKE '%' || v_ref_filter || '%' ESCAPE '\')
    AND (v_tag_filter IS NULL OR e.tag = v_tag_filter)
  GROUP BY e.language
  ORDER BY visits DESC
  LIMIT _limit;
END;
$$;

-- Add a helper RPC to get distinct tags for a site (for the filter dropdown)
CREATE OR REPLACE FUNCTION public.get_site_tags(
    _site_id UUID,
    _start_date TIMESTAMPTZ,
    _end_date TIMESTAMPTZ
)
RETURNS TABLE(tag TEXT, event_count BIGINT)
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
    e.tag,
    COUNT(*)::bigint as event_count
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.tag IS NOT NULL
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
  GROUP BY e.tag
  ORDER BY event_count DESC
  LIMIT 50;
END;
$$;
