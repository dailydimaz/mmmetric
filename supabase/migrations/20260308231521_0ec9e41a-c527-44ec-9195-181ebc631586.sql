
-- ==============================================
-- 1. Report Collections (folders for organizing)
-- ==============================================
CREATE TABLE public.report_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.report_collections(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collections" ON public.report_collections FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==============================================
-- 2. Saved Reports (queries/questions)
-- ==============================================
CREATE TABLE public.saved_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.report_collections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  query_config JSONB NOT NULL DEFAULT '{}',
  visualization_type TEXT NOT NULL DEFAULT 'line',
  visualization_config JSONB NOT NULL DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  last_run_at TIMESTAMPTZ,
  cached_result JSONB,
  cached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reports" ON public.saved_reports FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==============================================
-- 3. Report Subscriptions (scheduled delivery)
-- ==============================================
CREATE TYPE public.subscription_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TABLE public.report_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.saved_reports(id) ON DELETE CASCADE,
  dashboard_id UUID REFERENCES public.custom_dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency public.subscription_frequency NOT NULL DEFAULT 'weekly',
  day_of_week INT DEFAULT 1,
  day_of_month INT DEFAULT 1,
  hour_of_day INT DEFAULT 9,
  timezone TEXT DEFAULT 'UTC',
  channel TEXT NOT NULL DEFAULT 'email',
  channel_config JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.report_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==============================================
-- 4. Embedded Dashboard Tokens
-- ==============================================
CREATE TABLE public.embedded_dashboard_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  dashboard_id UUID REFERENCES public.custom_dashboards(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  allowed_domains TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.embedded_dashboard_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own embed tokens" ON public.embedded_dashboard_tokens FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==============================================
-- 5. Audit Log
-- ==============================================
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own audit log" ON public.audit_log FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_site ON public.audit_log(site_id, created_at DESC);

-- ==============================================
-- 6. RPC: Execute Analytics Query (Visual Query Builder)
-- ==============================================
CREATE OR REPLACE FUNCTION public.execute_analytics_query(
  p_site_id UUID,
  p_metrics TEXT[],
  p_dimensions TEXT[],
  p_start_date TEXT,
  p_end_date TEXT,
  p_filters JSONB DEFAULT '{}',
  p_order_by TEXT DEFAULT NULL,
  p_order_dir TEXT DEFAULT 'desc',
  p_limit INT DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
  v_select_parts TEXT[] := '{}';
  v_group_parts TEXT[] := '{}';
  v_query TEXT;
  v_dim TEXT;
  v_met TEXT;
  v_i INT := 1;
BEGIN
  -- Check ownership or team role
  IF NOT EXISTS (
    SELECT 1 FROM sites WHERE id = p_site_id AND user_id = v_user_id
    UNION ALL
    SELECT 1 FROM team_members WHERE site_id = p_site_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Build dimension columns
  FOREACH v_dim IN ARRAY p_dimensions LOOP
    CASE v_dim
      WHEN 'date' THEN
        v_select_parts := array_append(v_select_parts, 'date_trunc(''day'', e.created_at)::date::text AS date');
        v_group_parts := array_append(v_group_parts, 'date_trunc(''day'', e.created_at)::date');
      WHEN 'hour' THEN
        v_select_parts := array_append(v_select_parts, 'date_trunc(''hour'', e.created_at)::text AS hour');
        v_group_parts := array_append(v_group_parts, 'date_trunc(''hour'', e.created_at)');
      WHEN 'url' THEN
        v_select_parts := array_append(v_select_parts, 'e.url');
        v_group_parts := array_append(v_group_parts, 'e.url');
      WHEN 'referrer' THEN
        v_select_parts := array_append(v_select_parts, 'e.referrer');
        v_group_parts := array_append(v_group_parts, 'e.referrer');
      WHEN 'country' THEN
        v_select_parts := array_append(v_select_parts, 'e.country');
        v_group_parts := array_append(v_group_parts, 'e.country');
      WHEN 'city' THEN
        v_select_parts := array_append(v_select_parts, 'e.city');
        v_group_parts := array_append(v_group_parts, 'e.city');
      WHEN 'browser' THEN
        v_select_parts := array_append(v_select_parts, 'e.browser');
        v_group_parts := array_append(v_group_parts, 'e.browser');
      WHEN 'os' THEN
        v_select_parts := array_append(v_select_parts, 'e.os');
        v_group_parts := array_append(v_group_parts, 'e.os');
      WHEN 'device_type' THEN
        v_select_parts := array_append(v_select_parts, 'e.device_type');
        v_group_parts := array_append(v_group_parts, 'e.device_type');
      WHEN 'event_name' THEN
        v_select_parts := array_append(v_select_parts, 'e.event_name');
        v_group_parts := array_append(v_group_parts, 'e.event_name');
      WHEN 'language' THEN
        v_select_parts := array_append(v_select_parts, 'e.language');
        v_group_parts := array_append(v_group_parts, 'e.language');
      ELSE
        -- skip unknown dimensions
        NULL;
    END CASE;
  END LOOP;

  -- Build metric columns
  FOREACH v_met IN ARRAY p_metrics LOOP
    CASE v_met
      WHEN 'pageviews' THEN
        v_select_parts := array_append(v_select_parts, 'COUNT(*) FILTER (WHERE e.event_name = ''pageview'') AS pageviews');
      WHEN 'events' THEN
        v_select_parts := array_append(v_select_parts, 'COUNT(*) AS events');
      WHEN 'visitors' THEN
        v_select_parts := array_append(v_select_parts, 'COUNT(DISTINCT e.visitor_id) AS visitors');
      WHEN 'sessions' THEN
        v_select_parts := array_append(v_select_parts, 'COUNT(DISTINCT e.session_id) AS sessions');
      WHEN 'bounce_rate' THEN
        v_select_parts := array_append(v_select_parts, 
          'ROUND(COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_name = ''pageview'') * 100.0 / NULLIF(COUNT(DISTINCT e.session_id), 0), 2) AS bounce_rate');
      ELSE
        NULL;
    END CASE;
  END LOOP;

  IF array_length(v_select_parts, 1) IS NULL OR array_length(v_select_parts, 1) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  v_query := 'SELECT json_agg(row_data) FROM (SELECT ' || array_to_string(v_select_parts, ', ') ||
    ' FROM events_partitioned e WHERE e.site_id = $1 AND e.created_at >= $2::timestamptz AND e.created_at <= $3::timestamptz';

  -- Apply filters
  IF p_filters ? 'country' THEN
    v_query := v_query || ' AND e.country = ' || quote_literal(p_filters->>'country');
  END IF;
  IF p_filters ? 'browser' THEN
    v_query := v_query || ' AND e.browser = ' || quote_literal(p_filters->>'browser');
  END IF;
  IF p_filters ? 'os' THEN
    v_query := v_query || ' AND e.os = ' || quote_literal(p_filters->>'os');
  END IF;
  IF p_filters ? 'device_type' THEN
    v_query := v_query || ' AND e.device_type = ' || quote_literal(p_filters->>'device_type');
  END IF;
  IF p_filters ? 'url' THEN
    v_query := v_query || ' AND e.url = ' || quote_literal(p_filters->>'url');
  END IF;
  IF p_filters ? 'event_name' THEN
    v_query := v_query || ' AND e.event_name = ' || quote_literal(p_filters->>'event_name');
  END IF;

  IF array_length(v_group_parts, 1) > 0 THEN
    v_query := v_query || ' GROUP BY ' || array_to_string(v_group_parts, ', ');
  END IF;

  IF p_order_by IS NOT NULL AND p_order_by = ANY(p_metrics || p_dimensions) THEN
    v_query := v_query || ' ORDER BY ' || quote_ident(p_order_by) || ' ' || CASE WHEN p_order_dir = 'asc' THEN 'ASC' ELSE 'DESC' END;
  ELSIF array_length(v_group_parts, 1) > 0 THEN
    v_query := v_query || ' ORDER BY 1';
  END IF;

  v_query := v_query || ' LIMIT ' || p_limit || ') AS row_data';

  EXECUTE v_query INTO v_result USING p_site_id, p_start_date, p_end_date;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ==============================================
-- 7. RPC: Get Audit Log
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_audit_log(
  p_site_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF p_site_id IS NOT NULL THEN
    SELECT json_agg(row_data) INTO v_result FROM (
      SELECT id, action, entity_type, entity_id, details, ip_address, created_at
      FROM audit_log
      WHERE user_id = v_user_id AND site_id = p_site_id
      ORDER BY created_at DESC
      LIMIT p_limit OFFSET p_offset
    ) AS row_data;
  ELSE
    SELECT json_agg(row_data) INTO v_result FROM (
      SELECT id, action, entity_type, entity_id, details, ip_address, created_at
      FROM audit_log
      WHERE user_id = v_user_id
      ORDER BY created_at DESC
      LIMIT p_limit OFFSET p_offset
    ) AS row_data;
  END IF;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ==============================================
-- 8. Helper: Log audit action
-- ==============================================
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_site_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (user_id, site_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_site_id, p_action, p_entity_type, p_entity_id, p_details);
END;
$$;
