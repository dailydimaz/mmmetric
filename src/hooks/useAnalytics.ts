import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export type DateRange = "today" | "7d" | "30d" | "90d";

export interface AnalyticsFilter {
  country?: string;
  browser?: string;
  url?: string;
  os?: string;
  device?: string;
  referrerPattern?: string;
  tag?: string;
}

interface AnalyticsParams {
  siteId: string;
  dateRange: DateRange;
  filters?: AnalyticsFilter;
}

export function getDateRangeFilter(dateRange: DateRange): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
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

  const periodLength = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const prevStart = subDays(start, periodLength);
  const prevEnd = subDays(end, periodLength);

  return { start, end, prevStart, prevEnd };
}

// Convert filters to JSONB format for RPC calls
function filtersToJsonb(filters?: AnalyticsFilter): Record<string, string> | null {
  if (!filters || Object.keys(filters).length === 0) return null;

  const result: Record<string, string> = {};
  if (filters.country) result.country = filters.country;
  if (filters.browser) result.browser = filters.browser;
  if (filters.os) result.os = filters.os;
  if (filters.device) result.device = filters.device;
  if (filters.url) result.url = filters.url;
  if (filters.referrerPattern) result.referrerPattern = filters.referrerPattern;
  if (filters.tag) result.tag = filters.tag;

  return Object.keys(result).length > 0 ? result : null;
}

export interface StatsData {
  totalPageviews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageviewsChange: number;
  visitorsChange: number;
  viewsPerVisit: number;
}

export interface TimeSeriesData {
  date: string;
  pageviews: number;
  visitors: number;
  prevPageviews?: number;
  prevVisitors?: number;
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
  latitude: number | null;
  longitude: number | null;
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

// Types for RPC calls - base params without prev dates
type BaseRpcParams = {
  _site_id: string;
  _start_date: string;
  _end_date: string;
  _filters?: Record<string, string>;
  _limit?: number;
};

// Extended params with comparison period
type DateRangeParams = BaseRpcParams & {
  _prev_start_date: string;
  _prev_end_date: string;
};

// Fetch overall stats using RPC with filter support
export function useAnalyticsStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end, prevStart, prevEnd } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-stats", siteId, dateRange, filters],
    queryFn: async (): Promise<StatsData> => {
      const params: DateRangeParams = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _prev_start_date: prevStart.toISOString(),
        _prev_end_date: prevEnd.toISOString(),
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      };

      const { data, error } = await supabase.rpc('get_site_stats', params);

      if (error) throw error;

      // Ensure data is typed correctly based on RPC response
      const result = (data as any)?.[0] || {
        total_pageviews: 0,
        unique_visitors: 0,
        bounce_rate: 0,
        pageviews_change: 0,
        visitors_change: 0,
        avg_session_duration: 0,
      };

      const totalPv = Number(result.total_pageviews) || 0;
      const uniqueVis = Number(result.unique_visitors) || 0;

      return {
        totalPageviews: totalPv,
        uniqueVisitors: uniqueVis,
        avgSessionDuration: Number(result.avg_session_duration) || 0,
        bounceRate: Number(result.bounce_rate) || 0,
        pageviewsChange: Number(result.pageviews_change) || 0,
        visitorsChange: Number(result.visitors_change) || 0,
        viewsPerVisit: uniqueVis > 0 ? Math.round((totalPv / uniqueVis) * 100) / 100 : 0,
      };
    },
    enabled: !!siteId,
  });
}

// Fetch time series data using RPC with filter support
export function useAnalyticsTimeSeries({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end, prevStart, prevEnd } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-timeseries", siteId, dateRange, filters],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const params: DateRangeParams = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _prev_start_date: prevStart.toISOString(),
        _prev_end_date: prevEnd.toISOString(),
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      };

      const { data, error } = await supabase.rpc('get_timeseries_stats', params);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        date: row.date,
        pageviews: Number(row.pageviews) || 0,
        visitors: Number(row.visitors) || 0,
        prevPageviews: Number(row.prev_pageviews) || 0,
        prevVisitors: Number(row.prev_visitors) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch top pages using RPC with filter support
export function useTopPages({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-pages", siteId, dateRange, filters],
    queryFn: async (): Promise<TopPage[]> => {
      const params: BaseRpcParams = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      };

      const { data, error } = await supabase.rpc('get_top_pages', params);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        url: row.url,
        pageviews: Number(row.pageviews) || 0,
        uniqueVisitors: Number(row.unique_visitors) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch top referrers using RPC with filter support
export function useTopReferrers({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-referrers", siteId, dateRange, filters],
    queryFn: async (): Promise<TopReferrer[]> => {
      const params: BaseRpcParams = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      };

      const { data, error } = await supabase.rpc('get_top_referrers', params);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        referrer: row.referrer,
        visits: Number(row.visits) || 0,
        percentage: Number(row.percentage) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch device stats using RPC with filter support
export function useDeviceStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-devices", siteId, dateRange, filters],
    queryFn: async () => {
      const params: BaseRpcParams = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      };

      const { data, error } = await supabase.rpc('get_device_stats', params);

      if (error) throw error;

      const rawResult = data as unknown as {
        browsers: { name: string; visits: number }[];
        os: { name: string; visits: number }[];
        devices: { name: string; visits: number }[];
      } | null;

      const processStats = (items: { name: string; visits: number }[] | undefined): DeviceStat[] => {
        if (!items || !Array.isArray(items)) return [];
        const total = items.reduce((acc, item) => acc + (item.visits || 0), 0);
        return items.map(item => ({
          name: item.name,
          value: item.visits,
          percentage: total > 0 ? (item.visits / total) * 100 : 0
        }));
      };

      return {
        browsers: processStats(rawResult?.browsers),
        operatingSystems: processStats(rawResult?.os),
        devices: processStats(rawResult?.devices),
      };
    },
    enabled: !!siteId,
  });
}

// Fetch geo stats using RPC with filter support
export function useGeoStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-geo", siteId, dateRange, filters],
    queryFn: async (): Promise<GeoStat[]> => {
      const params: BaseRpcParams = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      };

      const { data, error } = await supabase.rpc('get_geo_stats', params);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        country: row.country,
        visits: Number(row.visits) || 0,
        percentage: Number(row.percentage) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch city stats using RPC with filter support
export function useCityStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-cities", siteId, dateRange, filters],
    queryFn: async (): Promise<CityStat[]> => {
      const params: BaseRpcParams = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      };

      const { data, error } = await supabase.rpc('get_city_stats', params);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        city: row.city,
        country: row.country,
        visits: Number(row.visits) || 0,
        percentage: Number(row.percentage) || 0,
        latitude: row.latitude ? Number(row.latitude) : null,
        longitude: row.longitude ? Number(row.longitude) : null,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch language stats using RPC with filter support
export function useLanguageStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-languages", siteId, dateRange, filters],
    queryFn: async (): Promise<LanguageStat[]> => {
      const params: BaseRpcParams = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      };

      const { data, error } = await supabase.rpc('get_language_stats', params);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        language: row.language,
        visits: Number(row.visits) || 0,
        percentage: Number(row.percentage) || 0,
      }));
    },
    enabled: !!siteId,
  });
}

// Fetch UTM campaign stats using RPC with filter support
export function useUTMStats({ siteId, dateRange, filters }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);
  const jsonbFilters = filtersToJsonb(filters);

  return useQuery({
    queryKey: ["analytics-utm", siteId, dateRange, filters],
    queryFn: async (): Promise<UTMStats> => {
      const params: BaseRpcParams = {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _limit: 10,
        ...(jsonbFilters ? { _filters: jsonbFilters } : {}),
      };

      const { data, error } = await supabase.rpc('get_utm_stats', params);

      if (error) throw error;

      const result = data as unknown as {
        sources: UTMStat[];
        mediums: UTMStat[];
        campaigns: UTMStat[];
      } | null;

      return {
        sources: result?.sources || [],
        mediums: result?.mediums || [],
        campaigns: result?.campaigns || [],
      };
    },
    enabled: !!siteId,
  });
}

export interface RetentionCohort {
  cohort_date: string;
  cohort_size: number;
  retention: {
    day: number;
    retained: number;
    rate: number;
  }[];
}

export interface RetentionData {
  cohorts: RetentionCohort[];
  summary: {
    day: number;
    average_rate: number;
  }[];
}

// Fetch retention cohorts using RPC
export function useRetentionCohorts({ siteId, dateRange }: AnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["retention-cohorts", siteId, dateRange],
    queryFn: async (): Promise<RetentionData> => {
      const { data, error } = await supabase.rpc('get_retention_cohorts', {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
      });

      if (error) throw error;

      return data as unknown as RetentionData;
    },
    enabled: !!siteId,
  });
}
