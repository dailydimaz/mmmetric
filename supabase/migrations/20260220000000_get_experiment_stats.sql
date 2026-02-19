-- Create function to get experiment stats
CREATE OR REPLACE FUNCTION public.get_experiment_stats(
  _experiment_id uuid
)
RETURNS TABLE(
  variant_id uuid,
  variant_name text,
  is_control boolean,
  visitors bigint,
  conversions bigint,
  conversion_rate numeric,
  uplift numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_id uuid;
  v_start_date timestamptz;
  v_end_date timestamptz;
  v_status text;
  v_goal_event text;
  v_control_rate numeric;
BEGIN
  -- Get experiment details
  SELECT site_id, created_at, now(), status, goal_event
  INTO v_site_id, v_start_date, v_end_date, v_status, v_goal_event
  FROM experiments
  WHERE id = _experiment_id;

  IF v_site_id IS NULL THEN
    RAISE EXCEPTION 'Experiment not found';
  END IF;

  -- Security check
  IF NOT (is_site_owner(v_site_id) OR has_team_role(v_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Temporary table for variant stats
  CREATE TEMPORARY TABLE temp_variant_stats AS
  WITH exposures AS (
    SELECT 
      distinct on (visitor_id) visitor_id,
      (properties->>'variant_id')::uuid as variant_id,
      created_at as exposure_time
    FROM events_partitioned
    WHERE site_id = v_site_id
      AND event_name = 'experiment_exposure'
      AND (properties->>'experiment_id')::uuid = _experiment_id
      AND created_at >= v_start_date
    ORDER BY visitor_id, created_at ASC
  ),
  conversions AS (
    SELECT 
      e.visitor_id,
      min(e.created_at) as conversion_time
    FROM events_partitioned e
    JOIN exposures ex ON ex.visitor_id = e.visitor_id
    WHERE e.site_id = v_site_id
      AND e.event_name = v_goal_event
      AND e.created_at >= ex.exposure_time
    GROUP BY e.visitor_id
  ),
  stats AS (
    SELECT 
      v.id as variant_id,
      v.name as variant_name,
      v.is_control,
      count(distinct ex.visitor_id) as visitors,
      count(distinct c.visitor_id) as conversions
    FROM experiment_variants v
    LEFT JOIN exposures ex ON ex.variant_id = v.id
    LEFT JOIN conversions c ON c.visitor_id = ex.visitor_id
    WHERE v.experiment_id = _experiment_id
    GROUP BY v.id, v.name, v.is_control
  )
  SELECT 
    variant_id,
    variant_name,
    is_control,
    visitors,
    conversions,
    CASE WHEN visitors > 0 
      THEN (conversions::numeric / visitors::numeric) 
      ELSE 0 
    END as conversion_rate
  FROM stats;

  -- Get control rate for uplift calculation
  SELECT conversion_rate INTO v_control_rate
  FROM temp_variant_stats
  WHERE is_control = true
  LIMIT 1;

  RETURN QUERY
  SELECT 
    t.variant_id,
    t.variant_name,
    t.is_control,
    t.visitors,
    t.conversions,
    ROUND(t.conversion_rate * 100, 2) as conversion_rate,
    CASE 
      WHEN t.is_control THEN 0
      WHEN v_control_rate > 0 THEN ROUND(((t.conversion_rate - v_control_rate) / v_control_rate) * 100, 2)
      ELSE 0
    END as uplift
  FROM temp_variant_stats t
  ORDER BY t.is_control DESC, t.variant_name ASC;

  DROP TABLE temp_variant_stats;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_experiment_stats(uuid) TO authenticated;
