CREATE OR REPLACE FUNCTION public.check_usage_limit(p_site_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_plan text;
  v_limit bigint;
  v_used bigint;
  current_month date := date_trunc('month', now())::date;
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
$function$;