-- ============================================
-- PHASE 4: Maintenance Scripts
-- Data Retention Policy Enforcement
-- ============================================

-- Function to delete expired data for Free tier users (30 days retention)
CREATE OR REPLACE FUNCTION public.delete_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    free_site_ids UUID[];
BEGIN
    -- 1. Identify sites on Free tier (or no active paid subscription)
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

    -- 2. Delete expired events (Legacy)
    DELETE FROM public.events
    WHERE site_id = ANY(free_site_ids)
    AND created_at < (now() - INTERVAL '30 days');

    -- 3. Delete expired events (Partitioned)
    -- Note: Deleting from parent table cascades to partitions
    DELETE FROM public.events_partitioned
    WHERE site_id = ANY(free_site_ids)
    AND created_at < (now() - INTERVAL '30 days');

    -- 4. Delete expired heatmap data
    DELETE FROM public.heatmap_clicks
    WHERE site_id = ANY(free_site_ids)
    AND created_at < (now() - INTERVAL '30 days');

    DELETE FROM public.heatmap_scrolls
    WHERE site_id = ANY(free_site_ids)
    AND created_at < (now() - INTERVAL '30 days');

    -- 5. Delete expired session recordings
    -- Note: This deletes metadata. The actual R3 files need a separate cleanup cycle 
    -- or bucket lifecycle policy.
    DELETE FROM public.session_recordings
    WHERE site_id = ANY(free_site_ids)
    AND started_at < (now() - INTERVAL '30 days');

    -- Log the cleanup (optional, into a system log table if exists, or just RAISE NOTICE)
    RAISE NOTICE 'Deleted expired data for % free sites', array_length(free_site_ids, 1);
END;
$$;

-- Schedule the job via pg_cron (if available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule to run daily at 3 AM UTC
        PERFORM cron.schedule('delete-expired-data', '0 3 * * *', 'SELECT public.delete_expired_data()');
    END IF;
END
$$;
