
-- Batch 2: Add title and hostname columns to events_partitioned
ALTER TABLE public.events_partitioned ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.events_partitioned ADD COLUMN IF NOT EXISTS hostname TEXT;

-- Batch 3: Add tag column for tag-based filtering
ALTER TABLE public.events_partitioned ADD COLUMN IF NOT EXISTS tag TEXT;

-- Batch 3: Create session_data table for identify() functionality
CREATE TABLE IF NOT EXISTS public.session_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
    session_id TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    custom_id TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS session_data_site_session_idx ON public.session_data(site_id, session_id);

-- Index for querying by custom_id
CREATE INDEX IF NOT EXISTS session_data_custom_id_idx ON public.session_data(site_id, custom_id) WHERE custom_id IS NOT NULL;

-- Index for querying by visitor_id
CREATE INDEX IF NOT EXISTS session_data_visitor_idx ON public.session_data(site_id, visitor_id);

-- Index for tag filtering on events
CREATE INDEX IF NOT EXISTS events_partitioned_tag_idx ON public.events_partitioned(site_id, tag) WHERE tag IS NOT NULL;

-- Enable RLS on session_data
ALTER TABLE public.session_data ENABLE ROW LEVEL SECURITY;

-- RLS: Allow public INSERT for telemetry ingestion (like events table)
CREATE POLICY "Allow public insert on session_data" ON public.session_data
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- RLS: Site owners and team members can read session data
CREATE POLICY "Site owners can view session_data" ON public.session_data
    FOR SELECT TO authenticated
    USING (
        public.is_site_owner(site_id) OR public.has_team_role(site_id, 'viewer')
    );

-- RPC: Get sessions list with pagination
CREATE OR REPLACE FUNCTION public.get_sessions_list(
    _site_id UUID,
    _start_date TIMESTAMPTZ,
    _end_date TIMESTAMPTZ,
    _page INTEGER DEFAULT 1,
    _per_page INTEGER DEFAULT 50,
    _filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    v_offset INTEGER;
    v_total BIGINT;
    v_country_filter TEXT;
    v_browser_filter TEXT;
    v_tag_filter TEXT;
BEGIN
    IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_offset := (_page - 1) * _per_page;
    v_country_filter := _filters->>'country';
    v_browser_filter := _filters->>'browser';
    v_tag_filter := _filters->>'tag';

    -- Count total sessions
    SELECT COUNT(DISTINCT session_id) INTO v_total
    FROM events_partitioned e
    WHERE e.site_id = _site_id
        AND e.created_at >= _start_date
        AND e.created_at <= _end_date
        AND e.event_name = 'pageview'
        AND e.session_id IS NOT NULL
        AND (v_country_filter IS NULL OR e.country = v_country_filter)
        AND (v_browser_filter IS NULL OR e.browser = v_browser_filter)
        AND (v_tag_filter IS NULL OR e.tag = v_tag_filter);

    -- Get paginated sessions with metadata
    SELECT json_build_object(
        'total', v_total,
        'page', _page,
        'per_page', _per_page,
        'sessions', COALESCE((
            SELECT json_agg(t ORDER BY t.last_activity DESC)
            FROM (
                SELECT
                    e.session_id,
                    e.visitor_id,
                    MIN(e.created_at) AS first_activity,
                    MAX(e.created_at) AS last_activity,
                    COUNT(*) FILTER (WHERE e.event_name = 'pageview') AS pageviews,
                    COUNT(DISTINCT e.url) AS unique_pages,
                    MAX(e.country) AS country,
                    MAX(e.browser) AS browser,
                    MAX(e.os) AS os,
                    MAX(e.device_type) AS device_type,
                    MAX(e.language) AS language,
                    (SELECT sd.custom_id FROM session_data sd WHERE sd.site_id = _site_id AND sd.session_id = e.session_id LIMIT 1) AS custom_id,
                    (SELECT sd.data FROM session_data sd WHERE sd.site_id = _site_id AND sd.session_id = e.session_id LIMIT 1) AS session_properties,
                    ROUND(EXTRACT(EPOCH FROM (MAX(e.created_at) - MIN(e.created_at)))) AS duration_seconds
                FROM events_partitioned e
                WHERE e.site_id = _site_id
                    AND e.created_at >= _start_date
                    AND e.created_at <= _end_date
                    AND e.session_id IS NOT NULL
                    AND (v_country_filter IS NULL OR e.country = v_country_filter)
                    AND (v_browser_filter IS NULL OR e.browser = v_browser_filter)
                    AND (v_tag_filter IS NULL OR e.tag = v_tag_filter)
                GROUP BY e.session_id, e.visitor_id
                ORDER BY MAX(e.created_at) DESC
                LIMIT _per_page
                OFFSET v_offset
            ) t
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- RPC: Get session detail (all events for a session)
CREATE OR REPLACE FUNCTION public.get_session_detail(
    _site_id UUID,
    _session_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT json_build_object(
        'session_id', _session_id,
        'identify', (
            SELECT json_build_object('custom_id', sd.custom_id, 'data', sd.data)
            FROM session_data sd
            WHERE sd.site_id = _site_id AND sd.session_id = _session_id
            LIMIT 1
        ),
        'events', COALESCE((
            SELECT json_agg(json_build_object(
                'id', e.id,
                'event_name', e.event_name,
                'url', e.url,
                'title', e.title,
                'referrer', e.referrer,
                'created_at', e.created_at,
                'properties', e.properties,
                'tag', e.tag
            ) ORDER BY e.created_at ASC)
            FROM events_partitioned e
            WHERE e.site_id = _site_id AND e.session_id = _session_id
        ), '[]'::json),
        'metadata', (
            SELECT json_build_object(
                'visitor_id', MAX(e.visitor_id),
                'country', MAX(e.country),
                'city', MAX(e.city),
                'browser', MAX(e.browser),
                'os', MAX(e.os),
                'device_type', MAX(e.device_type),
                'language', MAX(e.language),
                'first_seen', MIN(e.created_at),
                'last_seen', MAX(e.created_at),
                'total_events', COUNT(*),
                'pageviews', COUNT(*) FILTER (WHERE e.event_name = 'pageview'),
                'duration_seconds', ROUND(EXTRACT(EPOCH FROM (MAX(e.created_at) - MIN(e.created_at))))
            )
            FROM events_partitioned e
            WHERE e.site_id = _site_id AND e.session_id = _session_id
        )
    ) INTO result;

    RETURN result;
END;
$$;
