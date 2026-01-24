
-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_goal_stats(uuid, timestamptz, timestamptz);

-- Recreate with new return type including revenue metrics
CREATE OR REPLACE FUNCTION public.get_goal_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  goal_id uuid,
  goal_name text,
  event_name text,
  url_match text,
  match_type text,
  conversions bigint,
  total_visitors bigint,
  conversion_rate numeric,
  revenue_property text,
  total_revenue numeric,
  average_order_value numeric,
  target_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: user must own the site or be a team member
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH total_visitors_cte AS (
    -- Count unique visitors who had pageviews in the date range (use partitioned table)
    SELECT COUNT(DISTINCT e.visitor_id) AS total
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
  ),
  goal_conversions AS (
    SELECT 
      g.id AS gid,
      g.name AS gname,
      g.event_name AS gevent,
      g.url_match AS gurl,
      g.match_type AS gmatch,
      g.revenue_property AS grev_prop,
      g.target_value AS gtarget,
      COUNT(DISTINCT e.visitor_id) AS conv,
      -- Sum revenue from the specified property
      CASE 
        WHEN g.revenue_property IS NOT NULL THEN
          COALESCE(SUM(
            CASE 
              WHEN e.properties->>g.revenue_property ~ '^[0-9]+\.?[0-9]*$' 
              THEN (e.properties->>g.revenue_property)::numeric 
              ELSE 0 
            END
          ), 0)
        ELSE 0
      END AS tot_rev,
      -- Count events for AOV calculation
      CASE 
        WHEN g.revenue_property IS NOT NULL THEN
          COUNT(*) FILTER (WHERE e.properties->>g.revenue_property ~ '^[0-9]+\.?[0-9]*$' AND (e.properties->>g.revenue_property)::numeric > 0)
        ELSE 0
      END AS rev_events
    FROM goals g
    LEFT JOIN events_partitioned e ON e.site_id = g.site_id
      AND e.event_name = g.event_name
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND (
        g.url_match IS NULL
        OR (g.match_type = 'exact' AND e.url = g.url_match)
        OR (g.match_type = 'contains' AND e.url LIKE '%' || g.url_match || '%')
        OR (g.match_type = 'starts_with' AND e.url LIKE g.url_match || '%')
        OR (g.match_type = 'regex' AND e.url ~ g.url_match)
      )
    WHERE g.site_id = _site_id
    GROUP BY g.id, g.name, g.event_name, g.url_match, g.match_type, g.revenue_property, g.target_value
  )
  SELECT 
    gc.gid,
    gc.gname,
    gc.gevent,
    gc.gurl,
    gc.gmatch,
    gc.conv,
    tv.total AS total_vis,
    CASE WHEN tv.total > 0 
      THEN ROUND((gc.conv::numeric / tv.total::numeric) * 100, 2)
      ELSE 0
    END AS conv_rate,
    gc.grev_prop,
    gc.tot_rev,
    CASE WHEN gc.rev_events > 0 
      THEN ROUND(gc.tot_rev / gc.rev_events::numeric, 2)
      ELSE 0
    END AS aov,
    gc.gtarget
  FROM goal_conversions gc
  CROSS JOIN total_visitors_cte tv;
END;
$$;
