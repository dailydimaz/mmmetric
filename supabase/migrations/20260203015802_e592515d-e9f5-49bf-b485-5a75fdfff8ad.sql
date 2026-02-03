-- Add content_decay to alert_type enum
ALTER TYPE public.alert_type ADD VALUE IF NOT EXISTS 'content_decay';

-- Create a dedicated table for content decay monitoring
-- This stores which pages to monitor and their baseline performance
CREATE TABLE IF NOT EXISTS public.content_decay_monitors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    baseline_pageviews INTEGER NOT NULL DEFAULT 0,
    baseline_visitors INTEGER NOT NULL DEFAULT 0,
    baseline_period_start TIMESTAMP WITH TIME ZONE,
    baseline_period_end TIMESTAMP WITH TIME ZONE,
    decay_threshold_percent INTEGER NOT NULL DEFAULT 30, -- Alert if traffic drops by this %
    comparison_period_days INTEGER NOT NULL DEFAULT 7, -- Compare last N days to baseline
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    last_checked_at TIMESTAMP WITH TIME ZONE,
    last_alert_at TIMESTAMP WITH TIME ZONE,
    current_decay_percent INTEGER, -- Stores current decay percentage for display
    status TEXT DEFAULT 'healthy', -- 'healthy', 'warning', 'declining'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(site_id, url)
);

-- Enable RLS
ALTER TABLE public.content_decay_monitors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view content decay monitors for sites they have access to"
ON public.content_decay_monitors
FOR SELECT
USING (public.has_team_role(site_id, 'viewer'));

CREATE POLICY "Users can manage content decay monitors for sites they own or admin"
ON public.content_decay_monitors
FOR ALL
USING (public.has_team_role(site_id, 'admin'));

-- Create index for efficient lookups
CREATE INDEX idx_content_decay_monitors_site_id ON public.content_decay_monitors(site_id);
CREATE INDEX idx_content_decay_monitors_enabled ON public.content_decay_monitors(is_enabled) WHERE is_enabled = true;

-- Create RPC to detect content decay for a site
CREATE OR REPLACE FUNCTION public.check_content_decay(p_site_id UUID)
RETURNS TABLE (
    monitor_id UUID,
    url TEXT,
    baseline_pageviews INTEGER,
    current_pageviews BIGINT,
    decay_percent INTEGER,
    threshold_percent INTEGER,
    is_decaying BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH current_traffic AS (
        SELECT 
            e.url,
            COUNT(*) as pageviews
        FROM events e
        WHERE e.site_id = p_site_id
          AND e.event_name = 'pageview'
          AND e.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY e.url
    )
    SELECT 
        m.id as monitor_id,
        m.url,
        m.baseline_pageviews,
        COALESCE(ct.pageviews, 0)::BIGINT as current_pageviews,
        CASE 
            WHEN m.baseline_pageviews > 0 THEN
                GREATEST(0, 100 - (COALESCE(ct.pageviews, 0) * 100 / m.baseline_pageviews))::INTEGER
            ELSE 0
        END as decay_percent,
        m.decay_threshold_percent as threshold_percent,
        CASE 
            WHEN m.baseline_pageviews > 0 THEN
                (100 - (COALESCE(ct.pageviews, 0) * 100 / m.baseline_pageviews)) >= m.decay_threshold_percent
            ELSE false
        END as is_decaying
    FROM content_decay_monitors m
    LEFT JOIN current_traffic ct ON ct.url = m.url
    WHERE m.site_id = p_site_id
      AND m.is_enabled = true;
END;
$$;

-- Create RPC to auto-detect top pages and set them up for monitoring
CREATE OR REPLACE FUNCTION public.setup_content_decay_monitors(
    p_site_id UUID,
    p_top_n INTEGER DEFAULT 10,
    p_decay_threshold INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Check access
    IF NOT public.has_team_role(p_site_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Insert top pages from last 30 days as monitors
    INSERT INTO content_decay_monitors (site_id, url, baseline_pageviews, baseline_visitors, baseline_period_start, baseline_period_end, decay_threshold_percent)
    SELECT 
        p_site_id,
        e.url,
        COUNT(*)::INTEGER as baseline_pageviews,
        COUNT(DISTINCT e.session_id)::INTEGER as baseline_visitors,
        NOW() - INTERVAL '30 days',
        NOW(),
        p_decay_threshold
    FROM events e
    WHERE e.site_id = p_site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= NOW() - INTERVAL '30 days'
      AND e.url IS NOT NULL
      AND e.url != ''
    GROUP BY e.url
    ORDER BY COUNT(*) DESC
    LIMIT p_top_n
    ON CONFLICT (site_id, url) DO UPDATE SET
        baseline_pageviews = EXCLUDED.baseline_pageviews,
        baseline_visitors = EXCLUDED.baseline_visitors,
        baseline_period_start = EXCLUDED.baseline_period_start,
        baseline_period_end = EXCLUDED.baseline_period_end,
        updated_at = NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_content_decay(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_content_decay_monitors(UUID, INTEGER, INTEGER) TO authenticated;