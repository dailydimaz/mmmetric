-- Drop old function signature first
DROP FUNCTION IF EXISTS public.lookup_geoip(text);

-- Recreate with latitude/longitude support
CREATE OR REPLACE FUNCTION public.lookup_geoip(ip_address text)
 RETURNS TABLE(country text, city text, latitude numeric, longitude numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT 
    l.country_code AS country,
    l.city_name AS city,
    cc.latitude,
    cc.longitude
  FROM public.geoip_blocks b
  JOIN public.geoip_locations l ON l.geoname_id = b.geoname_id
  LEFT JOIN public.city_coordinates cc 
    ON cc.country_code = l.country_code AND cc.city_name = l.city_name
  WHERE ip_address::inet <<= b.network
  ORDER BY masklen(b.network) DESC
  LIMIT 1;
$$;