
-- Phase 1, Task 1: Migrate all RPCs from 'events' to 'events_partitioned'

-- 1. get_realtime_stats
CREATE OR REPLACE FUNCTION public.get_realtime_stats(_site_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  active_visitors INT;
  active_pages JSON;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(DISTINCT visitor_id)
  INTO active_visitors
  FROM public.events_partitioned
  WHERE site_id = _site_id
  AND created_at > (now() - interval '5 minutes');

  SELECT json_agg(t)
  INTO active_pages
  FROM (
    SELECT url, COUNT(*) as count
    FROM public.events_partitioned
    WHERE site_id = _site_id
    AND created_at > (now() - interval '5 minutes')
    GROUP BY url
    ORDER BY count DESC
    LIMIT 20
  ) t;

  RETURN json_build_object(
    'visitors', active_visitors,
    'pages', COALESCE(active_pages, '[]'::json)
  );
END;
$function$;

-- 2. get_retention_cohorts
CREATE OR REPLACE FUNCTION public.get_retention_cohorts(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  WITH visitor_first_seen AS (
    SELECT 
      visitor_id,
      DATE_TRUNC('day', MIN(created_at)) AS first_seen_date
    FROM events_partitioned
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND visitor_id IS NOT NULL
      AND created_at >= _start_date
      AND created_at <= _end_date
    GROUP BY visitor_id
  ),
  visitor_activity AS (
    SELECT DISTINCT
      visitor_id,
      DATE_TRUNC('day', created_at) AS activity_date
    FROM events_partitioned
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND visitor_id IS NOT NULL
  ),
  cohort_data AS (
    SELECT 
      vfs.first_seen_date AS cohort_date,
      COUNT(DISTINCT vfs.visitor_id) AS cohort_size,
      COUNT(DISTINCT CASE WHEN va.activity_date = vfs.first_seen_date + INTERVAL '1 day' THEN vfs.visitor_id END) AS day_1_retained,
      COUNT(DISTINCT CASE WHEN va.activity_date = vfs.first_seen_date + INTERVAL '3 days' THEN vfs.visitor_id END) AS day_3_retained,
      COUNT(DISTINCT CASE WHEN va.activity_date = vfs.first_seen_date + INTERVAL '7 days' THEN vfs.visitor_id END) AS day_7_retained,
      COUNT(DISTINCT CASE WHEN va.activity_date = vfs.first_seen_date + INTERVAL '14 days' THEN vfs.visitor_id END) AS day_14_retained,
      COUNT(DISTINCT CASE WHEN va.activity_date = vfs.first_seen_date + INTERVAL '30 days' THEN vfs.visitor_id END) AS day_30_retained
    FROM visitor_first_seen vfs
    LEFT JOIN visitor_activity va ON va.visitor_id = vfs.visitor_id
    GROUP BY vfs.first_seen_date
    ORDER BY vfs.first_seen_date DESC
  ),
  cohorts_json AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'cohort_date', cohort_date,
        'cohort_size', cohort_size,
        'retention', jsonb_build_array(
          jsonb_build_object('day', 1, 'retained', day_1_retained, 'rate', CASE WHEN cohort_size > 0 THEN ROUND((day_1_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END),
          jsonb_build_object('day', 3, 'retained', day_3_retained, 'rate', CASE WHEN cohort_size > 0 THEN ROUND((day_3_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END),
          jsonb_build_object('day', 7, 'retained', day_7_retained, 'rate', CASE WHEN cohort_size > 0 THEN ROUND((day_7_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END),
          jsonb_build_object('day', 14, 'retained', day_14_retained, 'rate', CASE WHEN cohort_size > 0 THEN ROUND((day_14_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END),
          jsonb_build_object('day', 30, 'retained', day_30_retained, 'rate', CASE WHEN cohort_size > 0 THEN ROUND((day_30_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END)
        )
      )
    ) AS cohorts
    FROM cohort_data
  ),
  summary_data AS (
    SELECT jsonb_build_array(
      jsonb_build_object('day', 1, 'average_rate', ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_1_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1)),
      jsonb_build_object('day', 3, 'average_rate', ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_3_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1)),
      jsonb_build_object('day', 7, 'average_rate', ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_7_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1)),
      jsonb_build_object('day', 14, 'average_rate', ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_14_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1)),
      jsonb_build_object('day', 30, 'average_rate', ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_30_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1))
    ) AS summary
    FROM cohort_data
  )
  SELECT jsonb_build_object(
    'cohorts', COALESCE(cj.cohorts, '[]'::jsonb),
    'summary', COALESCE(sd.summary, '[]'::jsonb)
  )
  INTO result
  FROM cohorts_json cj
  CROSS JOIN summary_data sd;

  RETURN COALESCE(result, jsonb_build_object('cohorts', '[]'::jsonb, 'summary', '[]'::jsonb));
END;
$function$;

-- 3. get_retention_trend
CREATE OR REPLACE FUNCTION public.get_retention_trend(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone)
 RETURNS TABLE(day integer, retained bigint, rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_visitors bigint;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(DISTINCT visitor_id) INTO total_visitors
  FROM events_partitioned
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND visitor_id IS NOT NULL
    AND created_at >= _start_date
    AND created_at <= _end_date;

  RETURN QUERY
  WITH visitor_first_seen AS (
    SELECT 
      visitor_id,
      DATE_TRUNC('day', MIN(created_at)) AS first_seen_date
    FROM events_partitioned
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND visitor_id IS NOT NULL
      AND created_at >= _start_date
      AND created_at <= _end_date
    GROUP BY visitor_id
  ),
  visitor_activity AS (
    SELECT DISTINCT
      visitor_id,
      DATE_TRUNC('day', created_at) AS activity_date
    FROM events_partitioned
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND visitor_id IS NOT NULL
  ),
  retention_by_day AS (
    SELECT 
      d.day_num AS day,
      COUNT(DISTINCT CASE 
        WHEN va.activity_date = vfs.first_seen_date + (d.day_num * INTERVAL '1 day')
        THEN vfs.visitor_id 
      END) AS retained
    FROM visitor_first_seen vfs
    CROSS JOIN generate_series(0, 30) AS d(day_num)
    LEFT JOIN visitor_activity va ON va.visitor_id = vfs.visitor_id
    GROUP BY d.day_num
  )
  SELECT 
    rbd.day,
    rbd.retained,
    CASE WHEN total_visitors > 0 
      THEN ROUND((rbd.retained::numeric / total_visitors::numeric) * 100, 1)
      ELSE 0
    END AS rate
  FROM retention_by_day rbd
  ORDER BY rbd.day;
END;
$function$;

-- 4. get_user_journeys
CREATE OR REPLACE FUNCTION public.get_user_journeys(_site_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone, _limit integer DEFAULT 20)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  WITH session_pages AS (
    SELECT 
      session_id,
      url,
      ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at) as step_num
    FROM events_partitioned
    WHERE site_id = _site_id
      AND created_at >= _start_date
      AND created_at < _end_date
      AND event_name = 'pageview'
      AND session_id IS NOT NULL
      AND url IS NOT NULL
  ),
  page_transitions AS (
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
    SELECT url as page, COUNT(*) as count
    FROM session_pages WHERE step_num = 1
    GROUP BY url ORDER BY count DESC LIMIT _limit
  ),
  exit_pages AS (
    SELECT sp.url as page, COUNT(*) as count
    FROM session_pages sp
    INNER JOIN (
      SELECT session_id, MAX(step_num) as max_step FROM session_pages GROUP BY session_id
    ) last_steps ON sp.session_id = last_steps.session_id AND sp.step_num = last_steps.max_step
    GROUP BY sp.url ORDER BY count DESC LIMIT _limit
  ),
  top_paths AS (
    SELECT sp1.url as page1, sp2.url as page2, sp3.url as page3, COUNT(*) as path_count
    FROM session_pages sp1
    JOIN session_pages sp2 ON sp1.session_id = sp2.session_id AND sp2.step_num = 2
    JOIN session_pages sp3 ON sp1.session_id = sp3.session_id AND sp3.step_num = 3
    WHERE sp1.step_num = 1
    GROUP BY sp1.url, sp2.url, sp3.url ORDER BY path_count DESC LIMIT _limit
  ),
  session_stats AS (
    SELECT COUNT(DISTINCT session_id) as total_sessions, ROUND(AVG(max_step), 2) as avg_pages_per_session
    FROM (SELECT session_id, MAX(step_num) as max_step FROM session_pages GROUP BY session_id) session_depths
  )
  SELECT json_build_object(
    'transitions', COALESCE((SELECT json_agg(json_build_object('from', from_page, 'to', to_page, 'count', transition_count) ORDER BY transition_count DESC) FROM (SELECT * FROM page_transitions ORDER BY transition_count DESC LIMIT 50) t), '[]'::json),
    'entryPages', COALESCE((SELECT json_agg(json_build_object('page', page, 'count', count)) FROM entry_pages), '[]'::json),
    'exitPages', COALESCE((SELECT json_agg(json_build_object('page', page, 'count', count)) FROM exit_pages), '[]'::json),
    'topPaths', COALESCE((SELECT json_agg(json_build_object('path', ARRAY[page1, page2, page3], 'count', path_count)) FROM top_paths), '[]'::json),
    'stats', (SELECT row_to_json(session_stats) FROM session_stats)
  ) INTO result;

  RETURN result;
END;
$function$;

-- 5. check_content_decay
CREATE OR REPLACE FUNCTION public.check_content_decay(p_site_id uuid)
 RETURNS TABLE(monitor_id uuid, url text, baseline_pageviews integer, current_pageviews bigint, decay_percent integer, threshold_percent integer, is_decaying boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH current_traffic AS (
        SELECT 
            e.url,
            COUNT(*) as pageviews
        FROM events_partitioned e
        WHERE e.site_id = p_site_id
          AND e.event_name = 'pageview'
          AND e.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY e.url
    )
    SELECT 
        m.id as monitor_id,
        m.url,
        m.baseline_pageviews,
        COALESCE(ct.pageviews, 0)::BIGINT as current_pageviews,
        CASE WHEN m.baseline_pageviews > 0 THEN GREATEST(0, 100 - (COALESCE(ct.pageviews, 0) * 100 / m.baseline_pageviews))::INTEGER ELSE 0 END as decay_percent,
        m.decay_threshold_percent as threshold_percent,
        CASE WHEN m.baseline_pageviews > 0 THEN (100 - (COALESCE(ct.pageviews, 0) * 100 / m.baseline_pageviews)) >= m.decay_threshold_percent ELSE false END as is_decaying
    FROM content_decay_monitors m
    LEFT JOIN current_traffic ct ON ct.url = m.url
    WHERE m.site_id = p_site_id
      AND m.is_enabled = true;
END;
$function$;

-- 6. setup_content_decay_monitors (also used events)
CREATE OR REPLACE FUNCTION public.setup_content_decay_monitors(p_site_id uuid, p_top_n integer DEFAULT 10, p_decay_threshold integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_count INTEGER := 0;
BEGIN
    IF NOT public.has_team_role(p_site_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    INSERT INTO content_decay_monitors (site_id, url, baseline_pageviews, baseline_visitors, baseline_period_start, baseline_period_end, decay_threshold_percent)
    SELECT 
        p_site_id,
        e.url,
        COUNT(*)::INTEGER as baseline_pageviews,
        COUNT(DISTINCT e.session_id)::INTEGER as baseline_visitors,
        NOW() - INTERVAL '30 days',
        NOW(),
        p_decay_threshold
    FROM events_partitioned e
    WHERE e.site_id = p_site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= NOW() - INTERVAL '30 days'
      AND e.url IS NOT NULL
      AND e.url != ''
    GROUP BY e.url
    ORDER BY COUNT(*) DESC
    LIMIT p_top_n
    ON CONFLICT (site_id, url) DO UPDATE SET
        baseline_pageviews = EXCLUDED.baseline_pageviews,
        baseline_visitors = EXCLUDED.baseline_visitors,
        baseline_period_start = EXCLUDED.baseline_period_start,
        baseline_period_end = EXCLUDED.baseline_period_end,
        updated_at = NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$function$;

-- 7. get_public_dashboard_stats — migrate to events_partitioned
CREATE OR REPLACE FUNCTION public.get_public_dashboard_stats(_share_token text, _start_date text, _end_date text, _password text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _config public_dashboards;
  _site sites;
  _result json;
BEGIN
  SELECT * INTO _config FROM public_dashboards WHERE share_token = _share_token AND is_enabled = true;
  IF _config IS NULL THEN RETURN NULL; END IF;

  IF _config.password_hash IS NOT NULL THEN
    IF _password IS NULL OR _config.password_hash != extensions.crypt(_password, _config.password_hash) THEN
      RETURN json_build_object('password_required', true);
    END IF;
  END IF;

  SELECT * INTO _site FROM sites WHERE id = _config.site_id;
  IF _site IS NULL THEN RETURN NULL; END IF;

  SELECT json_build_object(
    'site_name', _site.name,
    'title', COALESCE(_config.title, _site.name || ' Analytics'),
    'password_required', false,
    'visitors', CASE WHEN _config.show_visitors THEN (
      SELECT COUNT(DISTINCT visitor_id) FROM events_partitioned
      WHERE site_id = _site.id AND created_at >= _start_date::timestamp AND created_at < (_end_date::timestamp + interval '1 day')
    ) ELSE NULL END,
    'pageviews', CASE WHEN _config.show_pageviews THEN (
      SELECT COUNT(*) FROM events_partitioned
      WHERE site_id = _site.id AND event_name = 'pageview' AND created_at >= _start_date::timestamp AND created_at < (_end_date::timestamp + interval '1 day')
    ) ELSE NULL END,
    'timeseries', CASE WHEN _config.show_visitors OR _config.show_pageviews THEN (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT date_trunc('day', created_at)::date as date, COUNT(DISTINCT visitor_id) as visitors, COUNT(*) FILTER (WHERE event_name = 'pageview') as pageviews
        FROM events_partitioned WHERE site_id = _site.id AND created_at >= _start_date::timestamp AND created_at < (_end_date::timestamp + interval '1 day')
        GROUP BY date_trunc('day', created_at)::date ORDER BY date
      ) t
    ) ELSE NULL END,
    'top_pages', CASE WHEN _config.show_top_pages THEN (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT url, COUNT(*) as pageviews, COUNT(DISTINCT visitor_id) as unique_visitors
        FROM events_partitioned WHERE site_id = _site.id AND event_name = 'pageview' AND created_at >= _start_date::timestamp AND created_at < (_end_date::timestamp + interval '1 day')
        GROUP BY url ORDER BY pageviews DESC LIMIT 10
      ) t
    ) ELSE NULL END,
    'top_referrers', CASE WHEN _config.show_referrers THEN (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT COALESCE(NULLIF(referrer, ''), 'Direct') as referrer, COUNT(*) as visits, ROUND(COUNT(*)::numeric * 100 / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) as percentage
        FROM events_partitioned WHERE site_id = _site.id AND created_at >= _start_date::timestamp AND created_at < (_end_date::timestamp + interval '1 day')
        GROUP BY COALESCE(NULLIF(referrer, ''), 'Direct') ORDER BY visits DESC LIMIT 10
      ) t
    ) ELSE NULL END,
    'devices', CASE WHEN _config.show_devices THEN (
      SELECT json_build_object(
        'device_types', (SELECT json_agg(row_to_json(t)) FROM (
          SELECT device_type, COUNT(*) as count FROM events_partitioned WHERE site_id = _site.id AND created_at >= _start_date::timestamp AND created_at < (_end_date::timestamp + interval '1 day') GROUP BY device_type ORDER BY count DESC
        ) t),
        'browsers', (SELECT json_agg(row_to_json(t)) FROM (
          SELECT browser, COUNT(*) as count FROM events_partitioned WHERE site_id = _site.id AND created_at >= _start_date::timestamp AND created_at < (_end_date::timestamp + interval '1 day') GROUP BY browser ORDER BY count DESC LIMIT 5
        ) t)
      )
    ) ELSE NULL END,
    'countries', CASE WHEN _config.show_geo THEN (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT country, COUNT(*) as visits FROM events_partitioned WHERE site_id = _site.id AND created_at >= _start_date::timestamp AND created_at < (_end_date::timestamp + interval '1 day') AND country IS NOT NULL GROUP BY country ORDER BY visits DESC LIMIT 10
      ) t
    ) ELSE NULL END
  ) INTO _result;

  RETURN _result;
END;
$function$;

-- 8. refresh_usage_records (already uses events_partitioned, but let's ensure)
-- Already correct, no change needed.

-- 9. Dynamic funnel: rewrite get_funnel_stats with loop-based approach
CREATE OR REPLACE FUNCTION public.get_funnel_stats(_funnel_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone)
 RETURNS TABLE(step_index integer, step_name text, visitors bigint, conversion_rate numeric, drop_off_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_site_id uuid;
  v_steps jsonb;
  v_time_window_days integer;
  v_step_count integer;
  v_first_step_visitors bigint;
  v_prev_visitors bigint;
  v_current_visitors bigint;
  v_step record;
  v_step_idx integer;
BEGIN
  SELECT site_id, steps, COALESCE(time_window_days, 7)
  INTO v_site_id, v_steps, v_time_window_days
  FROM funnels WHERE id = _funnel_id;

  IF v_site_id IS NULL THEN
    RAISE EXCEPTION 'Funnel not found';
  END IF;

  IF NOT (is_site_owner(v_site_id) OR has_team_role(v_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_step_count := jsonb_array_length(v_steps);

  -- Create temp table for step visitors
  CREATE TEMP TABLE IF NOT EXISTS _funnel_visitors (
    step_order integer,
    visitor_id text,
    step_time timestamptz
  ) ON COMMIT DROP;
  TRUNCATE _funnel_visitors;

  -- Step 0: seed with first step
  SELECT v_steps->0 INTO v_step;
  INSERT INTO _funnel_visitors (step_order, visitor_id, step_time)
  SELECT 0, e.visitor_id, MIN(e.created_at)
  FROM events_partitioned e
  WHERE e.site_id = v_site_id
    AND e.event_name = (v_step->>'event_name')
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.visitor_id IS NOT NULL
    AND (
      (v_step->>'url_match') IS NULL OR (v_step->>'url_match') = ''
      OR (COALESCE(v_step->>'match_type', 'contains') = 'exact' AND e.url = (v_step->>'url_match'))
      OR (COALESCE(v_step->>'match_type', 'contains') = 'contains' AND e.url LIKE '%' || (v_step->>'url_match') || '%')
      OR (COALESCE(v_step->>'match_type', 'contains') = 'starts_with' AND e.url LIKE (v_step->>'url_match') || '%')
    )
  GROUP BY e.visitor_id;

  SELECT COUNT(*) INTO v_first_step_visitors FROM _funnel_visitors WHERE step_order = 0;
  
  step_index := 0;
  step_name := v_steps->0->>'name';
  visitors := v_first_step_visitors;
  conversion_rate := 100.0;
  drop_off_rate := 0.0;
  RETURN NEXT;

  v_prev_visitors := v_first_step_visitors;

  -- Loop through remaining steps
  FOR v_step_idx IN 1..(v_step_count - 1) LOOP
    SELECT v_steps->v_step_idx INTO v_step;
    
    INSERT INTO _funnel_visitors (step_order, visitor_id, step_time)
    SELECT v_step_idx, prev.visitor_id, MIN(e.created_at)
    FROM _funnel_visitors prev
    JOIN events_partitioned e ON e.visitor_id = prev.visitor_id
    WHERE prev.step_order = v_step_idx - 1
      AND e.site_id = v_site_id
      AND e.event_name = (v_step->>'event_name')
      AND e.created_at > prev.step_time
      AND e.created_at <= prev.step_time + (v_time_window_days * INTERVAL '1 day')
      AND (
        (v_step->>'url_match') IS NULL OR (v_step->>'url_match') = ''
        OR (COALESCE(v_step->>'match_type', 'contains') = 'exact' AND e.url = (v_step->>'url_match'))
        OR (COALESCE(v_step->>'match_type', 'contains') = 'contains' AND e.url LIKE '%' || (v_step->>'url_match') || '%')
        OR (COALESCE(v_step->>'match_type', 'contains') = 'starts_with' AND e.url LIKE (v_step->>'url_match') || '%')
      )
    GROUP BY prev.visitor_id;

    SELECT COUNT(*) INTO v_current_visitors FROM _funnel_visitors WHERE step_order = v_step_idx;

    step_index := v_step_idx;
    step_name := v_step->>'name';
    visitors := v_current_visitors;
    conversion_rate := CASE WHEN v_first_step_visitors > 0 THEN ROUND((v_current_visitors::numeric / v_first_step_visitors::numeric) * 100, 1) ELSE 0 END;
    drop_off_rate := CASE WHEN v_prev_visitors > 0 THEN ROUND(((v_prev_visitors - v_current_visitors)::numeric / v_prev_visitors::numeric) * 100, 1) ELSE 0 END;
    RETURN NEXT;

    v_prev_visitors := v_current_visitors;
  END LOOP;
END;
$function$;
