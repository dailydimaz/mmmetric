import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDateRangeFilter, DateRange, AnalyticsFilter } from "./useAnalytics";

export interface RegionStat {
  region: string;
  country: string;
  visits: number;
  percentage: number;
}

function filtersToJsonb(filters?: AnalyticsFilter): Record<string, string> | null {
  if (!filters || Object.keys(filters).length === 0) return null;
  const result: Record<string, string> = {};
  if (filters.country) result.country = filters.country;
  if (filters.browser) result.browser = filters.browser;
  if (filters.os) result.os = filters.os;
  if (filters.device) result.device = filters.device;
  if (filters.url) result.url = filters.url;
  if (filters.referrerPattern) result.referrerPattern = filters.referrerPattern;
  return Object.keys(result).length > 0 ? result : null;
}

export function useRegionStats({
  siteId,
  dateRange,
  filters,
  country,
}: {
  siteId: string;
  dateRange: DateRange;
  filters?: AnalyticsFilter;
  country?: string;
}) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-regions", siteId, dateRange, filters, country],
    queryFn: async (): Promise<RegionStat[]> => {
      const params: any = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 20,
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
        ...(country ? { _country: country } : {}),
      };

      const { data, error } = await (supabase.rpc as any)("get_region_stats", params);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        region: row.region,
        country: row.country,
        visits: Number(row.visits) || 0,
        percentage: Number(row.percentage) || 0,
      }));
    },
    enabled: !!siteId,
  });
}
