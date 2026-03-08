
-- 1. Add IP exclusion and URL parameter exclusion columns to sites
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS excluded_ips text[] DEFAULT '{}';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS excluded_url_params text[] DEFAULT '{}';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS require_consent boolean DEFAULT false;

-- 2. Create content_impressions table for content tracking
CREATE TABLE IF NOT EXISTS public.content_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  visitor_id text,
  session_id text,
  content_name text NOT NULL,
  content_piece text,
  content_target text,
  interaction_type text NOT NULL DEFAULT 'impression',
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_impressions_site_created ON public.content_impressions(site_id, created_at);
CREATE INDEX IF NOT EXISTS idx_content_impressions_name ON public.content_impressions(site_id, content_name);

ALTER TABLE public.content_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can read content impressions"
  ON public.content_impressions FOR SELECT TO authenticated
  USING (public.is_site_owner(site_id) OR public.has_team_role(site_id, 'viewer'));

CREATE POLICY "Service role can insert content impressions"
  ON public.content_impressions FOR INSERT
  WITH CHECK (true);

-- 3. Create GDPR data subject requests table
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('access', 'deletion', 'export')),
  visitor_id_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage GDPR requests"
  ON public.gdpr_requests FOR ALL TO authenticated
  USING (public.is_site_owner(site_id) OR public.has_team_role(site_id, 'admin'));

-- 4. Create RPC for content tracking stats
CREATE OR REPLACE FUNCTION public.get_content_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 20
)
RETURNS TABLE(
  content_name text,
  content_piece text,
  impressions bigint,
  interactions bigint,
  ctr numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    ci.content_name,
    ci.content_piece,
    COUNT(*) FILTER (WHERE ci.interaction_type = 'impression') AS impressions,
    COUNT(*) FILTER (WHERE ci.interaction_type = 'click') AS interactions,
    CASE WHEN COUNT(*) FILTER (WHERE ci.interaction_type = 'impression') > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE ci.interaction_type = 'click')::numeric /
        COUNT(*) FILTER (WHERE ci.interaction_type = 'impression')::numeric * 100, 2
      )
      ELSE 0
    END AS ctr
  FROM content_impressions ci
  WHERE ci.site_id = _site_id
    AND ci.created_at >= _start_date
    AND ci.created_at <= _end_date
  GROUP BY ci.content_name, ci.content_piece
  ORDER BY impressions DESC
  LIMIT _limit;
END;
$$;

-- 5. Create RPC for row evolution (metric trend for any dimension value)
CREATE OR REPLACE FUNCTION public.get_row_evolution(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _dimension text,
  _value text,
  _metric text DEFAULT 'pageviews'
)
RETURNS TABLE(date text, metric_value bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    to_char(date_trunc('day', e.created_at), 'YYYY-MM-DD') AS date,
    CASE _metric
      WHEN 'pageviews' THEN COUNT(*)
      WHEN 'visitors' THEN COUNT(DISTINCT e.visitor_id)
      WHEN 'sessions' THEN COUNT(DISTINCT e.session_id)
      ELSE COUNT(*)
    END AS metric_value
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.event_name = 'pageview'
    AND CASE _dimension
      WHEN 'url' THEN e.url = _value
      WHEN 'country' THEN e.country = _value
      WHEN 'browser' THEN e.browser = _value
      WHEN 'os' THEN e.os = _value
      WHEN 'device' THEN e.device_type = _value
      WHEN 'referrer' THEN e.referrer = _value
      WHEN 'region' THEN e.region = _value
      WHEN 'city' THEN e.city = _value
      ELSE true
    END
  GROUP BY date_trunc('day', e.created_at)
  ORDER BY date_trunc('day', e.created_at);
END;
$$;

-- 6. Create RPC for visitor profile
CREATE OR REPLACE FUNCTION public.get_visitor_profile(
  _site_id uuid,
  _visitor_id text
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  WITH visitor_events AS (
    SELECT * FROM events_partitioned
    WHERE site_id = _site_id AND visitor_id = _visitor_id
    ORDER BY created_at DESC
    LIMIT 500
  ),
  sessions AS (
    SELECT
      session_id,
      MIN(created_at) as started_at,
      MAX(created_at) as ended_at,
      COUNT(*) FILTER (WHERE event_name = 'pageview') as page_count,
      array_agg(DISTINCT url) FILTER (WHERE url IS NOT NULL) as pages,
      MAX(country) as country,
      MAX(city) as city,
      MAX(browser) as browser,
      MAX(os) as os,
      MAX(device_type) as device_type
    FROM visitor_events
    WHERE session_id IS NOT NULL
    GROUP BY session_id
    ORDER BY MIN(created_at) DESC
  ),
  summary AS (
    SELECT
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(*) FILTER (WHERE event_name = 'pageview') as total_pageviews,
      COUNT(DISTINCT url) FILTER (WHERE url IS NOT NULL) as unique_pages,
      MIN(created_at) as first_seen,
      MAX(created_at) as last_seen,
      MAX(country) as country,
      MAX(city) as city,
      MAX(browser) as browser,
      MAX(os) as os,
      MAX(device_type) as device_type
    FROM visitor_events
  )
  SELECT json_build_object(
    'summary', (SELECT row_to_json(s) FROM summary s),
    'sessions', COALESCE((SELECT json_agg(row_to_json(sess)) FROM sessions sess), '[]'::json),
    'recent_events', COALESCE((
      SELECT json_agg(json_build_object(
        'event_name', event_name,
        'url', url,
        'created_at', created_at,
        'properties', properties
      ))
      FROM (SELECT * FROM visitor_events LIMIT 50) re
    ), '[]'::json)
  ) INTO result;

  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- 7. Create RPC for bot stats
CREATE OR REPLACE FUNCTION public.get_bot_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(bot_name text, hit_count bigint, last_seen timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(e.properties->>'bot_name', 'Unknown Bot') AS bot_name,
    COUNT(*)::bigint AS hit_count,
    MAX(e.created_at) AS last_seen
  FROM events_partitioned e
  WHERE e.site_id = _site_id
    AND e.event_name = 'bot_hit'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
  GROUP BY COALESCE(e.properties->>'bot_name', 'Unknown Bot')
  ORDER BY hit_count DESC;
END;
$$;

-- 8. Create RPC for GDPR visitor data lookup
CREATE OR REPLACE FUNCTION public.gdpr_lookup_visitor(
  _site_id uuid,
  _visitor_id text
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'admin')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'event_count', (SELECT COUNT(*) FROM events_partitioned WHERE site_id = _site_id AND visitor_id = _visitor_id),
    'first_seen', (SELECT MIN(created_at) FROM events_partitioned WHERE site_id = _site_id AND visitor_id = _visitor_id),
    'last_seen', (SELECT MAX(created_at) FROM events_partitioned WHERE site_id = _site_id AND visitor_id = _visitor_id),
    'sessions', (SELECT COUNT(DISTINCT session_id) FROM events_partitioned WHERE site_id = _site_id AND visitor_id = _visitor_id),
    'countries', (SELECT array_agg(DISTINCT country) FROM events_partitioned WHERE site_id = _site_id AND visitor_id = _visitor_id AND country IS NOT NULL),
    'pages_visited', (SELECT COUNT(DISTINCT url) FROM events_partitioned WHERE site_id = _site_id AND visitor_id = _visitor_id AND url IS NOT NULL)
  ) INTO result;

  RETURN result;
END;
$$;

-- 9. Create RPC for GDPR visitor data deletion
CREATE OR REPLACE FUNCTION public.gdpr_delete_visitor(
  _site_id uuid,
  _visitor_id text
)
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'admin')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  DELETE FROM events_partitioned WHERE site_id = _site_id AND visitor_id = _visitor_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM heatmap_clicks WHERE site_id = _site_id AND visitor_id = _visitor_id;
  DELETE FROM heatmap_scrolls WHERE site_id = _site_id AND visitor_id = _visitor_id;
  DELETE FROM content_impressions WHERE site_id = _site_id AND visitor_id = _visitor_id;
  DELETE FROM session_data WHERE site_id = _site_id AND visitor_id = _visitor_id;

  RETURN deleted_count;
END;
$$;
