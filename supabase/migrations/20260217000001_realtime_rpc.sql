-- Create function to get realtime stats (active visitors and top pages)
CREATE OR REPLACE FUNCTION public.get_realtime_stats(_site_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_visitors INT;
  active_pages JSON;
BEGIN
  -- Count active visitors (distinct visitor_id in last 5 minutes)
  -- Using the index on (site_id, created_at)
  SELECT COUNT(DISTINCT visitor_id)
  INTO active_visitors
  FROM public.events
  WHERE site_id = _site_id
  AND created_at > (now() - interval '5 minutes');

  -- Get top active pages
  SELECT json_agg(t)
  INTO active_pages
  FROM (
    SELECT url, COUNT(*) as count
    FROM public.events
    WHERE site_id = _site_id
    AND created_at > (now() - interval '5 minutes')
    GROUP BY url
    ORDER BY count DESC
    LIMIT 20
  ) t;

  RETURN json_build_object(
    'visitors', active_visitors,
    'pages', COALESCE(active_pages, '[]'::json)
  );
END;
$$;

-- Grant access to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.get_realtime_stats(UUID) TO authenticated, service_role;
