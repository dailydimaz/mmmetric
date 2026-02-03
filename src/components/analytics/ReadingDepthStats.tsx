import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Eye, Zap, UserX, Clock, BarChart3, FileText } from "lucide-react";
import { useReadingDepth } from "@/hooks/useReadingDepth";
import { DateRange } from "@/hooks/useAnalytics";

interface ReadingDepthStatsProps {
  siteId: string;
  dateRange: DateRange;
}

export function ReadingDepthStats({ siteId, dateRange }: ReadingDepthStatsProps) {
  const { data, isLoading } = useReadingDepth({ siteId, dateRange });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Reading Depth
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

  if (!data || data.totalReads === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Reading Depth
          </CardTitle>
          <CardDescription>Track reading engagement vs scroll-through</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No reading data yet</p>
            <p className="text-sm mt-1">
              Reading depth is tracked automatically as visitors scroll and spend time on pages.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreBadge = (score: number) => {
    if (score >= 60) return { variant: "default" as const, label: "High Engagement" };
    if (score >= 30) return { variant: "secondary" as const, label: "Moderate" };
    return { variant: "outline" as const, label: "Low" };
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case "reader": return <BookOpen className="h-3 w-3 text-green-500" />;
      case "skimmer": return <Eye className="h-3 w-3 text-yellow-500" />;
      default: return <Zap className="h-3 w-3 text-red-500" />;
    }
  };

  const scoreBadge = getScoreBadge(data.avgScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Reading Depth
          <Badge variant={scoreBadge.variant} className="ml-auto">
            {scoreBadge.label}
          </Badge>
        </CardTitle>
        <CardDescription>Distinguish true readers from quick scrollers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{data.avgScore}</div>
            <div className="text-xs text-muted-foreground">Avg. Score</div>
            <Progress value={data.avgScore} className="h-1 mt-2" />
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Clock className="h-4 w-4" />
              {data.avgTimeSeconds}s
            </div>
            <div className="text-xs text-muted-foreground">Avg. Read Time</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{data.totalReads.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Sessions</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-500">{data.readerPercent}%</div>
            <div className="text-xs text-muted-foreground">True Readers</div>
          </div>
        </div>

        {/* Classification Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visitor Classification
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Readers</span>
              </div>
              <div className="text-2xl font-bold text-green-500">{data.readerPercent}%</div>
              <p className="text-xs text-muted-foreground">Thoroughly engaged</p>
            </div>
            <div className="p-3 rounded-lg border bg-yellow-500/5 border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Skimmers</span>
              </div>
              <div className="text-2xl font-bold text-yellow-500">{data.skimmerPercent}%</div>
              <p className="text-xs text-muted-foreground">Quick scanning</p>
            </div>
            <div className="p-3 rounded-lg border bg-red-500/5 border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Bouncers</span>
              </div>
              <div className="text-2xl font-bold text-red-500">{data.bouncerPercent}%</div>
              <p className="text-xs text-muted-foreground">Left quickly</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="zones" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="zones" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Time by Zone
            </TabsTrigger>
            <TabsTrigger value="pages" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              By Page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="zones" className="mt-4">
            <div className="space-y-3">
              {data.zoneBreakdown.map((zone) => {
                const maxTime = Math.max(...data.zoneBreakdown.map(z => z.avgTime));
                const percentage = maxTime > 0 ? (zone.avgTime / maxTime) * 100 : 0;
                return (
                  <div key={zone.zone} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{zone.label}</span>
                      <span className="text-muted-foreground">{zone.avgTime}s avg</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="pages" className="mt-4">
            {data.byPage.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No page data available</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {data.byPage.map((page) => (
                  <div
                    key={page.url}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getClassificationIcon(page.classification)}
                      <span className="font-mono text-xs truncate">{page.url}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Score: {page.avgScore}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{page.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
