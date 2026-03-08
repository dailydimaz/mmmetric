import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VisitorSession {
  session_id: string;
  started_at: string;
  ended_at: string;
  page_count: number;
  pages: string[];
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
}

export interface VisitorSummary {
  total_sessions: number;
  total_pageviews: number;
  unique_pages: number;
  first_seen: string;
  last_seen: string;
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
}

export interface VisitorEvent {
  event_name: string;
  url: string | null;
  created_at: string;
  properties: Record<string, unknown>;
}

export interface VisitorProfileData {
  summary: VisitorSummary;
  sessions: VisitorSession[];
  recent_events: VisitorEvent[];
}

export function useVisitorProfile(siteId: string, visitorId: string, enabled = false) {
  return useQuery({
    queryKey: ["visitor-profile", siteId, visitorId],
    queryFn: async (): Promise<VisitorProfileData> => {
      const { data, error } = await (supabase.rpc as any)("get_visitor_profile", {
        _site_id: siteId,
        _visitor_id: visitorId,
      });
      if (error) throw error;
      return data as VisitorProfileData;
    },
    enabled: !!siteId && !!visitorId && enabled,
  });
}
