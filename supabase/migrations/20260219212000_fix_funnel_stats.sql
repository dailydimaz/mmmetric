-- Fix get_funnel_stats: "column reference 'step_name' is ambiguous"
-- Root cause: RETURNS TABLE declares step_name as output param, which collides
-- with the step_name alias inside the funnel_steps CTE.
-- Fix: rename CTE column aliases to avoid collision with output params,
-- and switch from events to events_partitioned.

DROP FUNCTION IF EXISTS public.get_funnel_stats(uuid, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_funnel_stats(
  _funnel_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  step_index integer,
  step_name text,
  visitors bigint,
  conversion_rate numeric,
  drop_off_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_id uuid;
  v_steps jsonb;
  v_time_window_days integer;
BEGIN
  -- Get funnel details
  SELECT site_id, steps, COALESCE(time_window_days, 7)
  INTO v_site_id, v_steps, v_time_window_days
  FROM funnels
  WHERE id = _funnel_id;

  IF v_site_id IS NULL THEN
    RAISE EXCEPTION 'Funnel not found';
  END IF;

  -- Security check
  IF NOT (is_site_owner(v_site_id) OR has_team_role(v_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH funnel_steps AS (
    -- Parse funnel steps from JSONB
    -- Use fs_name to avoid collision with RETURNS TABLE step_name
    SELECT 
      (step_data->>'order')::integer AS fs_order,
      step_data->>'name' AS fs_name,
      step_data->>'event_name' AS fs_event_name,
      step_data->>'url_match' AS fs_url_match,
      step_data->>'match_type' AS fs_match_type
    FROM jsonb_array_elements(v_steps) AS step_data
    ORDER BY (step_data->>'order')::integer
  ),
  step_events AS (
    -- Get all matching events for each step
    SELECT 
      fs.fs_order,
      fs.fs_name,
      e.visitor_id,
      e.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY fs.fs_order, e.visitor_id 
        ORDER BY e.created_at
      ) AS event_rank
    FROM funnel_steps fs
    JOIN events_partitioned e ON e.site_id = v_site_id
      AND e.event_name = fs.fs_event_name
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND e.visitor_id IS NOT NULL
      AND (
        fs.fs_url_match IS NULL OR fs.fs_url_match = ''
        OR (fs.fs_match_type = 'exact' AND e.url = fs.fs_url_match)
        OR (fs.fs_match_type = 'contains' AND e.url LIKE '%' || fs.fs_url_match || '%')
        OR (fs.fs_match_type = 'starts_with' AND e.url LIKE fs.fs_url_match || '%')
        OR (fs.fs_match_type IS NULL AND e.url LIKE '%' || fs.fs_url_match || '%')
      )
  ),
  -- Find visitors who completed each step in sequence with time window
  step_1_visitors AS (
    SELECT visitor_id, MIN(created_at) AS step_time
    FROM step_events
    WHERE fs_order = 0 AND event_rank = 1
    GROUP BY visitor_id
  ),
  step_2_visitors AS (
    SELECT se.visitor_id, MIN(se.created_at) AS step_time
    FROM step_events se
    JOIN step_1_visitors s1 ON s1.visitor_id = se.visitor_id
    WHERE se.fs_order = 1
      AND se.created_at > s1.step_time
      AND se.created_at <= s1.step_time + (v_time_window_days * INTERVAL '1 day')
    GROUP BY se.visitor_id
  ),
  step_3_visitors AS (
    SELECT se.visitor_id, MIN(se.created_at) AS step_time
    FROM step_events se
    JOIN step_2_visitors s2 ON s2.visitor_id = se.visitor_id
    WHERE se.fs_order = 2
      AND se.created_at > s2.step_time
      AND se.created_at <= s2.step_time + (v_time_window_days * INTERVAL '1 day')
    GROUP BY se.visitor_id
  ),
  step_4_visitors AS (
    SELECT se.visitor_id, MIN(se.created_at) AS step_time
    FROM step_events se
    JOIN step_3_visitors s3 ON s3.visitor_id = se.visitor_id
    WHERE se.fs_order = 3
      AND se.created_at > s3.step_time
      AND se.created_at <= s3.step_time + (v_time_window_days * INTERVAL '1 day')
    GROUP BY se.visitor_id
  ),
  step_5_visitors AS (
    SELECT se.visitor_id, MIN(se.created_at) AS step_time
    FROM step_events se
    JOIN step_4_visitors s4 ON s4.visitor_id = se.visitor_id
    WHERE se.fs_order = 4
      AND se.created_at > s4.step_time
      AND se.created_at <= s4.step_time + (v_time_window_days * INTERVAL '1 day')
    GROUP BY se.visitor_id
  ),
  step_counts AS (
    SELECT 0 AS sc_order, (SELECT fs_name FROM funnel_steps WHERE fs_order = 0) AS sc_name, COUNT(*) AS sc_visitors FROM step_1_visitors
    UNION ALL
    SELECT 1, (SELECT fs_name FROM funnel_steps WHERE fs_order = 1), COUNT(*) FROM step_2_visitors WHERE EXISTS (SELECT 1 FROM funnel_steps WHERE fs_order = 1)
    UNION ALL
    SELECT 2, (SELECT fs_name FROM funnel_steps WHERE fs_order = 2), COUNT(*) FROM step_3_visitors WHERE EXISTS (SELECT 1 FROM funnel_steps WHERE fs_order = 2)
    UNION ALL
    SELECT 3, (SELECT fs_name FROM funnel_steps WHERE fs_order = 3), COUNT(*) FROM step_4_visitors WHERE EXISTS (SELECT 1 FROM funnel_steps WHERE fs_order = 3)
    UNION ALL
    SELECT 4, (SELECT fs_name FROM funnel_steps WHERE fs_order = 4), COUNT(*) FROM step_5_visitors WHERE EXISTS (SELECT 1 FROM funnel_steps WHERE fs_order = 4)
  ),
  step_with_prev AS (
    SELECT 
      sc.sc_order,
      sc.sc_name,
      sc.sc_visitors,
      LAG(sc.sc_visitors) OVER (ORDER BY sc.sc_order) AS prev_visitors,
      FIRST_VALUE(sc.sc_visitors) OVER (ORDER BY sc.sc_order) AS first_step_visitors
    FROM step_counts sc
    WHERE sc.sc_name IS NOT NULL
  )
  SELECT 
    swp.sc_order AS step_index,
    swp.sc_name AS step_name,
    swp.sc_visitors AS visitors,
    CASE WHEN swp.first_step_visitors > 0 
      THEN ROUND((swp.sc_visitors::numeric / swp.first_step_visitors::numeric) * 100, 1)
      ELSE 0
    END AS conversion_rate,
    CASE WHEN swp.prev_visitors IS NOT NULL AND swp.prev_visitors > 0
      THEN ROUND(((swp.prev_visitors - swp.sc_visitors)::numeric / swp.prev_visitors::numeric) * 100, 1)
      ELSE 0
    END AS drop_off_rate
  FROM step_with_prev swp
  ORDER BY swp.sc_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_funnel_stats(uuid, timestamptz, timestamptz) TO authenticated;
