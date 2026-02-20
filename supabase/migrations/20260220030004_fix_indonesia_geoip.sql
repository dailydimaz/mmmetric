-- supabase/migrations/20260220030004_fix_indonesia_geoip.sql
-- Fixes hardcoded IP block collisions and adds comprehensive Indonesia (Jakarta) mapping for testing

-- 1. Insert Jakarta into geoip_locations
INSERT INTO public.geoip_locations (geoname_id, country_code, country_name, city_name) 
VALUES (1642911, 'ID', 'Indonesia', 'Jakarta')
ON CONFLICT (geoname_id) DO UPDATE SET
  country_code = EXCLUDED.country_code,
  country_name = EXCLUDED.country_name,
  city_name = EXCLUDED.city_name;

-- 2. Insert Jakarta into city_coordinates to ensure Map Markers render
INSERT INTO public.city_coordinates (country_code, city_name, latitude, longitude)
VALUES ('ID', 'Jakarta', -6.2088, 106.8456)
ON CONFLICT (country_code, city_name) 
DO UPDATE SET 
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- 3. Reassign 49.0.0.0/8 (used heavily by Telkomsel/Indonesian ISPs) from Bangalore to Jakarta
INSERT INTO public.geoip_blocks (network, geoname_id) 
VALUES ('49.0.0.0/8', 1642911)
ON CONFLICT (network) DO UPDATE SET geoname_id = EXCLUDED.geoname_id;

-- 4. Add other common massive Indonesian ISP / APNIC blocks
INSERT INTO public.geoip_blocks (network, geoname_id) VALUES
  ('114.0.0.0/8', 1642911),
  ('125.0.0.0/8', 1642911),
  ('139.0.0.0/8', 1642911),
  ('180.0.0.0/8', 1642911),
  ('182.0.0.0/8', 1642911),
  ('36.0.0.0/8', 1642911),
  ('103.0.0.0/8', 1642911)
ON CONFLICT (network) DO UPDATE SET geoname_id = EXCLUDED.geoname_id;

-- 5. Ensure local testing via localhost resolves to Jakarta instead of Unknown
INSERT INTO public.geoip_blocks (network, geoname_id) VALUES
  ('127.0.0.0/8', 1642911)
ON CONFLICT (network) DO UPDATE SET geoname_id = EXCLUDED.geoname_id;
