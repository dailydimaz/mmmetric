import { useMemo } from "react";
import { TimeSeriesData, DateRange } from "./useAnalytics";
import { detectAnomalies, AnomalyDetectionResult } from "@/lib/anomalyDetection";

interface UseAnomalyDetectionParams {
  timeSeries: TimeSeriesData[] | undefined;
  dateRange: DateRange;
  metric?: "pageviews" | "visitors";
}

export function useAnomalyDetection({
  timeSeries,
  dateRange,
  metric = "pageviews",
}: UseAnomalyDetectionParams): AnomalyDetectionResult | null {
  return useMemo(() => {
    if (!timeSeries || timeSeries.length < 7) return null;

    const values = timeSeries.map((d) => d[metric]);
    const dates = timeSeries.map((d) => d.date);

    // Adjust sensitivity based on date range
    const zScoreThreshold = dateRange === "today" ? 2.5 : dateRange === "7d" ? 2.0 : 1.8;

    return detectAnomalies({
      values,
      dates,
      metric,
      zScoreThreshold,
    });
  }, [timeSeries, dateRange, metric]);
}
