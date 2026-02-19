-- ============================================
-- PHASE 4: Database Optimization
-- Add missing indexes for high-volume query paths
-- ============================================

-- 1. Events Table (Legacy & Partitioned)
-- Used for session-level aggregation and visitor history

-- Legacy events table
CREATE INDEX IF NOT EXISTS idx_events_session_id ON public.events(site_id, session_id);
CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON public.events(site_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_url ON public.events(site_id, url);

-- Partitioned events table
-- Note: Indexes on partitioned tables are automatically propagated to partitions
CREATE INDEX IF NOT EXISTS idx_events_part_session ON public.events_partitioned(site_id, session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_part_url ON public.events_partitioned(site_id, url, created_at DESC);

-- 2. Session Recordings
-- Used for "Recent Recordings" list (filtered by site, sorted by date) and visitor lookup
CREATE INDEX IF NOT EXISTS idx_session_recordings_site_started ON public.session_recordings(site_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_recordings_visitor ON public.session_recordings(site_id, visitor_id);

-- 3. Experiments
-- FK indexes for performance and locking
CREATE INDEX IF NOT EXISTS idx_experiments_site ON public.experiments(site_id);

-- 4. Tags
-- FK indexes
CREATE INDEX IF NOT EXISTS idx_tags_site ON public.tags(site_id);

-- 5. Log Imports
-- FK indexes and user lookup
CREATE INDEX IF NOT EXISTS idx_log_imports_site_user ON public.log_imports(site_id, user_id);

-- 6. Alerts
-- FK indexes
CREATE INDEX IF NOT EXISTS idx_alerts_site ON public.alerts(site_id);

-- 7. Analyze tables to update statistics
ANALYZE public.events;
ANALYZE public.events_partitioned;
ANALYZE public.session_recordings;
ANALYZE public.experiments;
ANALYZE public.tags;
