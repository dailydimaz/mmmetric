import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDateRangeFilter, DateRange } from "./useAnalytics";

export interface RowEvolutionPoint {
  date: string;
  metric_value: number;
}

export function useRowEvolution({
  siteId,
  dateRange,
  dimension,
  value,
  metric = "pageviews",
  enabled = false,
}: {
  siteId: string;
  dateRange: DateRange;
  dimension: string;
  value: string;
  metric?: string;
  enabled?: boolean;
}) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["row-evolution", siteId, dateRange, dimension, value, metric],
    queryFn: async (): Promise<RowEvolutionPoint[]> => {
      const { data, error } = await (supabase.rpc as any)("get_row_evolution", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _dimension: dimension,
        _value: value,
        _metric: metric,
      });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        date: r.date,
        metric_value: Number(r.metric_value) || 0,
      }));
    },
    enabled: !!siteId && !!value && enabled,
  });
}
