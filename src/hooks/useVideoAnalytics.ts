import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "./useAnalytics";

interface VideoAnalyticsParams {
  siteId: string;
  dateRange: DateRange;
}

export interface VideoEvent {
  videoId: string;
  videoTitle: string;
  action: "play" | "pause" | "complete" | "progress";
  progress?: number;
  duration?: number;
  url: string;
  timestamp: string;
  provider: string;
}

export interface VideoStats {
  videoId: string;
  videoTitle: string;
  provider: string;
  plays: number;
  completions: number;
  completionRate: number;
  avgWatchTime: number;
  totalWatchTime: number;
  uniqueViewers: number;
}

export interface VideoAnalyticsData {
  totalPlays: number;
  totalCompletions: number;
  avgCompletionRate: number;
  uniqueVideos: number;
  videoStats: VideoStats[];
  recentEvents: VideoEvent[];
  progressBreakdown: { milestone: number; count: number }[];
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

export function useVideoAnalytics({ siteId, dateRange }: VideoAnalyticsParams) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["video-analytics", siteId, dateRange],
    queryFn: async (): Promise<VideoAnalyticsData> => {
      const { data: events, error } = await supabase
        .from("events")
        .select("properties, created_at, url, session_id")
        .eq("site_id", siteId)
        .eq("event_name", "video")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000);

      if (error) throw error;

      if (!events || events.length === 0) {
        return {
          totalPlays: 0,
          totalCompletions: 0,
          avgCompletionRate: 0,
          uniqueVideos: 0,
          videoStats: [],
          recentEvents: [],
          progressBreakdown: [],
        };
      }

      // Aggregate by video
      const videoMap = new Map<string, {
        videoId: string;
        videoTitle: string;
        provider: string;
        plays: number;
        completions: number;
        progressEvents: number[];
        sessions: Set<string>;
        watchTimes: number[];
      }>();

      const recentEvents: VideoEvent[] = [];
      const progressCounts: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };

      events.forEach((event) => {
        const props = event.properties as Record<string, unknown>;
        if (!props) return;

        const videoId = String(props.video_id || props.videoId || "unknown");
        const videoTitle = String(props.video_title || props.title || videoId).substring(0, 100);
        const action = String(props.action || "unknown");
        const progress = typeof props.progress === "number" ? props.progress : undefined;
        const duration = typeof props.duration === "number" ? props.duration : undefined;
        const provider = String(props.provider || "html5");

        // Get or create video entry
        if (!videoMap.has(videoId)) {
          videoMap.set(videoId, {
            videoId,
            videoTitle,
            provider,
            plays: 0,
            completions: 0,
            progressEvents: [],
            sessions: new Set(),
            watchTimes: [],
          });
        }

        const video = videoMap.get(videoId)!;

        // Track session
        if (event.session_id) {
          video.sessions.add(event.session_id);
        }

        // Count actions
        if (action === "play") {
          video.plays++;
        } else if (action === "complete") {
          video.completions++;
          progressCounts[100]++;
        } else if (action === "progress" && progress !== undefined) {
          video.progressEvents.push(progress);
          // Track progress milestones
          if (progress >= 25 && progress < 50) progressCounts[25]++;
          else if (progress >= 50 && progress < 75) progressCounts[50]++;
          else if (progress >= 75 && progress < 100) progressCounts[75]++;
        }

        // Track watch time from progress events
        if (duration && progress !== undefined) {
          const watchTime = (progress / 100) * duration;
          video.watchTimes.push(watchTime);
        }

        // Recent events (first 30)
        if (recentEvents.length < 30 && ["play", "pause", "complete"].includes(action)) {
          recentEvents.push({
            videoId,
            videoTitle,
            action: action as VideoEvent["action"],
            progress,
            duration,
            url: event.url || "/",
            timestamp: event.created_at,
            provider,
          });
        }
      });

      // Calculate stats per video
      const videoStats: VideoStats[] = Array.from(videoMap.values())
        .map((video) => {
          const avgWatchTime = video.watchTimes.length > 0
            ? video.watchTimes.reduce((a, b) => a + b, 0) / video.watchTimes.length
            : 0;

          return {
            videoId: video.videoId,
            videoTitle: video.videoTitle,
            provider: video.provider,
            plays: video.plays,
            completions: video.completions,
            completionRate: video.plays > 0 ? Math.round((video.completions / video.plays) * 100) : 0,
            avgWatchTime: Math.round(avgWatchTime),
            totalWatchTime: Math.round(video.watchTimes.reduce((a, b) => a + b, 0)),
            uniqueViewers: video.sessions.size,
          };
        })
        .sort((a, b) => b.plays - a.plays);

      // Calculate totals
      const totalPlays = videoStats.reduce((sum, v) => sum + v.plays, 0);
      const totalCompletions = videoStats.reduce((sum, v) => sum + v.completions, 0);
      const avgCompletionRate = totalPlays > 0 ? Math.round((totalCompletions / totalPlays) * 100) : 0;

      const progressBreakdown = [
        { milestone: 25, count: progressCounts[25] },
        { milestone: 50, count: progressCounts[50] },
        { milestone: 75, count: progressCounts[75] },
        { milestone: 100, count: progressCounts[100] },
      ];

      return {
        totalPlays,
        totalCompletions,
        avgCompletionRate,
        uniqueVideos: videoStats.length,
        videoStats: videoStats.slice(0, 20),
        recentEvents,
        progressBreakdown,
      };
    },
    enabled: !!siteId,
  });
}
