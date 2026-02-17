import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeEvent {
  id: string;
  url: string | null;
  event_name: string;
  created_at: string;
  country: string | null;
  browser: string | null;
  device_type: string | null;
  referrer: string | null;
  visitor_id: string | null;
}

interface ActiveVisitor {
  visitor_id: string;
  lastSeen: Date;
  url: string | null;
  country: string | null;
}

export interface RealtimeStats {
  activeVisitors: number;
  activePages: { url: string; count: number }[];
  recentEvents: RealtimeEvent[];
}

const MAX_RECENT_EVENTS = 50;

export function useRealtimeAnalytics(siteId: string) {
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<number>(0);
  const [activePages, setActivePages] = useState<{ url: string; count: number }[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial stats via RPC and recent events via query
  useEffect(() => {
    if (!siteId) return;

    const fetchInitialData = async () => {
      // 1. Fetch simplified stats via RPC (accurate count & top pages)
      const { data: statsData } = await supabase.rpc('get_realtime_stats', {
        _site_id: siteId
      });

      if (statsData) {
        const stats = statsData as unknown as { visitors: number; pages: any[] };
        setActiveVisitors(stats.visitors || 0);
        setActivePages((stats.pages || []).map((p: any) => ({
          url: p.url,
          count: Number(p.count)
        })));
      }

      // 2. Fetch recent events for feed
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, url, event_name, created_at, country, browser, device_type, referrer, visitor_id")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(MAX_RECENT_EVENTS);

      if (eventsData) {
        setRecentEvents(eventsData);
      }
    };

    fetchInitialData();
  }, [siteId]);

  // Subscribe to realtime events
  useEffect(() => {
    if (!siteId) return;

    let channel: RealtimeChannel;

    const setupSubscription = () => {
      channel = supabase
        .channel(`events-${siteId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "events",
            filter: `site_id=eq.${siteId}`,
          },
          (payload) => {
            const newEvent = payload.new as RealtimeEvent;

            // Update recent events feed
            setRecentEvents(prev => [newEvent, ...prev].slice(0, MAX_RECENT_EVENTS));

            // Optimistically update counts (simple increment)
            // A periodic re-fetch is better for accuracy, but this gives immediate feedback
            setActiveVisitors(prev => {
              // We don't have the full set of unique visitors client-side anymore to dedup perfectly
              // So we'll just increment. The periodic RPC fetch will correct it.
              return prev + 1;
            });

            // Also update pages optimistically? 
            // It's tricky without full state. Let's rely on periodic RPC fetch for aggregate accuracy.
          }
        )
        .subscribe((status) => {
          setIsConnected(status === "SUBSCRIBED");
        });
    };

    setupSubscription();

    // Refresh stats every 15 seconds to keep counts accurate
    const refreshInterval = setInterval(async () => {
      const { data } = await supabase.rpc('get_realtime_stats', { _site_id: siteId });
      if (data) {
        const stats = data as unknown as { visitors: number; pages: any[] };
        setActiveVisitors(stats.visitors || 0);
        setActivePages((stats.pages || []).map((p: any) => ({
          url: p.url,
          count: Number(p.count)
        })));
      }
    }, 15000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [siteId]);

  return {
    activeVisitors,
    activePages,
    recentEvents,
    isConnected,
  };
}
