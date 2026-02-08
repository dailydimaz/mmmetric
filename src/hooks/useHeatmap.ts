import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export interface HeatmapClick {
  id: number;
  x: number;
  y: number;
  viewport_w: number;
  viewport_h: number;
  element_selector: string | null;
  element_text: string | null;
  created_at: string;
}

export interface HeatmapScroll {
  id: number;
  max_scroll_percentage: number;
  viewport_h: number;
  created_at: string;
}

export interface HeatmapStats {
  totalClicks: number;
  avgClickX: number;
  avgClickY: number;
  topElements: Array<{ selector: string; clicks: number }>;
  avgScrollDepth: number;
  maxScrollReached: number;
}

export function useHeatmapClicks(
  siteId: string,
  urlPath: string,
  dateRange: { from: Date; to: Date } | null
) {
  return useQuery({
    queryKey: ["heatmap-clicks", siteId, urlPath, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      const from = dateRange?.from || subDays(new Date(), 7);
      const to = dateRange?.to || new Date();

      const { data, error } = await supabase
        .from("heatmap_clicks")
        .select("id, x, y, viewport_w, viewport_h, element_selector, element_text, created_at")
        .eq("site_id", siteId)
        .eq("url_path", urlPath)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;
      return data as HeatmapClick[];
    },
    enabled: !!siteId && !!urlPath,
    staleTime: 60 * 1000,
  });
}

export function useHeatmapScrolls(
  siteId: string,
  urlPath: string,
  dateRange: { from: Date; to: Date } | null
) {
  return useQuery({
    queryKey: ["heatmap-scrolls", siteId, urlPath, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      const from = dateRange?.from || subDays(new Date(), 7);
      const to = dateRange?.to || new Date();

      const { data, error } = await supabase
        .from("heatmap_scrolls")
        .select("id, max_scroll_percentage, viewport_h, created_at")
        .eq("site_id", siteId)
        .eq("url_path", urlPath)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;
      return data as HeatmapScroll[];
    },
    enabled: !!siteId && !!urlPath,
    staleTime: 60 * 1000,
  });
}

export function useHeatmapPages(siteId: string) {
  return useQuery({
    queryKey: ["heatmap-pages", siteId],
    queryFn: async () => {
      // Get unique pages with click data
      const { data, error } = await supabase
        .from("heatmap_clicks")
        .select("url_path")
        .eq("site_id", siteId)
        .gte("created_at", subDays(new Date(), 30).toISOString())
        .limit(1000);

      if (error) throw error;

      // Count unique pages
      const pageCounts = new Map<string, number>();
      data.forEach((row) => {
        const count = pageCounts.get(row.url_path) || 0;
        pageCounts.set(row.url_path, count + 1);
      });

      // Sort by count
      return Array.from(pageCounts.entries())
        .map(([path, clicks]) => ({ path, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 50);
    },
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000,
  });
}

export function calculateHeatmapStats(
  clicks: HeatmapClick[],
  scrolls: HeatmapScroll[]
): HeatmapStats {
  // Click stats
  const totalClicks = clicks.length;
  const avgClickX = totalClicks > 0
    ? Math.round(clicks.reduce((sum, c) => sum + c.x, 0) / totalClicks)
    : 0;
  const avgClickY = totalClicks > 0
    ? Math.round(clicks.reduce((sum, c) => sum + c.y, 0) / totalClicks)
    : 0;

  // Top clicked elements
  const elementCounts = new Map<string, number>();
  clicks.forEach((c) => {
    if (c.element_selector) {
      const count = elementCounts.get(c.element_selector) || 0;
      elementCounts.set(c.element_selector, count + 1);
    }
  });
  const topElements = Array.from(elementCounts.entries())
    .map(([selector, clicks]) => ({ selector, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Scroll stats
  const avgScrollDepth = scrolls.length > 0
    ? Math.round(scrolls.reduce((sum, s) => sum + s.max_scroll_percentage, 0) / scrolls.length)
    : 0;
  const maxScrollReached = scrolls.length > 0
    ? Math.max(...scrolls.map((s) => s.max_scroll_percentage))
    : 0;

  return {
    totalClicks,
    avgClickX,
    avgClickY,
    topElements,
    avgScrollDepth,
    maxScrollReached,
  };
}
