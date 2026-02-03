import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Share2, TrendingUp, Users, ExternalLink } from "lucide-react";
import { useSocialShare } from "@/hooks/useSocialShare";
import { DateRange } from "@/hooks/useAnalytics";
import { formatDistanceToNow } from "date-fns";

interface SocialShareStatsProps {
  siteId: string;
  dateRange: DateRange;
}

export function SocialShareStats({ siteId, dateRange }: SocialShareStatsProps) {
  const { data, isLoading, error } = useSocialShare({ siteId, dateRange });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Shares
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
            <Share2 className="h-5 w-5" />
            Social Shares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Unable to load social share data
          </p>
        </CardContent>
      </Card>
    );
  }

  const { totalShares, uniquePlatforms, topPlatform, shareRate, platformBreakdown, topSharedPages, recentShares } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Social Shares
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{totalShares.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Shares</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{uniquePlatforms}</div>
            <div className="text-xs text-muted-foreground">Platforms</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{shareRate}</div>
            <div className="text-xs text-muted-foreground">Per 1K Views</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold truncate">{topPlatform || "—"}</div>
            <div className="text-xs text-muted-foreground">Top Platform</div>
          </div>
        </div>

        {totalShares === 0 ? (
          <div className="text-center py-8">
            <Share2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              No social shares tracked yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Shares are tracked when users click social share buttons
            </p>
          </div>
        ) : (
          <Tabs defaultValue="platforms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              <TabsTrigger value="pages">Top Pages</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>

            <TabsContent value="platforms" className="mt-4 space-y-3">
              {platformBreakdown.map((platform) => (
                <div key={platform.platform} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{platform.icon}</span>
                      <span>{platform.platform}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {platform.count.toLocaleString()} ({platform.percentage}%)
                    </span>
                  </div>
                  <Progress value={platform.percentage} className="h-2" />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="pages" className="mt-4">
              <div className="space-y-2">
                {topSharedPages.map((page) => (
                  <div
                    key={page.url}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate" title={page.url}>
                        {page.url}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex gap-1">
                        {Object.keys(page.platforms).slice(0, 3).map((platform) => (
                          <span key={platform} className="text-xs" title={platform}>
                            {platform === "twitter" ? "🐦" :
                             platform === "facebook" ? "📘" :
                             platform === "linkedin" ? "💼" :
                             platform === "whatsapp" ? "💬" :
                             platform === "native" ? "📱" : "🔗"}
                          </span>
                        ))}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {page.totalShares}
                      </Badge>
                    </div>
                  </div>
                ))}
                {topSharedPages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No shared pages yet
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recent" className="mt-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentShares.map((share, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">
                        {share.platform === "twitter" ? "🐦" :
                         share.platform === "facebook" ? "📘" :
                         share.platform === "linkedin" ? "💼" :
                         share.platform === "whatsapp" ? "💬" :
                         share.platform === "telegram" ? "✈️" :
                         share.platform === "email" ? "📧" :
                         share.platform === "native" ? "📱" :
                         share.platform === "copy" ? "📋" : "🔗"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{share.url}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {share.method === "web_share_api" ? "Native Share" : share.method}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(share.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))}
                {recentShares.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent shares
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
