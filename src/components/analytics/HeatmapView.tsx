import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, MousePointerClick, ScrollText, Calendar as CalendarIcon, RefreshCw, AlertCircle, TrendingDown, Info } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useHeatmapClicks, useHeatmapScrolls, useHeatmapPages, calculateHeatmapStats } from "@/hooks/useHeatmap";
import { HeatmapRenderer, aggregateClicksToPoints } from "@/lib/heatmapRenderer";

interface HeatmapViewProps {
  siteId: string;
  siteDomain?: string;
}

export function HeatmapView({ siteId }: HeatmapViewProps) {
  const [activeTab, setActiveTab] = useState<"click" | "scroll">("click");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [customUrl, setCustomUrl] = useState<string>("");
  const [deviceType, setDeviceType] = useState<"all" | "desktop" | "tablet" | "mobile">("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HeatmapRenderer | null>(null);

  // Queries
  const { data: pages, isLoading: pagesLoading } = useHeatmapPages(siteId);
  const urlPath = selectedPage || customUrl || "/";

  const { data: clicks, isLoading: clicksLoading, refetch: refetchClicks } = useHeatmapClicks(
    siteId,
    urlPath,
    dateRange,
    deviceType
  );

  const { data: scrolls, isLoading: scrollsLoading, refetch: refetchScrolls } = useHeatmapScrolls(
    siteId,
    urlPath,
    dateRange,
    deviceType
  );

  const stats = calculateHeatmapStats(clicks || [], scrolls || []);
  const isLoading = clicksLoading || scrollsLoading;

  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new HeatmapRenderer(canvasRef.current);
    }
  }, []);

  // Render heatmap when data changes
  const renderHeatmap = useCallback(() => {
    if (!rendererRef.current || !clicks || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    // Calculate height based on max click Y or default
    const maxClickY = clicks.reduce((max, c) => Math.max(max, c.y), 0);
    const containerHeight = Math.max(800, maxClickY + 200);

    // Resize canvas
    rendererRef.current.resize(containerWidth, containerHeight);

    // Aggregate clicks into points
    const points = aggregateClicksToPoints(
      clicks.map((c) => ({ x: c.x, y: c.y, viewport_w: c.viewport_w })),
      containerWidth
    );

    rendererRef.current.setData(points);
    rendererRef.current.render();
  }, [clicks]);

  useEffect(() => {
    if (activeTab === "click" && clicks?.length) {
      renderHeatmap();
    }
  }, [activeTab, clicks, renderHeatmap]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (activeTab === "click") {
        renderHeatmap();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, renderHeatmap]);

  const handleRefresh = () => {
    refetchClicks();
    refetchScrolls();
  };

  // Quick date range presets
  const setPresetRange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  const getContainerStyle = () => {
    switch (deviceType) {
      case "mobile":
        return { maxWidth: "400px", margin: "0 auto" };
      case "tablet":
        return { maxWidth: "800px", margin: "0 auto" };
      default:
        return { width: "100%" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5" />
                Heatmaps
              </CardTitle>
              <CardDescription>
                Visualize where users click and how far they scroll on your pages.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Page Selector */}
            <div className="space-y-2">
              <Label>Page</Label>
              <Select value={selectedPage} onValueChange={(v) => { setSelectedPage(v); setCustomUrl(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder={pagesLoading ? "Loading..." : "Select a page"} />
                </SelectTrigger>
                <SelectContent>
                  {pages?.map((page) => (
                    <SelectItem key={page.path} value={page.path}>
                      <span className="flex items-center justify-between gap-2 w-full">
                        <span className="truncate max-w-[200px]">{page.path}</span>
                        <Badge variant="secondary" className="text-xs">{page.clicks}</Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom URL */}
            <div className="space-y-2">
              <Label>Or enter URL path</Label>
              <Input
                placeholder="/pricing"
                value={customUrl}
                onChange={(e) => { setCustomUrl(e.target.value); setSelectedPage(""); }}
              />
            </div>

            {/* Device Filter */}
            <div className="space-y-2">
              <Label>Device</Label>
              <Select value={deviceType} onValueChange={(v: any) => setDeviceType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Devices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="desktop">Desktop ({">"} 1024px)</SelectItem>
                  <SelectItem value="tablet">Tablet (768px - 1024px)</SelectItem>
                  <SelectItem value="mobile">Mobile ({"<"} 768px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex gap-2 p-2 border-b">
                    <Button variant="ghost" size="sm" onClick={() => setPresetRange(7)}>7D</Button>
                    <Button variant="ghost" size="sm" onClick={() => setPresetRange(14)}>14D</Button>
                    <Button variant="ghost" size="sm" onClick={() => setPresetRange(30)}>30D</Button>
                  </div>
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                        setIsCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
              </div>
              <MousePointerClick className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Scroll Depth</p>
                <p className="text-2xl font-bold">{stats.avgScrollDepth}%</p>
              </div>
              <ScrollText className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Max Scroll</p>
                <p className="text-2xl font-bold">{stats.maxScrollReached}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Elements</p>
                <p className="text-2xl font-bold">{stats.topElements.length}</p>
              </div>
              <Info className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "click" | "scroll")}>
            <TabsList>
              <TabsTrigger value="click" className="gap-2">
                <MousePointerClick className="h-4 w-4" />
                Click Heatmap
              </TabsTrigger>
              <TabsTrigger value="scroll" className="gap-2">
                <ScrollText className="h-4 w-4" />
                Scroll Depth
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[600px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !urlPath || urlPath === "/" ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">Select a Page</h3>
              <p className="text-muted-foreground text-sm max-w-md mt-2">
                Choose a page from the dropdown above or enter a URL path to view heatmap data.
              </p>
            </div>
          ) : activeTab === "click" ? (
            <div className="border rounded-lg bg-muted/30 overflow-hidden relative">
              <div
                ref={containerRef}
                className="relative min-h-[600px] overflow-hidden bg-background shadow-sm transition-all duration-300"
                style={getContainerStyle()}
              >
                {clicks?.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <MousePointerClick className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium">No click data yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click tracking data will appear once users interact with this page.
                    </p>
                  </div>
                ) : (
                  <>
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full"
                      style={{ pointerEvents: "none" }}
                    />
                    <div className="sticky bottom-4 left-0 right-0 flex justify-end px-4 pointer-events-none">
                      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg border text-sm shadow-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>Cold</span>
                        </div>
                        <div className="w-16 h-2 rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500" />
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span>Hot</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <ScrollDepthVisualization scrolls={scrolls || []} />
          )}
        </CardContent>
      </Card>

      {/* Top Clicked Elements */}
      {stats.topElements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Clicked Elements</CardTitle>
            <CardDescription>Most frequently clicked elements on this page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topElements.map((el, i) => (
                <div key={el.selector} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono truncate max-w-[400px]">
                      {el.selector}
                    </code>
                  </div>
                  <Badge variant="secondary">{el.clicks} clicks</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Scroll Depth Visualization Component
function ScrollDepthVisualization({ scrolls }: { scrolls: Array<{ max_scroll_percentage: number }> }) {
  // Calculate distribution
  const bands: Record<number, number> = {};
  for (let i = 0; i <= 100; i += 10) {
    bands[i] = 0;
  }

  scrolls.forEach((s) => {
    const band = Math.min(100, Math.floor(s.max_scroll_percentage / 10) * 10);
    bands[band] = (bands[band] || 0) + 1;
  });

  const maxCount = Math.max(1, ...Object.values(bands));
  const totalSessions = scrolls.length;

  if (totalSessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <ScrollText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium">No scroll data yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Scroll depth data will appear once users view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Scroll Depth Distribution</span>
        <span>{totalSessions.toLocaleString()} sessions</span>
      </div>

      <div className="space-y-2">
        {Object.entries(bands).map(([percent, count]) => {
          const pct = parseInt(percent);
          const width = (count / maxCount) * 100;
          const sessionPercent = totalSessions > 0 ? ((count / totalSessions) * 100).toFixed(1) : 0;

          // Color gradient from green to red
          const hue = 120 - (pct * 1.2); // 120 (green) to 0 (red)

          return (
            <div key={pct} className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-12">{pct}%</span>
              <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden relative">
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{
                    width: `${width}%`,
                    backgroundColor: `hsl(${hue}, 70%, 50%)`,
                  }}
                />
                {count > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                    {count.toLocaleString()} ({sessionPercent}%)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 pt-4 border-t text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(120, 70%, 50%)" }} />
          <span className="text-muted-foreground">Top of page</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(60, 70%, 50%)" }} />
          <span className="text-muted-foreground">Middle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(0, 70%, 50%)" }} />
          <span className="text-muted-foreground">Bottom</span>
        </div>
      </div>
    </div>
  );
}