import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDateRangeFilter, DateRange, AnalyticsFilter } from "./useAnalytics";

export interface YoyDataPoint {
  date: string;
  pageviews: number;
  visitors: number;
  yoyPageviews: number;
  yoyVisitors: number;
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

export function useYoyComparison({
  siteId,
  dateRange,
  filters,
  enabled = false,
}: {
  siteId: string;
  dateRange: DateRange;
  filters?: AnalyticsFilter;
  enabled?: boolean;
}) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["yoy-comparison", siteId, dateRange, filters],
    queryFn: async (): Promise<YoyDataPoint[]> => {
      const { data, error } = await (supabase.rpc as any)("get_yoy_comparison", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        date: row.date,
        pageviews: Number(row.pageviews) || 0,
        visitors: Number(row.visitors) || 0,
        yoyPageviews: Number(row.yoy_pageviews) || 0,
        yoyVisitors: Number(row.yoy_visitors) || 0,
      }));
    },
    enabled: !!siteId && enabled,
  });
}
