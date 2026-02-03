import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "./useAnalytics";

interface SiteSearchParams {
  siteId: string;
  dateRange: DateRange;
}

export interface SearchQuery {
  query: string;
  count: number;
  hasResults: boolean;
  avgResultCount: number;
}

export interface SearchStats {
  totalSearches: number;
  uniqueQueries: number;
  zeroResultRate: number;
  topQueries: SearchQuery[];
  zeroResultQueries: SearchQuery[];
  searchesByPage: { page: string; count: number }[];
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

export function useSiteSearch({ siteId, dateRange }: SiteSearchParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["site-search", siteId, dateRange],
    queryFn: async (): Promise<SearchStats> => {
      const { data, error } = await supabase
        .from("events")
        .select("properties, url, created_at")
        .eq("site_id", siteId)
        .eq("event_name", "site_search")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalSearches: 0,
          uniqueQueries: 0,
          zeroResultRate: 0,
          topQueries: [],
          zeroResultQueries: [],
          searchesByPage: [],
        };
      }

      // Aggregate search queries
      const queryMap = new Map<string, { count: number; hasResultsCount: number; totalResults: number }>();
      const pageMap = new Map<string, number>();

      data.forEach((event) => {
        const props = event.properties as Record<string, unknown> | null;
        if (!props) return;

        const query = String(props.query || "").toLowerCase().trim();
        if (!query) return;

        const resultCount = typeof props.result_count === "number" ? props.result_count : -1;
        const hasResults = resultCount !== 0;

        const existing = queryMap.get(query);
        if (existing) {
          existing.count++;
          if (hasResults) existing.hasResultsCount++;
          if (resultCount > 0) existing.totalResults += resultCount;
        } else {
          queryMap.set(query, {
            count: 1,
            hasResultsCount: hasResults ? 1 : 0,
            totalResults: resultCount > 0 ? resultCount : 0,
          });
        }

        // Track by page
        const page = event.url || "/";
        pageMap.set(page, (pageMap.get(page) || 0) + 1);
      });

      // Calculate stats
      const totalSearches = data.length;
      const uniqueQueries = queryMap.size;

      // Build query lists
      const allQueries: SearchQuery[] = [];
      let zeroResultCount = 0;

      queryMap.forEach((stats, query) => {
        const hasResults = stats.hasResultsCount > 0;
        if (!hasResults) zeroResultCount += stats.count;

        allQueries.push({
          query,
          count: stats.count,
          hasResults,
          avgResultCount: stats.hasResultsCount > 0 ? Math.round(stats.totalResults / stats.hasResultsCount) : 0,
        });
      });

      // Sort by count
      allQueries.sort((a, b) => b.count - a.count);

      const topQueries = allQueries.slice(0, 20);
      const zeroResultQueries = allQueries
        .filter((q) => !q.hasResults)
        .slice(0, 20);

      // Page stats
      const searchesByPage = Array.from(pageMap.entries())
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalSearches,
        uniqueQueries,
        zeroResultRate: totalSearches > 0 ? Math.round((zeroResultCount / totalSearches) * 100) : 0,
        topQueries,
        zeroResultQueries,
        searchesByPage,
      };
    },
    enabled: !!siteId,
  });
}
