import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "./useAnalytics";

export interface ErrorEvent {
  id: string;
  message: string;
  filename: string | null;
  lineno: number | null;
  colno: number | null;
  type: string;
  url: string;
  created_at: string;
  count: number;
}

export interface ErrorStats {
  total_errors: number;
  unique_errors: number;
  affected_pages: number;
  error_rate: number; // errors per 1000 pageviews
}

export interface ErrorGroup {
  message: string;
  filename: string | null;
  count: number;
  first_seen: string;
  last_seen: string;
  affected_urls: string[];
  type: string;
}

export function useErrorTracking(siteId: string, dateRange: DateRange) {
  const { start, end } = getDateRangeFilter(dateRange);
  const from = start.toISOString();
  const to = end.toISOString();

  const { data: errors, isLoading: errorsLoading } = useQuery({
    queryKey: ["error-tracking", siteId, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, properties, url, created_at")
        .eq("site_id", siteId)
        .eq("event_name", "js_error")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Group errors by message + filename
      const groups: Record<string, ErrorGroup> = {};
      
      data?.forEach((event) => {
        const props = event.properties as {
          message?: string;
          filename?: string;
          lineno?: number;
          colno?: number;
          type?: string;
          url?: string;
        } | null;
        
        if (!props?.message) return;
        
        const key = `${props.message}::${props.filename || 'unknown'}`;
        
        if (!groups[key]) {
          groups[key] = {
            message: props.message,
            filename: props.filename || null,
            count: 0,
            first_seen: event.created_at,
            last_seen: event.created_at,
            affected_urls: [],
            type: props.type || 'unknown',
          };
        }
        
        groups[key].count++;
        groups[key].last_seen = event.created_at;
        
        const pageUrl = props.url || event.url || '/';
        if (!groups[key].affected_urls.includes(pageUrl)) {
          groups[key].affected_urls.push(pageUrl);
        }
      });

      return Object.values(groups).sort((a, b) => b.count - a.count);
    },
    enabled: !!siteId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["error-stats", siteId, from, to],
    queryFn: async () => {
      // Get error count
      const { count: errorCount, error: errorError } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("event_name", "js_error")
        .gte("created_at", from)
        .lte("created_at", to);

      if (errorError) throw errorError;

      // Get pageview count for error rate calculation
      const { count: pageviewCount, error: pvError } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("event_name", "pageview")
        .gte("created_at", from)
        .lte("created_at", to);

      if (pvError) throw pvError;

      const totalErrors = errorCount || 0;
      const totalPageviews = pageviewCount || 1;
      const errorRate = (totalErrors / totalPageviews) * 1000;

      return {
        total_errors: totalErrors,
        unique_errors: errors?.length || 0,
        affected_pages: new Set(errors?.flatMap(e => e.affected_urls) || []).size,
        error_rate: Math.round(errorRate * 100) / 100,
      };
    },
    enabled: !!siteId && !!errors,
  });

  return {
    errors,
    stats,
    isLoading: errorsLoading || statsLoading,
  };
}
