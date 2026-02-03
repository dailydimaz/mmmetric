import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "./useAnalytics";

interface ReadingDepthParams {
  siteId: string;
  dateRange: DateRange;
}

export interface ReadingDepthStats {
  totalReads: number;
  avgScore: number;
  readerPercent: number;
  skimmerPercent: number;
  bouncerPercent: number;
  avgTimeSeconds: number;
  zoneBreakdown: {
    zone: string;
    avgTime: number;
    label: string;
  }[];
  byPage: {
    url: string;
    count: number;
    avgScore: number;
    classification: string;
  }[];
}

function getDateRangeFilter(dateRange: DateRange): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  let start: Date;

  switch (dateRange) {
    case "today":
      start = startOfDay(new Date());
      break;
    case "7d":
      start = startOfDay(subDays(new Date(), 7));
      break;
    case "30d":
      start = startOfDay(subDays(new Date(), 30));
      break;
    case "90d":
      start = startOfDay(subDays(new Date(), 90));
      break;
    default:
      start = startOfDay(subDays(new Date(), 7));
  }

  return { start, end };
}

export function useReadingDepth({ siteId, dateRange }: ReadingDepthParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["reading-depth", siteId, dateRange],
    queryFn: async (): Promise<ReadingDepthStats> => {
      const { data, error } = await supabase
        .from("events")
        .select("properties, url, created_at")
        .eq("site_id", siteId)
        .eq("event_name", "reading_depth")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalReads: 0,
          avgScore: 0,
          readerPercent: 0,
          skimmerPercent: 0,
          bouncerPercent: 0,
          avgTimeSeconds: 0,
          zoneBreakdown: [],
          byPage: [],
        };
      }

      // Aggregate stats
      let totalScore = 0;
      let totalTime = 0;
      let readers = 0;
      let skimmers = 0;
      let bouncers = 0;
      const zoneTotals = { top: 0, quarter: 0, half: 0, three_quarter: 0, bottom: 0 };
      const zoneCount = { top: 0, quarter: 0, half: 0, three_quarter: 0, bottom: 0 };
      const pageStats = new Map<string, { count: number; totalScore: number; classifications: string[] }>();

      data.forEach((event) => {
        const props = event.properties as Record<string, unknown> | null;
        if (!props) return;

        const score = typeof props.score === "number" ? props.score : 0;
        const classification = String(props.classification || "bouncer");
        const totalTimeMs = typeof props.total_time_ms === "number" ? props.total_time_ms : 0;
        const zoneTimes = props.zone_times as Record<string, number> | undefined;

        totalScore += score;
        totalTime += totalTimeMs;

        if (classification === "reader") readers++;
        else if (classification === "skimmer") skimmers++;
        else bouncers++;

        // Zone times
        if (zoneTimes) {
          Object.entries(zoneTimes).forEach(([zone, time]) => {
            if (zone in zoneTotals) {
              zoneTotals[zone as keyof typeof zoneTotals] += time;
              zoneCount[zone as keyof typeof zoneCount]++;
            }
          });
        }

        // Per-page stats
        const url = event.url || "/";
        const existing = pageStats.get(url);
        if (existing) {
          existing.count++;
          existing.totalScore += score;
          existing.classifications.push(classification);
        } else {
          pageStats.set(url, { count: 1, totalScore: score, classifications: [classification] });
        }
      });

      const totalReads = data.length;

      // Zone breakdown
      const zoneBreakdown = [
        { zone: "top", avgTime: zoneCount.top ? Math.round(zoneTotals.top / zoneCount.top) : 0, label: "Top (0-25%)" },
        { zone: "quarter", avgTime: zoneCount.quarter ? Math.round(zoneTotals.quarter / zoneCount.quarter) : 0, label: "Upper (25-50%)" },
        { zone: "half", avgTime: zoneCount.half ? Math.round(zoneTotals.half / zoneCount.half) : 0, label: "Middle (50-75%)" },
        { zone: "three_quarter", avgTime: zoneCount.three_quarter ? Math.round(zoneTotals.three_quarter / zoneCount.three_quarter) : 0, label: "Lower (75-100%)" },
        { zone: "bottom", avgTime: zoneCount.bottom ? Math.round(zoneTotals.bottom / zoneCount.bottom) : 0, label: "Bottom" },
      ];

      // By page (top 10)
      const byPage = Array.from(pageStats.entries())
        .map(([url, stats]) => {
          const mostCommon = stats.classifications.reduce((acc, c) => {
            acc[c] = (acc[c] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const classification = Object.entries(mostCommon).sort((a, b) => b[1] - a[1])[0]?.[0] || "bouncer";

          return {
            url,
            count: stats.count,
            avgScore: Math.round(stats.totalScore / stats.count),
            classification,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalReads,
        avgScore: totalReads > 0 ? Math.round(totalScore / totalReads) : 0,
        readerPercent: totalReads > 0 ? Math.round((readers / totalReads) * 100) : 0,
        skimmerPercent: totalReads > 0 ? Math.round((skimmers / totalReads) * 100) : 0,
        bouncerPercent: totalReads > 0 ? Math.round((bouncers / totalReads) * 100) : 0,
        avgTimeSeconds: totalReads > 0 ? Math.round(totalTime / totalReads / 1000) : 0,
        zoneBreakdown,
        byPage,
      };
    },
    enabled: !!siteId,
  });
}
