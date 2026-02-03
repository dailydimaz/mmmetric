import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "./useAnalytics";

interface SocialShareParams {
  siteId: string;
  dateRange: DateRange;
}

export interface SocialShareEvent {
  platform: string;
  url: string;
  method: string;
  timestamp: string;
}

export interface PlatformStats {
  platform: string;
  count: number;
  percentage: number;
  icon: string;
}

export interface SharedPageStats {
  url: string;
  totalShares: number;
  platforms: Record<string, number>;
}

export interface SocialShareStats {
  totalShares: number;
  uniquePlatforms: number;
  topPlatform: string | null;
  shareRate: number; // shares per 1000 pageviews
  platformBreakdown: PlatformStats[];
  topSharedPages: SharedPageStats[];
  recentShares: SocialShareEvent[];
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

// Platform display info
const platformInfo: Record<string, { name: string; icon: string }> = {
  twitter: { name: "X / Twitter", icon: "🐦" },
  facebook: { name: "Facebook", icon: "📘" },
  linkedin: { name: "LinkedIn", icon: "💼" },
  pinterest: { name: "Pinterest", icon: "📌" },
  reddit: { name: "Reddit", icon: "🤖" },
  whatsapp: { name: "WhatsApp", icon: "💬" },
  telegram: { name: "Telegram", icon: "✈️" },
  email: { name: "Email", icon: "📧" },
  native: { name: "Native Share", icon: "📱" },
  copy: { name: "Copy Link", icon: "📋" },
  unknown: { name: "Other", icon: "🔗" },
};

export function useSocialShare({ siteId, dateRange }: SocialShareParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["social-share", siteId, dateRange],
    queryFn: async (): Promise<SocialShareStats> => {
      // Fetch social share events
      const { data: shareEvents, error: shareError } = await supabase
        .from("events")
        .select("properties, created_at, url")
        .eq("site_id", siteId)
        .eq("event_name", "social_share")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      if (shareError) throw shareError;

      // Fetch pageview count for rate calculation
      const { count: pageviewCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("event_name", "pageview")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (!shareEvents || shareEvents.length === 0) {
        return {
          totalShares: 0,
          uniquePlatforms: 0,
          topPlatform: null,
          shareRate: 0,
          platformBreakdown: [],
          topSharedPages: [],
          recentShares: [],
        };
      }

      // Process platform breakdown
      const platformCounts: Record<string, number> = {};
      const pagePlatforms: Record<string, Record<string, number>> = {};
      const recentShares: SocialShareEvent[] = [];

      shareEvents.forEach((event) => {
        const props = event.properties as Record<string, unknown>;
        const platform = String(props?.platform || "unknown").toLowerCase();
        const url = event.url || "/";
        const method = String(props?.method || "click");

        // Count platforms
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;

        // Track per-page platforms
        if (!pagePlatforms[url]) pagePlatforms[url] = {};
        pagePlatforms[url][platform] = (pagePlatforms[url][platform] || 0) + 1;

        // Recent shares (first 20)
        if (recentShares.length < 20) {
          recentShares.push({
            platform,
            url,
            method,
            timestamp: event.created_at,
          });
        }
      });

      const totalShares = shareEvents.length;
      const uniquePlatforms = Object.keys(platformCounts).length;

      // Platform breakdown with percentages
      const platformBreakdown: PlatformStats[] = Object.entries(platformCounts)
        .map(([platform, count]) => ({
          platform: platformInfo[platform]?.name || platform,
          count,
          percentage: Math.round((count / totalShares) * 100),
          icon: platformInfo[platform]?.icon || "🔗",
        }))
        .sort((a, b) => b.count - a.count);

      // Top platform
      const topPlatform = platformBreakdown[0]?.platform || null;

      // Top shared pages
      const topSharedPages: SharedPageStats[] = Object.entries(pagePlatforms)
        .map(([url, platforms]) => ({
          url,
          totalShares: Object.values(platforms).reduce((a, b) => a + b, 0),
          platforms,
        }))
        .sort((a, b) => b.totalShares - a.totalShares)
        .slice(0, 10);

      // Share rate per 1000 pageviews
      const shareRate = pageviewCount
        ? Math.round((totalShares / pageviewCount) * 1000 * 10) / 10
        : 0;

      return {
        totalShares,
        uniquePlatforms,
        topPlatform,
        shareRate,
        platformBreakdown,
        topSharedPages,
        recentShares,
      };
    },
    enabled: !!siteId,
  });
}
