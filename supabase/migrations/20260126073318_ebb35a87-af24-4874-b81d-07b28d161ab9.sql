-- Create the get_entry_exit_pages RPC function for Entry/Exit Pages analytics
CREATE OR REPLACE FUNCTION public.get_entry_exit_pages(
    _site_id uuid,
    _start_date timestamptz,
    _end_date timestamptz,
    _limit integer DEFAULT 10
)
RETURNS TABLE (
    url text,
    entry_count bigint,
    exit_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH session_bounds AS (
        SELECT 
            session_id,
            MIN(created_at) as first_event_time,
            MAX(created_at) as last_event_time
        FROM events_partitioned
        WHERE site_id = _site_id
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND event_name = 'pageview'
          AND session_id IS NOT NULL
        GROUP BY session_id
    ),
    entry_pages AS (
        SELECT e.url, COUNT(DISTINCT e.session_id) as cnt
        FROM events_partitioned e
        JOIN session_bounds sb ON e.session_id = sb.session_id 
            AND e.created_at = sb.first_event_time
        WHERE e.site_id = _site_id
          AND e.event_name = 'pageview'
          AND e.url IS NOT NULL
        GROUP BY e.url
    ),
    exit_pages AS (
        SELECT e.url, COUNT(DISTINCT e.session_id) as cnt
        FROM events_partitioned e
        JOIN session_bounds sb ON e.session_id = sb.session_id 
            AND e.created_at = sb.last_event_time
        WHERE e.site_id = _site_id
          AND e.event_name = 'pageview'
          AND e.url IS NOT NULL
        GROUP BY e.url
    )
    SELECT 
        COALESCE(en.url, ex.url) as url,
        COALESCE(en.cnt, 0) as entry_count,
        COALESCE(ex.cnt, 0) as exit_count
    FROM entry_pages en
    FULL OUTER JOIN exit_pages ex ON en.url = ex.url
    ORDER BY COALESCE(en.cnt, 0) + COALESCE(ex.cnt, 0) DESC
    LIMIT _limit;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_entry_exit_pages TO authenticated;