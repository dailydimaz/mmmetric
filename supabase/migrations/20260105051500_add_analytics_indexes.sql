-- Add optimized indexes for analytics queries
-- This composite index supports the common pattern of filtering by site + event type (almost always 'pageview') + date range
-- It includes visitor_id to allow Index Only Scans for the distinct counting operations used in all new RPCs

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_analytics_composite 
ON public.events (site_id, event_name, created_at DESC)
INCLUDE (visitor_id, url, session_id);

-- Notes:
-- 1. site_id: First because it's the primary filter (high cardinality but always used).
-- 2. event_name: Second because we almost always filter by 'pageview' or a specific custom event.
-- 3. created_at: Third for range queries.
-- 4. INCLUDE: visitor_id (for distinct counts), url (for goal matching), session_id (for session tracking)
--    Moving these to INCLUDE makes the index smaller than adding them to the key, while still allowing index-only scans.
