-- Function to get stats for the page overlay
-- Secured by tracking_id (which is public in the script) and origin check (optional/implied by usage)
-- Returns visitors and pageviews for the current page

create or replace function get_overlay_stats(
  _tracking_id text,
  _url_path text,
  _period text default '7d' -- 'today', '7d', '30d'
)
returns table (
  visitors bigint,
  pageviews bigint,
  top_referrers jsonb
)
language plpgsql
security definer
as $$
declare
  v_site_id uuid;
  v_start_date timestamptz;
begin
  -- Get site_id from tracking_id
  select id into v_site_id from sites where tracking_id = _tracking_id;

  if v_site_id is null then
    return;
  end if;

  -- Determine start date
  if _period = 'today' then
    v_start_date := date_trunc('day', now());
  elsif _period = '30d' then
    v_start_date := now() - interval '30 days';
  else -- default 7d
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
$$;

-- Grant access to public (anon) and authenticated users
grant execute on function get_overlay_stats(text, text, text) to anon, authenticated, service_role;
