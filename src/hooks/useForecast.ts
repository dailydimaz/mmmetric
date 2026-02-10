import { useMemo } from "react";
import { TimeSeriesData, DateRange } from "./useAnalytics";
import { generateForecast, ForecastResult } from "@/lib/forecasting";

interface UseForecastParams {
  timeSeries: TimeSeriesData[] | undefined;
  dateRange: DateRange;
  metric?: "pageviews" | "visitors";
  horizon?: number;
}

export function useForecast({
  timeSeries,
  dateRange,
  metric = "pageviews",
  horizon,
}: UseForecastParams): ForecastResult | null {
  return useMemo(() => {
    if (!timeSeries || timeSeries.length < 3) return null;

    const values = timeSeries.map((d) => d[metric]);
    const startDate = timeSeries[0].date;

    // Default horizon based on date range
    const defaultHorizon =
      dateRange === "today" ? 1
      : dateRange === "7d" ? 7
      : dateRange === "30d" ? 14
      : 30;

    return generateForecast({
      values,
      startDate,
      horizon: horizon ?? defaultHorizon,
    });
  }, [timeSeries, dateRange, metric, horizon]);
}
