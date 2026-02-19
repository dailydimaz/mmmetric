-- Drop the explicit 5-parameter overload of get_timeseries_stats
-- This function is redundant because the 6-parameter version has a DEFAULT value for the 6th argument,
-- creating an ambiguity (Error 300) when called with 5 arguments.

DROP FUNCTION IF EXISTS public.get_timeseries_stats(
  uuid, 
  timestamp with time zone, 
  timestamp with time zone, 
  timestamp with time zone, 
  timestamp with time zone
);
