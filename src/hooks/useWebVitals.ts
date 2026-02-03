import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "./useAnalytics";

export interface WebVitalMetric {
  metric: string;
  avg_value: number;
  p75_value: number;
  good_count: number;
  poor_count: number;
  total_count: number;
}

export interface WebVitalsByPage {
  url: string;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  score: "good" | "needs-improvement" | "poor";
}

export function useWebVitals(siteId: string, dateRange: DateRange) {
  const { start, end } = getDateRangeFilter(dateRange);
  const from = start.toISOString();
  const to = end.toISOString();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["web-vitals", siteId, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("properties")
        .eq("site_id", siteId)
        .eq("event_name", "web_vitals")
        .gte("created_at", from)
        .lte("created_at", to);

      if (error) throw error;

      // Aggregate metrics
      const metricMap: Record<string, { values: number[]; ratings: string[] }> = {};
      
      data?.forEach((event) => {
        const props = event.properties as { metric?: string; value?: number; rating?: string } | null;
        if (!props?.metric || props.value === undefined) return;
        
        if (!metricMap[props.metric]) {
          metricMap[props.metric] = { values: [], ratings: [] };
        }
        metricMap[props.metric].values.push(props.value);
        if (props.rating) metricMap[props.metric].ratings.push(props.rating);
      });

      const results: WebVitalMetric[] = [];
      
      for (const [metric, data] of Object.entries(metricMap)) {
        const sorted = [...data.values].sort((a, b) => a - b);
        const p75Index = Math.floor(sorted.length * 0.75);
        
        results.push({
          metric,
          avg_value: sorted.reduce((a, b) => a + b, 0) / sorted.length,
          p75_value: sorted[p75Index] || 0,
          good_count: data.ratings.filter(r => r === "good").length,
          poor_count: data.ratings.filter(r => r === "poor").length,
          total_count: sorted.length,
        });
      }

      return results;
    },
    enabled: !!siteId,
  });

  const { data: byPage, isLoading: byPageLoading } = useQuery({
    queryKey: ["web-vitals-by-page", siteId, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("url, properties")
        .eq("site_id", siteId)
        .eq("event_name", "web_vitals")
        .gte("created_at", from)
        .lte("created_at", to);

      if (error) throw error;

      // Group by URL
      const pageMap: Record<string, Record<string, number[]>> = {};
      
      data?.forEach((event) => {
        const url = event.url || "/";
        const props = event.properties as { metric?: string; value?: number } | null;
        if (!props?.metric || props.value === undefined) return;
        
        if (!pageMap[url]) pageMap[url] = {};
        if (!pageMap[url][props.metric]) pageMap[url][props.metric] = [];
        pageMap[url][props.metric].push(props.value);
      });

      const results: WebVitalsByPage[] = [];
      
      for (const [url, metrics] of Object.entries(pageMap)) {
        const getP75 = (arr: number[] | undefined) => {
          if (!arr || arr.length === 0) return null;
          const sorted = [...arr].sort((a, b) => a - b);
          return sorted[Math.floor(sorted.length * 0.75)];
        };

        const lcp = getP75(metrics.LCP);
        const cls = getP75(metrics.CLS);
        const inp = getP75(metrics.INP);

        // Calculate overall score
        let score: "good" | "needs-improvement" | "poor" = "good";
        if (
          (lcp && lcp > 4000) ||
          (cls && cls > 0.25) ||
          (inp && inp > 500)
        ) {
          score = "poor";
        } else if (
          (lcp && lcp > 2500) ||
          (cls && cls > 0.1) ||
          (inp && inp > 200)
        ) {
          score = "needs-improvement";
        }

        results.push({ url, lcp, cls, inp, score });
      }

      return results.sort((a, b) => {
        const scoreOrder = { poor: 0, "needs-improvement": 1, good: 2 };
        return scoreOrder[a.score] - scoreOrder[b.score];
      }).slice(0, 20);
    },
    enabled: !!siteId,
  });

  return {
    metrics,
    byPage,
    isLoading: metricsLoading || byPageLoading,
  };
}
