import { TimeSeriesData } from "@/hooks/useAnalytics";
import { ChartInterval } from "@/components/analytics/IntervalSelector";
import { format, parseISO, startOfWeek, startOfMonth } from "date-fns";

export function groupTimeSeriesByInterval(
  data: TimeSeriesData[],
  interval: ChartInterval
): TimeSeriesData[] {
  if (!data || data.length === 0) return [];

  // Day is the native granularity
  if (interval === "day" || interval === "hour") return data;

  const grouped = new Map<string, TimeSeriesData>();

  for (const point of data) {
    const date = parseISO(point.date);
    let key: string;

    if (interval === "week") {
      key = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    } else {
      // month
      key = format(startOfMonth(date), "yyyy-MM-dd");
    }

    const existing = grouped.get(key);
    if (existing) {
      existing.pageviews += point.pageviews;
      existing.visitors += point.visitors;
      existing.prevPageviews = (existing.prevPageviews || 0) + (point.prevPageviews || 0);
      existing.prevVisitors = (existing.prevVisitors || 0) + (point.prevVisitors || 0);
    } else {
      grouped.set(key, {
        date: key,
        pageviews: point.pageviews,
        visitors: point.visitors,
        prevPageviews: point.prevPageviews || 0,
        prevVisitors: point.prevVisitors || 0,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}
