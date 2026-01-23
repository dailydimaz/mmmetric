
-- =====================================================
-- HIGH PERFORMANCE ANALYTICS OPTIMIZATION (Part 2)
-- Fixes for functions with matching return types
-- =====================================================

-- =====================================================
-- Update get_top_referrers to use HYBRID approach (preserving return type)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_top_referrers(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(referrer text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_has_filters BOOLEAN;
  v_total_visits BIGINT;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  v_has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;

  IF v_has_filters THEN
    -- Get total for percentage calculation
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
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%');

    RETURN QUERY
    SELECT 
      COALESCE(NULLIF(e.referrer, ''), 'Direct')::text,
      COUNT(*)::bigint,
      CASE WHEN v_total_visits > 0 THEN ROUND((COUNT(*)::numeric / v_total_visits::numeric) * 100, 1) ELSE 0 END
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    GROUP BY COALESCE(NULLIF(e.referrer, ''), 'Direct')
    ORDER BY COUNT(*) DESC
    LIMIT _limit;
  ELSE
    -- HYBRID: rollups + current hour
    RETURN QUERY
    WITH rollup_refs AS (
      SELECT 
        arh.referrer as ref,
        SUM(arh.visits)::bigint as v
      FROM analytics_referrers_hourly arh
      WHERE arh.site_id = _site_id
        AND arh.hour_timestamp >= date_trunc('hour', _start_date)
        AND arh.hour_timestamp < v_current_hour
        AND arh.hour_timestamp <= _end_date
      GROUP BY arh.referrer
    ),
    current_hour_refs AS (
      SELECT 
        COALESCE(NULLIF(e.referrer, ''), 'Direct') as ref,
        COUNT(*) as v
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.event_name = 'pageview'
        AND e.created_at >= v_current_hour
        AND e.created_at <= _end_date
      GROUP BY COALESCE(NULLIF(e.referrer, ''), 'Direct')
    ),
    merged AS (
      SELECT 
        COALESCE(r.ref, c.ref) as ref,
        COALESCE(r.v, 0) + COALESCE(c.v, 0) as v
      FROM rollup_refs r
      FULL OUTER JOIN current_hour_refs c ON r.ref = c.ref
    ),
    total AS (
      SELECT SUM(v) as total_v FROM merged
    )
    SELECT 
      m.ref::text, 
      m.v::bigint, 
      CASE WHEN t.total_v > 0 THEN ROUND((m.v::numeric / t.total_v::numeric) * 100, 1) ELSE 0 END
    FROM merged m, total t
    ORDER BY m.v DESC
    LIMIT _limit;
  END IF;
END;
$$;

-- Also update the version without filters
CREATE OR REPLACE FUNCTION public.get_top_referrers(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10
)
RETURNS TABLE(referrer text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_top_referrers(_site_id, _start_date, _end_date, _limit, '{}'::jsonb);
END;
$$;

-- =====================================================
-- Update get_device_stats to use HYBRID approach (returns jsonb)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_device_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_has_filters BOOLEAN;
  v_browsers jsonb;
  v_os jsonb;
  v_devices jsonb;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  v_has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;

  IF v_has_filters THEN
    -- Browsers
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_browsers
    FROM (
      SELECT e.browser as name, COUNT(*)::bigint as visits
      FROM events_partitioned e
      WHERE e.site_id = _site_id AND e.event_name = 'pageview'
        AND e.created_at >= _start_date AND e.created_at <= _end_date
        AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
        AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
      GROUP BY e.browser ORDER BY COUNT(*) DESC LIMIT 10
    ) t;

    -- OS
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_os
    FROM (
      SELECT e.os as name, COUNT(*)::bigint as visits
      FROM events_partitioned e
      WHERE e.site_id = _site_id AND e.event_name = 'pageview'
        AND e.created_at >= _start_date AND e.created_at <= _end_date
        AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
        AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
      GROUP BY e.os ORDER BY COUNT(*) DESC LIMIT 10
    ) t;

    -- Devices
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_devices
    FROM (
      SELECT e.device_type as name, COUNT(*)::bigint as visits
      FROM events_partitioned e
      WHERE e.site_id = _site_id AND e.event_name = 'pageview'
        AND e.created_at >= _start_date AND e.created_at <= _end_date
        AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
        AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
      GROUP BY e.device_type ORDER BY COUNT(*) DESC LIMIT 10
    ) t;
  ELSE
    -- HYBRID: rollups + current hour for Browsers
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_browsers
    FROM (
      WITH rollup_data AS (
        SELECT adh.browser as name, SUM(adh.visits)::bigint as v
        FROM analytics_devices_hourly adh
        WHERE adh.site_id = _site_id
          AND adh.hour_timestamp >= date_trunc('hour', _start_date)
          AND adh.hour_timestamp < v_current_hour
          AND adh.hour_timestamp <= _end_date
        GROUP BY adh.browser
      ),
      current_data AS (
        SELECT e.browser as name, COUNT(*)::bigint as v
        FROM events_partitioned e
        WHERE e.site_id = _site_id AND e.event_name = 'pageview'
          AND e.created_at >= v_current_hour AND e.created_at <= _end_date
        GROUP BY e.browser
      ),
      merged AS (
        SELECT COALESCE(r.name, c.name) as name, COALESCE(r.v, 0) + COALESCE(c.v, 0) as visits
        FROM rollup_data r FULL OUTER JOIN current_data c ON r.name = c.name
      )
      SELECT name, visits FROM merged ORDER BY visits DESC LIMIT 10
    ) t;

    -- HYBRID: rollups + current hour for OS
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_os
    FROM (
      WITH rollup_data AS (
        SELECT adh.os as name, SUM(adh.visits)::bigint as v
        FROM analytics_devices_hourly adh
        WHERE adh.site_id = _site_id
          AND adh.hour_timestamp >= date_trunc('hour', _start_date)
          AND adh.hour_timestamp < v_current_hour
          AND adh.hour_timestamp <= _end_date
        GROUP BY adh.os
      ),
      current_data AS (
        SELECT e.os as name, COUNT(*)::bigint as v
        FROM events_partitioned e
        WHERE e.site_id = _site_id AND e.event_name = 'pageview'
          AND e.created_at >= v_current_hour AND e.created_at <= _end_date
        GROUP BY e.os
      ),
      merged AS (
        SELECT COALESCE(r.name, c.name) as name, COALESCE(r.v, 0) + COALESCE(c.v, 0) as visits
        FROM rollup_data r FULL OUTER JOIN current_data c ON r.name = c.name
      )
      SELECT name, visits FROM merged ORDER BY visits DESC LIMIT 10
    ) t;

    -- HYBRID: rollups + current hour for Devices
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_devices
    FROM (
      WITH rollup_data AS (
        SELECT adh.device_type as name, SUM(adh.visits)::bigint as v
        FROM analytics_devices_hourly adh
        WHERE adh.site_id = _site_id
          AND adh.hour_timestamp >= date_trunc('hour', _start_date)
          AND adh.hour_timestamp < v_current_hour
          AND adh.hour_timestamp <= _end_date
        GROUP BY adh.device_type
      ),
      current_data AS (
        SELECT e.device_type as name, COUNT(*)::bigint as v
        FROM events_partitioned e
        WHERE e.site_id = _site_id AND e.event_name = 'pageview'
          AND e.created_at >= v_current_hour AND e.created_at <= _end_date
        GROUP BY e.device_type
      ),
      merged AS (
        SELECT COALESCE(r.name, c.name) as name, COALESCE(r.v, 0) + COALESCE(c.v, 0) as visits
        FROM rollup_data r FULL OUTER JOIN current_data c ON r.name = c.name
      )
      SELECT name, visits FROM merged ORDER BY visits DESC LIMIT 10
    ) t;
  END IF;

  RETURN jsonb_build_object('browsers', v_browsers, 'os', v_os, 'devices', v_devices);
END;
$$;

-- Also update the version without filters
CREATE OR REPLACE FUNCTION public.get_device_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN get_device_stats(_site_id, _start_date, _end_date, '{}'::jsonb);
END;
$$;

-- =====================================================
-- Update get_geo_stats to use HYBRID approach (preserving return type)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_geo_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone,
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(country text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_has_filters BOOLEAN;
  v_total_visits BIGINT;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  v_has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;

  IF v_has_filters THEN
    SELECT COUNT(*) INTO v_total_visits
    FROM events_partitioned e
    WHERE e.site_id = _site_id AND e.event_name = 'pageview'
      AND e.created_at >= _start_date AND e.created_at <= _end_date
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%');

    RETURN QUERY
    SELECT 
      COALESCE(e.country, 'Unknown')::text,
      COUNT(*)::bigint,
      CASE WHEN v_total_visits > 0 THEN ROUND((COUNT(*)::numeric / v_total_visits::numeric) * 100, 1) ELSE 0 END
    FROM events_partitioned e
    WHERE e.site_id = _site_id AND e.event_name = 'pageview'
      AND e.created_at >= _start_date AND e.created_at <= _end_date
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    GROUP BY COALESCE(e.country, 'Unknown')
    ORDER BY COUNT(*) DESC
    LIMIT _limit;
  ELSE
    -- HYBRID: rollups + current hour
    RETURN QUERY
    WITH rollup_geo AS (
      SELECT agh.country as c, SUM(agh.visits)::bigint as v
      FROM analytics_geo_hourly agh
      WHERE agh.site_id = _site_id
        AND agh.hour_timestamp >= date_trunc('hour', _start_date)
        AND agh.hour_timestamp < v_current_hour
        AND agh.hour_timestamp <= _end_date
      GROUP BY agh.country
    ),
    current_hour_geo AS (
      SELECT COALESCE(e.country, 'Unknown') as c, COUNT(*)::bigint as v
      FROM events_partitioned e
      WHERE e.site_id = _site_id AND e.event_name = 'pageview'
        AND e.created_at >= v_current_hour AND e.created_at <= _end_date
      GROUP BY COALESCE(e.country, 'Unknown')
    ),
    merged AS (
      SELECT COALESCE(r.c, c.c) as c, COALESCE(r.v, 0) + COALESCE(c.v, 0) as v
      FROM rollup_geo r FULL OUTER JOIN current_hour_geo c ON r.c = c.c
    ),
    total AS (SELECT SUM(v) as total_v FROM merged)
    SELECT m.c::text, m.v::bigint, 
      CASE WHEN t.total_v > 0 THEN ROUND((m.v::numeric / t.total_v::numeric) * 100, 1) ELSE 0 END
    FROM merged m, total t
    ORDER BY m.v DESC
    LIMIT _limit;
  END IF;
END;
$$;

-- Also update the version without filters
CREATE OR REPLACE FUNCTION public.get_geo_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone,
  _limit integer DEFAULT 10
)
RETURNS TABLE(country text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_geo_stats(_site_id, _start_date, _end_date, _limit, '{}'::jsonb);
END;
$$;

-- =====================================================
-- Update get_city_stats to use HYBRID approach (preserving return type)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_city_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone,
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(city text, country text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_has_filters BOOLEAN;
  v_total_visits BIGINT;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  v_has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;

  IF v_has_filters THEN
    SELECT COUNT(*) INTO v_total_visits
    FROM events_partitioned e
    WHERE e.site_id = _site_id AND e.event_name = 'pageview'
      AND e.created_at >= _start_date AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%');

    RETURN QUERY
    SELECT 
      COALESCE(e.city, 'Unknown')::text,
      COALESCE(e.country, 'Unknown')::text,
      COUNT(*)::bigint,
      CASE WHEN v_total_visits > 0 THEN ROUND((COUNT(*)::numeric / v_total_visits::numeric) * 100, 1) ELSE 0 END
    FROM events_partitioned e
    WHERE e.site_id = _site_id AND e.event_name = 'pageview'
      AND e.created_at >= _start_date AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    GROUP BY COALESCE(e.city, 'Unknown'), COALESCE(e.country, 'Unknown')
    ORDER BY COUNT(*) DESC
    LIMIT _limit;
  ELSE
    -- HYBRID: rollups + current hour
    RETURN QUERY
    WITH rollup_city AS (
      SELECT COALESCE(agh.city, 'Unknown') as ci, agh.country as co, SUM(agh.visits)::bigint as v
      FROM analytics_geo_hourly agh
      WHERE agh.site_id = _site_id
        AND agh.hour_timestamp >= date_trunc('hour', _start_date)
        AND agh.hour_timestamp < v_current_hour
        AND agh.hour_timestamp <= _end_date
      GROUP BY COALESCE(agh.city, 'Unknown'), agh.country
    ),
    current_hour_city AS (
      SELECT COALESCE(e.city, 'Unknown') as ci, COALESCE(e.country, 'Unknown') as co, COUNT(*)::bigint as v
      FROM events_partitioned e
      WHERE e.site_id = _site_id AND e.event_name = 'pageview'
        AND e.created_at >= v_current_hour AND e.created_at <= _end_date
      GROUP BY COALESCE(e.city, 'Unknown'), COALESCE(e.country, 'Unknown')
    ),
    merged AS (
      SELECT 
        COALESCE(r.ci, c.ci) as ci, 
        COALESCE(r.co, c.co) as co, 
        COALESCE(r.v, 0) + COALESCE(c.v, 0) as v
      FROM rollup_city r FULL OUTER JOIN current_hour_city c ON r.ci = c.ci AND r.co = c.co
    ),
    total AS (SELECT SUM(v) as total_v FROM merged)
    SELECT m.ci::text, m.co::text, m.v::bigint, 
      CASE WHEN t.total_v > 0 THEN ROUND((m.v::numeric / t.total_v::numeric) * 100, 1) ELSE 0 END
    FROM merged m, total t
    ORDER BY m.v DESC
    LIMIT _limit;
  END IF;
END;
$$;

-- Also update the version without filters
CREATE OR REPLACE FUNCTION public.get_city_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone,
  _limit integer DEFAULT 10
)
RETURNS TABLE(city text, country text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_city_stats(_site_id, _start_date, _end_date, _limit, '{}'::jsonb);
END;
$$;

-- =====================================================
-- Update get_language_stats to use HYBRID approach (preserving return type)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_language_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone,
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(language text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_has_filters BOOLEAN;
  v_total_visits BIGINT;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  v_has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;

  IF v_has_filters THEN
    SELECT COUNT(*) INTO v_total_visits
    FROM events_partitioned e
    WHERE e.site_id = _site_id AND e.event_name = 'pageview'
      AND e.created_at >= _start_date AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%');

    RETURN QUERY
    SELECT 
      COALESCE(e.language, 'Unknown')::text,
      COUNT(*)::bigint,
      CASE WHEN v_total_visits > 0 THEN ROUND((COUNT(*)::numeric / v_total_visits::numeric) * 100, 1) ELSE 0 END
    FROM events_partitioned e
    WHERE e.site_id = _site_id AND e.event_name = 'pageview'
      AND e.created_at >= _start_date AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    GROUP BY COALESCE(e.language, 'Unknown')
    ORDER BY COUNT(*) DESC
    LIMIT _limit;
  ELSE
    -- HYBRID: rollups + current hour
    RETURN QUERY
    WITH rollup_lang AS (
      SELECT alh.language as l, SUM(alh.visits)::bigint as v
      FROM analytics_languages_hourly alh
      WHERE alh.site_id = _site_id
        AND alh.hour_timestamp >= date_trunc('hour', _start_date)
        AND alh.hour_timestamp < v_current_hour
        AND alh.hour_timestamp <= _end_date
      GROUP BY alh.language
    ),
    current_hour_lang AS (
      SELECT COALESCE(e.language, 'Unknown') as l, COUNT(*)::bigint as v
      FROM events_partitioned e
      WHERE e.site_id = _site_id AND e.event_name = 'pageview'
        AND e.created_at >= v_current_hour AND e.created_at <= _end_date
      GROUP BY COALESCE(e.language, 'Unknown')
    ),
    merged AS (
      SELECT COALESCE(r.l, c.l) as l, COALESCE(r.v, 0) + COALESCE(c.v, 0) as v
      FROM rollup_lang r FULL OUTER JOIN current_hour_lang c ON r.l = c.l
    ),
    total AS (SELECT SUM(v) as total_v FROM merged)
    SELECT m.l::text, m.v::bigint, 
      CASE WHEN t.total_v > 0 THEN ROUND((m.v::numeric / t.total_v::numeric) * 100, 1) ELSE 0 END
    FROM merged m, total t
    ORDER BY m.v DESC
    LIMIT _limit;
  END IF;
END;
$$;

-- Also update the version without filters
CREATE OR REPLACE FUNCTION public.get_language_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone,
  _limit integer DEFAULT 10
)
RETURNS TABLE(language text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_language_stats(_site_id, _start_date, _end_date, _limit, '{}'::jsonb);
END;
$$;
