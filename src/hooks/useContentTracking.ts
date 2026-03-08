import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDateRangeFilter, DateRange } from "./useAnalytics";

export interface ContentStat {
  content_name: string;
  content_piece: string | null;
  impressions: number;
  interactions: number;
  ctr: number;
}

export function useContentTracking(siteId: string, dateRange: DateRange) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["content-tracking", siteId, dateRange],
    queryFn: async (): Promise<ContentStat[]> => {
      const { data, error } = await (supabase.rpc as any)("get_content_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        content_name: r.content_name,
        content_piece: r.content_piece,
        impressions: Number(r.impressions) || 0,
        interactions: Number(r.interactions) || 0,
        ctr: Number(r.ctr) || 0,
      }));
    },
    enabled: !!siteId,
  });
}
