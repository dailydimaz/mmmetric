import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export type DateRange = "today" | "7d" | "30d" | "90d";

interface AnalyticsParams {
  siteId: string;
  dateRange: DateRange;
}

function getDateRangeFilter(dateRange: DateRange): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
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

  // Calculate previous period
  const periodLength = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const prevStart = subDays(start, periodLength);
  const prevEnd = subDays(end, periodLength);

  return { start, end, prevStart, prevEnd };
}

export interface StatsData {
  totalPageviews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageviewsChange: number;
  visitorsChange: number;
}

export interface TimeSeriesData {
  date: string;
  pageviews: number;
  visitors: number;
}

export interface TopPage {
  url: string;
  pageviews: number;
  uniqueVisitors: number;
}

export interface TopReferrer {
  referrer: string;
  visits: number;
  percentage: number;
}

export interface DeviceStat {
  name: string;
  value: number;
  percentage: number;
}

export interface GeoStat {
  country: string;
  visits: number;
  percentage: number;
}

export interface CityStat {
  city: string;
  country: string;
  visits: number;
  percentage: number;
}

export interface LanguageStat {
  language: string;
  visits: number;
  percentage: number;
}

export interface UTMStat {
  value: string;
  visits: number;
  percentage: number;
}

export interface UTMStats {
  sources: UTMStat[];
  mediums: UTMStat[];
  campaigns: UTMStat[];
}

// Fetch overall stats
export function useAnalyticsStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end, prevStart, prevEnd } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-stats", siteId, dateRange],
    queryFn: async (): Promise<StatsData> => {
      const { data, error } = await supabase.rpc("get_site_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _prev_start_date: prevStart.toISOString(),
        _prev_end_date: prevEnd.toISOString(),
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalPageviews: 0,
          uniqueVisitors: 0,
          avgSessionDuration: 0,
          bounceRate: 0,
          pageviewsChange: 0,
          visitorsChange: 0,
        };
      }

      // RPC returns a single row
      const result = data[0];
      return {
        totalPageviews: Number(result.total_pageviews),
        uniqueVisitors: Number(result.unique_visitors),
        avgSessionDuration: Number(result.avg_session_duration),
        bounceRate: Number(result.bounce_rate),
        pageviewsChange: Number(result.pageviews_change),
        visitorsChange: Number(result.visitors_change),
      };
    },
    enabled: !!siteId,
  });
}

// Fetch time series data for charts
export function useAnalyticsTimeSeries({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-timeseries", siteId, dateRange],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const { data, error } = await supabase.rpc("get_timeseries_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        date: row.date,
        pageviews: Number(row.pageviews),
        visitors: Number(row.visitors),
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch top pages
export function useTopPages({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-pages", siteId, dateRange],
    queryFn: async (): Promise<TopPage[]> => {
      const { data, error } = await supabase.rpc("get_top_pages", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        url: row.url,
        pageviews: Number(row.pageviews),
        uniqueVisitors: Number(row.unique_visitors),
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch top referrers
export function useTopReferrers({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-referrers", siteId, dateRange],
    queryFn: async (): Promise<TopReferrer[]> => {
      const { data, error } = await supabase.rpc("get_top_referrers", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        referrer: row.referrer,
        visits: Number(row.visits),
        percentage: Number(row.percentage),
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch device stats
export function useDeviceStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-devices", siteId, dateRange],
    queryFn: async (): Promise<{ browsers: DeviceStat[]; operatingSystems: DeviceStat[]; devices: DeviceStat[] }> => {
      const { data, error } = await supabase.rpc("get_device_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      // Type assertion for the complex JSONB return type
      const result = data as unknown as {
        browsers: DeviceStat[];
        operatingSystems: DeviceStat[];
        devices: DeviceStat[];
      };

      return {
        browsers: result.browsers || [],
        operatingSystems: result.operatingSystems || [],
        devices: result.devices || [],
      };
    },
    enabled: !!siteId,
  });
}

// Fetch geo stats (countries)
export function useGeoStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-geo", siteId, dateRange],
    queryFn: async (): Promise<GeoStat[]> => {
      const { data, error } = await supabase.rpc("get_geo_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        country: row.country,
        visits: Number(row.visits),
        percentage: Number(row.percentage),
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch city stats
export function useCityStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-cities", siteId, dateRange],
    queryFn: async (): Promise<CityStat[]> => {
      const { data, error } = await supabase.rpc("get_city_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        city: row.city,
        country: row.country,
        visits: Number(row.visits),
        percentage: Number(row.percentage),
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch language stats
export function useLanguageStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-languages", siteId, dateRange],
    queryFn: async (): Promise<LanguageStat[]> => {
      const { data, error } = await supabase.rpc("get_language_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        language: row.language,
        visits: Number(row.visits),
        percentage: Number(row.percentage),
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch UTM campaign stats
export function useUTMStats({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["analytics-utm", siteId, dateRange],
    queryFn: async (): Promise<UTMStats> => {
      const { data, error } = await supabase.rpc("get_utm_stats", {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      const result = data as unknown as {
        sources: UTMStat[];
        mediums: UTMStat[];
        campaigns: UTMStat[];
      };

      return {
        sources: result.sources || [],
        mediums: result.mediums || [],
        campaigns: result.campaigns || [],
      };
    },
    enabled: !!siteId,
  });
}
