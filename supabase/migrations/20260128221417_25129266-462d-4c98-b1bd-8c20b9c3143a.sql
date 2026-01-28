-- Drop existing function first to allow changing return type
DROP FUNCTION IF EXISTS public.get_city_stats(uuid, timestamp with time zone, timestamp with time zone, integer, jsonb);

-- Recreate get_city_stats RPC to return coordinates by joining with city_coordinates
CREATE OR REPLACE FUNCTION public.get_city_stats(
    _site_id UUID,
    _start_date TIMESTAMP WITH TIME ZONE,
    _end_date TIMESTAMP WITH TIME ZONE,
    _limit INTEGER DEFAULT 20,
    _filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    city TEXT,
    country TEXT,
    visits BIGINT,
    percentage NUMERIC,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_visits BIGINT;
    has_filters BOOLEAN;
BEGIN
    has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;
    
    -- Get total visits for percentage calculation
    IF has_filters THEN
        SELECT COUNT(*) INTO total_visits
        FROM events_partitioned e
        WHERE e.site_id = _site_id
          AND e.created_at BETWEEN _start_date AND _end_date
          AND e.event_name = 'pageview'
          AND e.city IS NOT NULL
          AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
          AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
          AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
          AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
          AND (_filters->>'url' IS NULL OR e.url LIKE '%' || (_filters->>'url') || '%');
    ELSE
        -- Use hourly aggregates when no filters
        SELECT COALESCE(SUM(ah.visits), 0) INTO total_visits
        FROM analytics_geo_hourly ah
        WHERE ah.site_id = _site_id
          AND ah.hour_timestamp BETWEEN _start_date AND _end_date
          AND ah.city IS NOT NULL;
    END IF;

    IF total_visits = 0 THEN
        total_visits := 1; -- Prevent division by zero
    END IF;

    IF has_filters THEN
        -- Query from partitioned table with filters, join with city_coordinates
        RETURN QUERY
        SELECT 
            e.city,
            e.country,
            COUNT(*)::BIGINT as visits,
            ROUND((COUNT(*)::NUMERIC / total_visits) * 100, 2) as percentage,
            cc.latitude,
            cc.longitude
        FROM events_partitioned e
        LEFT JOIN city_coordinates cc 
            ON cc.country_code = e.country 
            AND cc.city_name = e.city
        WHERE e.site_id = _site_id
          AND e.created_at BETWEEN _start_date AND _end_date
          AND e.event_name = 'pageview'
          AND e.city IS NOT NULL
          AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
          AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
          AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
          AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
          AND (_filters->>'url' IS NULL OR e.url LIKE '%' || (_filters->>'url') || '%')
        GROUP BY e.city, e.country, cc.latitude, cc.longitude
        ORDER BY visits DESC
        LIMIT _limit;
    ELSE
        -- Use hourly aggregates for performance, join with city_coordinates
        RETURN QUERY
        SELECT 
            ah.city,
            ah.country,
            SUM(ah.visits)::BIGINT as visits,
            ROUND((SUM(ah.visits)::NUMERIC / total_visits) * 100, 2) as percentage,
            cc.latitude,
            cc.longitude
        FROM analytics_geo_hourly ah
        LEFT JOIN city_coordinates cc 
            ON cc.country_code = ah.country 
            AND cc.city_name = ah.city
        WHERE ah.site_id = _site_id
          AND ah.hour_timestamp BETWEEN _start_date AND _end_date
          AND ah.city IS NOT NULL
        GROUP BY ah.city, ah.country, cc.latitude, cc.longitude
        ORDER BY visits DESC
        LIMIT _limit;
    END IF;
END;
$$;