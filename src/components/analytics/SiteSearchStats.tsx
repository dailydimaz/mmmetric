import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, AlertCircle, TrendingUp, FileSearch, XCircle } from "lucide-react";
import { useSiteSearch } from "@/hooks/useSiteSearch";
import { DateRange } from "@/hooks/useAnalytics";

interface SiteSearchStatsProps {
  siteId: string;
  dateRange: DateRange;
}

export function SiteSearchStats({ siteId, dateRange }: SiteSearchStatsProps) {
  const { data, isLoading } = useSiteSearch({ siteId, dateRange });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Site Search Analytics
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

  if (!data || data.totalSearches === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Site Search Analytics
          </CardTitle>
          <CardDescription>Track what users search for on your site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No search data yet</p>
            <p className="text-sm mt-1">
              Track searches by calling:{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                mmmetric('site_search', {'{'} query: 'term', result_count: 5 {'}'})
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getZeroResultBadgeVariant = (rate: number) => {
    if (rate <= 10) return "default";
    if (rate <= 25) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Site Search Analytics
        </CardTitle>
        <CardDescription>Understand what users are searching for</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{data.totalSearches.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Searches</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{data.uniqueQueries.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Unique Queries</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              {data.zeroResultRate}%
              <Badge variant={getZeroResultBadgeVariant(data.zeroResultRate)} className="text-[10px] px-1">
                {data.zeroResultRate <= 10 ? "Good" : data.zeroResultRate <= 25 ? "Fair" : "High"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">Zero Results Rate</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {data.totalSearches > 0 ? Math.round(data.totalSearches / data.uniqueQueries * 10) / 10 : 0}
            </div>
            <div className="text-xs text-muted-foreground">Searches per Query</div>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="top" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="top" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Top Queries
            </TabsTrigger>
            <TabsTrigger value="zero" className="text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Zero Results
            </TabsTrigger>
            <TabsTrigger value="pages" className="text-xs">
              <FileSearch className="h-3 w-3 mr-1" />
              By Page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top" className="mt-4">
            {data.topQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No search queries recorded</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.topQueries.map((query, idx) => (
                  <div
                    key={query.query}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{query.query}</div>
                        {query.avgResultCount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Avg. {query.avgResultCount} results
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!query.hasResults && (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {query.count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="zero" className="mt-4">
            {data.zeroResultQueries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-green-500 mb-2">✓</div>
                <p className="text-sm font-medium">No zero-result queries!</p>
                <p className="text-xs">All searches returned results</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-3">
                  These queries returned no results. Consider adding content for these topics.
                </p>
                {data.zeroResultQueries.map((query, idx) => (
                  <div
                    key={query.query}
                    className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      <span className="font-medium text-sm truncate">{query.query}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {query.count} searches
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pages" className="mt-4">
            {data.searchesByPage.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No page data available</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.searchesByPage.map((page) => {
                  const percentage = Math.round((page.count / data.totalSearches) * 100);
                  return (
                    <div key={page.page} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-mono text-xs">{page.page}</span>
                        <span className="text-muted-foreground text-xs">
                          {page.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
