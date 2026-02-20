-- supabase/migrations/20260220030003_seed_sample_city_coordinates.sql
-- Seeds the `city_coordinates` table with the exact sample data provided in docs/geoip-import.md 
-- so that historical queries using this sample data can resolve correctly on the Pigeon Maps UI.

INSERT INTO public.city_coordinates (country_code, city_name, latitude, longitude) VALUES
  ('US', 'New York', 40.7128, -74.0060),
  ('US', 'Los Angeles', 34.0522, -118.2437),
  ('GB', 'London', 51.5074, -0.1278),
  ('DE', 'Berlin', 52.5200, 13.4050),
  ('FR', 'Paris', 48.8566, 2.3522),
  ('JP', 'Tokyo', 35.6762, 139.6503),
  ('AU', 'Sydney', -33.8688, 151.2093),
  ('CA', 'Toronto', 43.6510, -79.3470),
  ('BR', 'São Paulo', -23.5505, -46.6333),
  ('IN', 'Bangalore', 12.9716, 77.5946)
ON CONFLICT (country_code, city_name) 
DO UPDATE SET 
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;
