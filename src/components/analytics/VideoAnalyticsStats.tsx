import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, CheckCircle, Video, Clock, Users, TrendingUp } from "lucide-react";
import { useVideoAnalytics } from "@/hooks/useVideoAnalytics";
import { DateRange } from "@/hooks/useAnalytics";
import { formatDistanceToNow } from "date-fns";

interface VideoAnalyticsStatsProps {
  siteId: string;
  dateRange: DateRange;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export function VideoAnalyticsStats({ siteId, dateRange }: VideoAnalyticsStatsProps) {
  const { data, isLoading, error } = useVideoAnalytics({ siteId, dateRange });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Unable to load video analytics data
          </p>
        </CardContent>
      </Card>
    );
  }

  const { totalPlays, totalCompletions, avgCompletionRate, uniqueVideos, videoStats, recentEvents, progressBreakdown } = data;

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "youtube": return "🎬";
      case "vimeo": return "🎥";
      case "html5": return "📹";
      default: return "🎞️";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "play": return <Play className="h-4 w-4 text-green-500" />;
      case "pause": return <Pause className="h-4 w-4 text-yellow-500" />;
      case "complete": return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <Play className="h-5 w-5 text-green-500" />
              {totalPlays.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Plays</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              {totalCompletions.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Completions</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              <Badge variant={avgCompletionRate >= 50 ? "default" : avgCompletionRate >= 25 ? "secondary" : "outline"}>
                {avgCompletionRate}%
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Completion Rate</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{uniqueVideos}</div>
            <div className="text-xs text-muted-foreground">Unique Videos</div>
          </div>
        </div>

        {totalPlays === 0 ? (
          <div className="text-center py-8">
            <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              No video plays tracked yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Videos are tracked automatically for HTML5, YouTube, and Vimeo
            </p>
          </div>
        ) : (
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="recent">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-4 space-y-3">
              {videoStats.map((video) => (
                <div
                  key={video.videoId}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{getProviderIcon(video.provider)}</span>
                        <span className="font-medium text-sm truncate" title={video.videoTitle}>
                          {video.videoTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" /> {video.plays}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> {video.completions}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {video.uniqueViewers}
                        </span>
                        {video.avgWatchTime > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatDuration(video.avgWatchTime)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={video.completionRate >= 50 ? "default" : "secondary"}>
                      {video.completionRate}%
                    </Badge>
                  </div>
                  <Progress value={video.completionRate} className="h-1.5 mt-2" />
                </div>
              ))}
              {videoStats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No video data available
                </p>
              )}
            </TabsContent>

            <TabsContent value="engagement" className="mt-4 space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Watch Progress Funnel
                </h4>
                {progressBreakdown.map((item) => {
                  const maxCount = Math.max(...progressBreakdown.map(p => p.count), 1);
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={item.milestone} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.milestone}% watched</span>
                        <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Engagement Insights</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-muted/30 rounded">
                    <div className="text-muted-foreground text-xs">Drop-off before 25%</div>
                    <div className="font-medium">
                      {totalPlays > 0 
                        ? Math.round(((totalPlays - progressBreakdown[0].count) / totalPlays) * 100)
                        : 0}%
                    </div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <div className="text-muted-foreground text-xs">Complete rate</div>
                    <div className="font-medium">{avgCompletionRate}%</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="mt-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getActionIcon(event.action)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium">{event.videoTitle}</p>
                        <p className="text-xs text-muted-foreground truncate">{event.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
                {recentEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent video activity
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
