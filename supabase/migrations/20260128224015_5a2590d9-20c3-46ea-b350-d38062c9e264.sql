-- Drop all get_city_stats function overloads
DROP FUNCTION IF EXISTS public.get_city_stats(uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.get_city_stats(uuid, timestamptz, timestamptz, integer);
DROP FUNCTION IF EXISTS public.get_city_stats(uuid, timestamptz, timestamptz, integer, jsonb);

-- Create single clean version with optional parameters
CREATE OR REPLACE FUNCTION public.get_city_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 20,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  city text,
  country text,
  visits bigint,
  unique_visitors bigint,
  latitude double precision,
  longitude double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.city,
    e.country,
    COUNT(*)::bigint AS visits,
    COUNT(DISTINCT e.visitor_id)::bigint AS unique_visitors,
    cc.latitude,
    cc.longitude
  FROM events_partitioned e
  LEFT JOIN city_coordinates cc 
    ON cc.country_code = e.country 
    AND cc.city_name = e.city
  WHERE e.site_id = _site_id
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.city IS NOT NULL
  GROUP BY e.city, e.country, cc.latitude, cc.longitude
  ORDER BY visits DESC
  LIMIT _limit;
END;
$$;