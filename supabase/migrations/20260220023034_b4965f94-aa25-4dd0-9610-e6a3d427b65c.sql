-- Fix get_overlay_stats: add SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.get_overlay_stats(_tracking_id text, _url_path text, _period text DEFAULT '7d'::text)
 RETURNS TABLE(visitors bigint, pageviews bigint, top_referrers jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
declare
  v_site_id uuid;
  v_start_date timestamptz;
begin
  select id into v_site_id from sites where tracking_id = _tracking_id;
  if v_site_id is null then
    return;
  end if;

  if _period = 'today' then
    v_start_date := date_trunc('day', now());
  elsif _period = '30d' then
    v_start_date := now() - interval '30 days';
  else
    v_start_date := now() - interval '7 days';
  end if;

  return query
  with period_events as (
    select
      session_id,
      referrer
    from events
    where site_id = v_site_id
      and url_path = _url_path
      and created_at >= v_start_date
      and event_name = 'pageview'
  ),
  counts as (
    select
      count(distinct session_id) as visitors,
      count(*) as pageviews
    from period_events
  ),
  referrers as (
    select
      referrer,
      count(*) as ref_count
    from period_events
    where referrer is not null
    group by referrer
    order by ref_count desc
    limit 5
  )
  select
    c.visitors,
    c.pageviews,
    coalesce(
      (select jsonb_agg(jsonb_build_object('referrer', r.referrer, 'count', r.ref_count)) from referrers r),
      '[]'::jsonb
    ) as top_referrers
  from counts c;
end;
$function$;

-- Fix delete_expired_data: add SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.delete_expired_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    free_site_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(id) INTO free_site_ids
    FROM public.sites
    WHERE user_id NOT IN (
        SELECT user_id 
        FROM public.subscriptions 
        WHERE status = 'active' AND plan != 'free'
    );

    IF free_site_ids IS NULL OR array_length(free_site_ids, 1) IS NULL THEN
        RETURN;
    END IF;

    DELETE FROM public.events
    WHERE site_id = ANY(free_site_ids)
    AND created_at < (now() - INTERVAL '30 days');

    DELETE FROM public.events_partitioned
    WHERE site_id = ANY(free_site_ids)
    AND created_at < (now() - INTERVAL '30 days');

    DELETE FROM public.heatmap_clicks
    WHERE site_id = ANY(free_site_ids)
    AND created_at < (now() - INTERVAL '30 days');

    DELETE FROM public.heatmap_scrolls
    WHERE site_id = ANY(free_site_ids)
    AND created_at < (now() - INTERVAL '30 days');

    DELETE FROM public.session_recordings
    WHERE site_id = ANY(free_site_ids)
    AND started_at < (now() - INTERVAL '30 days');

    RAISE NOTICE 'Deleted expired data for % free sites', array_length(free_site_ids, 1);
END;
$function$;