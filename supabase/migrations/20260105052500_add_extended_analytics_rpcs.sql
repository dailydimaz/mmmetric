-- Extended Analytics RPCs
-- Additional functions for City, Language, and UTM stats

-- =====================================================
-- 7. GET_CITY_STATS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_city_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  city text,
  country text,
  visits bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_city bigint;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_city
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND city IS NOT NULL;

  RETURN QUERY
  SELECT
    e.city,
    e.country,
    COUNT(*) as val,
    CASE WHEN total_city > 0 
      THEN ROUND((COUNT(*)::numeric / total_city::numeric) * 100, 1)
      ELSE 0
    END
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.city IS NOT NULL
  GROUP BY e.city, e.country
  ORDER BY val DESC
  LIMIT 10;
END;
$$;

-- =====================================================
-- 8. GET_LANGUAGE_STATS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_language_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  language text,
  visits bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_lang bigint;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_lang
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND language IS NOT NULL;

  RETURN QUERY
  SELECT
    e.language,
    COUNT(*) as val,
    CASE WHEN total_lang > 0 
      THEN ROUND((COUNT(*)::numeric / total_lang::numeric) * 100, 1)
      ELSE 0
    END
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.language IS NOT NULL
  GROUP BY e.language
  ORDER BY val DESC
  LIMIT 10;
END;
$$;

-- =====================================================
-- 9. GET_UTM_STATS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_utm_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_utm bigint;
  sources jsonb;
  mediums jsonb;
  campaigns jsonb;
BEGIN
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Count total events that have ANY utm param
  SELECT COUNT(*) INTO total_utm
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND (
      properties->'utm'->>'utm_source' IS NOT NULL OR
      properties->'utm'->>'utm_medium' IS NOT NULL OR
      properties->'utm'->>'utm_campaign' IS NOT NULL
    );

  -- Sources
  SELECT jsonb_agg(jsonb_build_object('value', val_name, 'visits', val_count, 'percentage', 
    CASE WHEN total_utm > 0 THEN ROUND((val_count::numeric / total_utm::numeric) * 100, 1) ELSE 0 END))
  INTO sources
  FROM (
    SELECT properties->'utm'->>'utm_source' as val_name, COUNT(*) as val_count
    FROM events
    WHERE site_id = _site_id AND event_name = 'pageview' AND created_at >= _start_date AND created_at <= _end_date 
    AND properties->'utm'->>'utm_source' IS NOT NULL
    GROUP BY val_name ORDER BY val_count DESC LIMIT 10
  ) t;

  -- Mediums
  SELECT jsonb_agg(jsonb_build_object('value', val_name, 'visits', val_count, 'percentage', 
    CASE WHEN total_utm > 0 THEN ROUND((val_count::numeric / total_utm::numeric) * 100, 1) ELSE 0 END))
  INTO mediums
  FROM (
    SELECT properties->'utm'->>'utm_medium' as val_name, COUNT(*) as val_count
    FROM events
    WHERE site_id = _site_id AND event_name = 'pageview' AND created_at >= _start_date AND created_at <= _end_date 
    AND properties->'utm'->>'utm_medium' IS NOT NULL
    GROUP BY val_name ORDER BY val_count DESC LIMIT 10
  ) t;

  -- Campaigns
  SELECT jsonb_agg(jsonb_build_object('value', val_name, 'visits', val_count, 'percentage', 
    CASE WHEN total_utm > 0 THEN ROUND((val_count::numeric / total_utm::numeric) * 100, 1) ELSE 0 END))
  INTO campaigns
  FROM (
    SELECT properties->'utm'->>'utm_campaign' as val_name, COUNT(*) as val_count
    FROM events
    WHERE site_id = _site_id AND event_name = 'pageview' AND created_at >= _start_date AND created_at <= _end_date 
    AND properties->'utm'->>'utm_campaign' IS NOT NULL
    GROUP BY val_name ORDER BY val_count DESC LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'sources', COALESCE(sources, '[]'::jsonb),
    'mediums', COALESCE(mediums, '[]'::jsonb),
    'campaigns', COALESCE(campaigns, '[]'::jsonb)
  );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_city_stats(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_language_stats(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_utm_stats(uuid, timestamptz, timestamptz) TO authenticated;
