-- Create function to get user journey/path analysis
-- Shows how users navigate between pages with flow counts

CREATE OR REPLACE FUNCTION public.get_user_journeys(
  _site_id UUID,
  _start_date TIMESTAMPTZ,
  _end_date TIMESTAMPTZ,
  _limit INT DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user has access to this site
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  WITH session_pages AS (
    -- Get ordered pages per session
    SELECT 
      session_id,
      url,
      ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at) as step_num
    FROM events
    WHERE site_id = _site_id
      AND created_at >= _start_date
      AND created_at < _end_date
      AND event_name = 'pageview'
      AND session_id IS NOT NULL
      AND url IS NOT NULL
  ),
  page_transitions AS (
    -- Create from->to pairs
    SELECT 
      sp1.url as from_page,
      sp2.url as to_page,
      COUNT(*) as transition_count
    FROM session_pages sp1
    JOIN session_pages sp2 
      ON sp1.session_id = sp2.session_id 
      AND sp2.step_num = sp1.step_num + 1
    GROUP BY sp1.url, sp2.url
  ),
  entry_pages AS (
    -- Get entry pages (first page in session)
    SELECT 
      url as page,
      COUNT(*) as count
    FROM session_pages
    WHERE step_num = 1
    GROUP BY url
    ORDER BY count DESC
    LIMIT _limit
  ),
  exit_pages AS (
    -- Get exit pages (last page in session)
    SELECT 
      sp.url as page,
      COUNT(*) as count
    FROM session_pages sp
    INNER JOIN (
      SELECT session_id, MAX(step_num) as max_step
      FROM session_pages
      GROUP BY session_id
    ) last_steps ON sp.session_id = last_steps.session_id 
      AND sp.step_num = last_steps.max_step
    GROUP BY sp.url
    ORDER BY count DESC
    LIMIT _limit
  ),
  top_paths AS (
    -- Get most common 3-page paths
    SELECT 
      sp1.url as page1,
      sp2.url as page2,
      sp3.url as page3,
      COUNT(*) as path_count
    FROM session_pages sp1
    JOIN session_pages sp2 
      ON sp1.session_id = sp2.session_id AND sp2.step_num = 2
    JOIN session_pages sp3 
      ON sp1.session_id = sp3.session_id AND sp3.step_num = 3
    WHERE sp1.step_num = 1
    GROUP BY sp1.url, sp2.url, sp3.url
    ORDER BY path_count DESC
    LIMIT _limit
  ),
  session_stats AS (
    SELECT 
      COUNT(DISTINCT session_id) as total_sessions,
      ROUND(AVG(max_step), 2) as avg_pages_per_session
    FROM (
      SELECT session_id, MAX(step_num) as max_step
      FROM session_pages
      GROUP BY session_id
    ) session_depths
  )
  SELECT json_build_object(
    'transitions', COALESCE((
      SELECT json_agg(json_build_object(
        'from', from_page,
        'to', to_page,
        'count', transition_count
      ) ORDER BY transition_count DESC)
      FROM (SELECT * FROM page_transitions ORDER BY transition_count DESC LIMIT 50) t
    ), '[]'::json),
    'entryPages', COALESCE((
      SELECT json_agg(json_build_object('page', page, 'count', count))
      FROM entry_pages
    ), '[]'::json),
    'exitPages', COALESCE((
      SELECT json_agg(json_build_object('page', page, 'count', count))
      FROM exit_pages
    ), '[]'::json),
    'topPaths', COALESCE((
      SELECT json_agg(json_build_object(
        'path', ARRAY[page1, page2, page3],
        'count', path_count
      ))
      FROM top_paths
    ), '[]'::json),
    'stats', (SELECT row_to_json(session_stats) FROM session_stats)
  ) INTO result;

  RETURN result;
END;
$$;