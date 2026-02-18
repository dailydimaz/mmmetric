
-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_records;
DROP POLICY IF EXISTS "Service role can manage usage" ON public.usage_records;

-- Recreate policies
CREATE POLICY "Users can view own usage" ON public.usage_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON public.usage_records
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Function to refresh usage records for all users (current month)
CREATE OR REPLACE FUNCTION public.refresh_usage_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month text := to_char(now(), 'YYYY-MM');
  month_start timestamptz := date_trunc('month', now());
BEGIN
  INSERT INTO usage_records (user_id, month, events_count, updated_at)
  SELECT
    s.user_id,
    current_month,
    COALESCE(SUM(e_count.cnt), 0),
    now()
  FROM sites s
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as cnt
    FROM events_partitioned ep
    WHERE ep.site_id = s.id
      AND ep.created_at >= month_start
  ) e_count ON true
  GROUP BY s.user_id
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    events_count = EXCLUDED.events_count,
    updated_at = now();
END;
$$;

-- 3. Function to check if a site's owner is over their event limit
CREATE OR REPLACE FUNCTION public.check_usage_limit(p_site_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_plan text;
  v_limit bigint;
  v_used bigint;
  current_month text := to_char(now(), 'YYYY-MM');
BEGIN
  SELECT user_id INTO v_user_id FROM sites WHERE id = p_site_id;
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT plan INTO v_plan FROM subscriptions WHERE user_id = v_user_id AND status = 'active' LIMIT 1;
  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  CASE v_plan
    WHEN 'free' THEN v_limit := 10000;
    WHEN 'pro' THEN v_limit := 100000;
    WHEN 'business' THEN v_limit := 1000000;
    WHEN 'selfhosted' THEN RETURN true;
    ELSE v_limit := 10000;
  END CASE;

  SELECT events_count INTO v_used
  FROM usage_records
  WHERE user_id = v_user_id AND month = current_month;

  IF v_used IS NULL THEN
    RETURN true;
  END IF;

  RETURN v_used < v_limit;
END;
$$;

-- 4. Function to delete expired events based on plan retention
CREATE OR REPLACE FUNCTION public.delete_expired_events()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted bigint := 0;
  v_batch bigint;
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      s.id as site_id,
      s.user_id,
      CASE COALESCE(sub.plan, 'free')
        WHEN 'free' THEN 30
        WHEN 'pro' THEN 365
        WHEN 'business' THEN 730
        WHEN 'selfhosted' THEN -1
        ELSE 30
      END as retention_days
    FROM sites s
    LEFT JOIN subscriptions sub ON sub.user_id = s.user_id AND sub.status = 'active'
  LOOP
    IF r.retention_days < 0 THEN
      CONTINUE;
    END IF;

    DELETE FROM events
    WHERE site_id = r.site_id
      AND created_at < now() - (r.retention_days || ' days')::interval;
    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_deleted := v_deleted + v_batch;

    DELETE FROM events_partitioned
    WHERE site_id = r.site_id
      AND created_at < now() - (r.retention_days || ' days')::interval;
    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_deleted := v_deleted + v_batch;

    DELETE FROM analytics_hourly
    WHERE site_id = r.site_id
      AND hour_timestamp < now() - (r.retention_days || ' days')::interval;

    DELETE FROM analytics_pages_hourly
    WHERE site_id = r.site_id
      AND hour_timestamp < now() - (r.retention_days || ' days')::interval;

    DELETE FROM analytics_referrers_hourly
    WHERE site_id = r.site_id
      AND hour_timestamp < now() - (r.retention_days || ' days')::interval;

    DELETE FROM analytics_devices_hourly
    WHERE site_id = r.site_id
      AND hour_timestamp < now() - (r.retention_days || ' days')::interval;

    DELETE FROM analytics_geo_hourly
    WHERE site_id = r.site_id
      AND hour_timestamp < now() - (r.retention_days || ' days')::interval;

    DELETE FROM analytics_languages_hourly
    WHERE site_id = r.site_id
      AND hour_timestamp < now() - (r.retention_days || ' days')::interval;
  END LOOP;

  RETURN v_deleted;
END;
$$;

-- 5. Schedule cron jobs
-- Unschedule existing if present to avoid duplicates
SELECT cron.unschedule('refresh-usage-records') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-usage-records');
SELECT cron.unschedule('delete-expired-events') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-events');

SELECT cron.schedule(
  'refresh-usage-records',
  '*/5 * * * *',
  $$SELECT public.refresh_usage_records();$$
);

SELECT cron.schedule(
  'delete-expired-events',
  '0 3 * * *',
  $$SELECT public.delete_expired_events();$$
);
