-- Drop old function overloads that lack _filters parameter
-- These cause PGRST203 "Could not choose the best candidate function" errors
-- because PostgREST sees both the old (no _filters) and new (with _filters DEFAULT) versions

-- get_top_pages: old has 4 params, new has 5 (with _filters)
DROP FUNCTION IF EXISTS public.get_top_pages(uuid, timestamp with time zone, timestamp with time zone, integer);

-- get_top_referrers: old has 4 params, new has 5
DROP FUNCTION IF EXISTS public.get_top_referrers(uuid, timestamp with time zone, timestamp with time zone, integer);

-- get_geo_stats: old has 4 params, new has 5
DROP FUNCTION IF EXISTS public.get_geo_stats(uuid, timestamp with time zone, timestamp with time zone, integer);

-- get_device_stats: old has 3 params, new has 4 (with _filters)
DROP FUNCTION IF EXISTS public.get_device_stats(uuid, timestamp with time zone, timestamp with time zone);

-- get_language_stats: old has 4 params, new has 5
DROP FUNCTION IF EXISTS public.get_language_stats(uuid, timestamp with time zone, timestamp with time zone, integer);

-- get_utm_stats: old has 4 params, new has 5
DROP FUNCTION IF EXISTS public.get_utm_stats(uuid, timestamp with time zone, timestamp with time zone, integer);

-- get_goal_stats: old has 3 params, new has 4
DROP FUNCTION IF EXISTS public.get_goal_stats(uuid, timestamp with time zone, timestamp with time zone);
