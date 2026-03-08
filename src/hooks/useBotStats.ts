import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDateRangeFilter, DateRange } from "./useAnalytics";

export interface BotStat {
  bot_name: string;
  hit_count: number;
  last_seen: string;
}

export function useBotStats(siteId: string, dateRange: DateRange) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["bot-stats", siteId, dateRange],
    queryFn: async (): Promise<BotStat[]> => {
      const { data, error } = await (supabase.rpc as any)("get_bot_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        bot_name: r.bot_name,
        hit_count: Number(r.hit_count) || 0,
        last_seen: r.last_seen,
      }));
    },
    enabled: !!siteId,
  });
}
