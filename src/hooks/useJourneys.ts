import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "./useAnalytics";

export interface JourneyTransition {
  from: string;
  to: string;
  count: number;
}

export interface PageCount {
  page: string;
  count: number;
}

export interface TopPath {
  path: string[];
  count: number;
}

export interface JourneyStats {
  total_sessions: number;
  avg_pages_per_session: number;
}

export interface JourneyData {
  transitions: JourneyTransition[];
  entryPages: PageCount[];
  exitPages: PageCount[];
  topPaths: TopPath[];
  stats: JourneyStats;
}

interface UseJourneysParams {
  siteId: string;
  dateRange: DateRange;
}

export function useJourneys({ siteId, dateRange }: UseJourneysParams) {
  return useQuery({
    queryKey: ["journeys", siteId, dateRange],
    queryFn: async () => {
      const { start, end } = getDateRangeFilter(dateRange);

      const { data, error } = await supabase.rpc("get_user_journeys", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 20,
      });

      if (error) throw error;
      return data as unknown as JourneyData;
    },
    enabled: !!siteId,
  });
}
