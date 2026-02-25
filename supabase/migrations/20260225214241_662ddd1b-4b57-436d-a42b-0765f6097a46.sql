-- Drop redundant get_site_stats overload (4-param version without prev dates)
-- The 6-param version is the canonical one used by the frontend
DROP FUNCTION IF EXISTS public.get_site_stats(uuid, timestamptz, timestamptz, jsonb);

-- Drop redundant get_site_group_stats overload (3-param version without prev dates)
-- The 5-param version is the canonical one
DROP FUNCTION IF EXISTS public.get_site_group_stats(uuid, date, date);