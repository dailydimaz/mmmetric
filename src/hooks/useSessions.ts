import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SessionSummary {
  session_id: string;
  visitor_id: string;
  first_activity: string;
  last_activity: string;
  pageviews: number;
  unique_pages: number;
  country: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  language: string | null;
  custom_id: string | null;
  session_properties: Record<string, unknown> | null;
  duration_seconds: number;
}

interface SessionsListResponse {
  total: number;
  page: number;
  per_page: number;
  sessions: SessionSummary[];
}

interface SessionEvent {
  id: string;
  event_name: string;
  url: string | null;
  title: string | null;
  referrer: string | null;
  created_at: string;
  properties: Record<string, unknown> | null;
  tag: string | null;
}

interface SessionDetail {
  session_id: string;
  identify: { custom_id: string | null; data: Record<string, unknown> | null } | null;
  events: SessionEvent[];
  metadata: {
    visitor_id: string;
    country: string | null;
    city: string | null;
    browser: string | null;
    os: string | null;
    device_type: string | null;
    language: string | null;
    first_seen: string;
    last_seen: string;
    total_events: number;
    pageviews: number;
    duration_seconds: number;
  };
}

export function useSessions(siteId: string | undefined, startDate: Date, endDate: Date) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const sessionsQuery = useQuery({
    queryKey: ["sessions-list", siteId, startDate.toISOString(), endDate.toISOString(), page, filters],
    queryFn: async () => {
      if (!siteId) return null;
      const { data, error } = await supabase.rpc("get_sessions_list" as any, {
        _site_id: siteId,
        _start_date: startDate.toISOString(),
        _end_date: endDate.toISOString(),
        _page: page,
        _per_page: 50,
        _filters: filters,
      });
      if (error) throw error;
      return data as unknown as SessionsListResponse;
    },
    enabled: !!siteId,
  });

  return {
    sessions: sessionsQuery.data?.sessions ?? [],
    total: sessionsQuery.data?.total ?? 0,
    page,
    setPage,
    filters,
    setFilters,
    isLoading: sessionsQuery.isLoading,
  };
}

export function useSessionDetail(siteId: string | undefined, sessionId: string | null) {
  return useQuery({
    queryKey: ["session-detail", siteId, sessionId],
    queryFn: async () => {
      if (!siteId || !sessionId) return null;
      const { data, error } = await supabase.rpc("get_session_detail" as any, {
        _site_id: siteId,
        _session_id: sessionId,
      });
      if (error) throw error;
      return data as unknown as SessionDetail;
    },
    enabled: !!siteId && !!sessionId,
  });
}

export type { SessionSummary, SessionsListResponse, SessionEvent, SessionDetail };
