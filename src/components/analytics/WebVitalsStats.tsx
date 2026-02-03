import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Activity, Gauge, MousePointerClick, Layout, TrendingUp, TrendingDown } from "lucide-react";
import { useWebVitals, WebVitalMetric } from "@/hooks/useWebVitals";
import type { DateRange } from "@/hooks/useAnalytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WebVitalsStatsProps {
  siteId: string;
  dateRange: DateRange;
}

const METRIC_CONFIG: Record<string, {
  label: string;
  description: string;
  icon: typeof Activity;
  unit: string;
  goodThreshold: number;
  poorThreshold: number;
  format: (v: number) => string;
}> = {
  LCP: {
    label: "Largest Contentful Paint",
    description: "Time until the largest content element is visible",
    icon: Layout,
    unit: "ms",
    goodThreshold: 2500,
    poorThreshold: 4000,
    format: (v) => `${Math.round(v)}ms`,
  },
  CLS: {
    label: "Cumulative Layout Shift",
    description: "Visual stability - lower is better",
    icon: Activity,
    unit: "",
    goodThreshold: 0.1,
    poorThreshold: 0.25,
    format: (v) => v.toFixed(3),
  },
  INP: {
    label: "Interaction to Next Paint",
    description: "Responsiveness to user interactions",
    icon: MousePointerClick,
    unit: "ms",
    goodThreshold: 200,
    poorThreshold: 500,
    format: (v) => `${Math.round(v)}ms`,
  },
};

function getScoreColor(metric: string, value: number): string {
  const config = METRIC_CONFIG[metric];
  if (!config) return "text-muted-foreground";
  
  if (value <= config.goodThreshold) return "text-green-500";
  if (value <= config.poorThreshold) return "text-yellow-500";
  return "text-red-500";
}

function getScoreBadge(score: "good" | "needs-improvement" | "poor") {
  switch (score) {
    case "good":
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Good</Badge>;
    case "needs-improvement":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Needs Work</Badge>;
    case "poor":
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Poor</Badge>;
  }
}

function MetricCard({ metric }: { metric: WebVitalMetric }) {
  const config = METRIC_CONFIG[metric.metric];
  if (!config) return null;

  const Icon = config.icon;
  const goodPercent = metric.total_count > 0 
    ? Math.round((metric.good_count / metric.total_count) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
              <CardDescription className="text-xs">{config.label}</CardDescription>
            </div>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metric.metric, metric.p75_value)}`}>
            {config.format(metric.p75_value)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">P75 Value</span>
            <span className="font-medium">{config.format(metric.p75_value)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Average</span>
            <span className="font-medium">{config.format(metric.avg_value)}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Good experiences</span>
              <span className="font-medium text-green-500">{goodPercent}%</span>
            </div>
            <Progress value={goodPercent} className="h-1.5" />
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground">Samples</span>
            <span className="font-medium">{metric.total_count.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WebVitalsStats({ siteId, dateRange }: WebVitalsStatsProps) {
  const { metrics, byPage, isLoading } = useWebVitals(siteId, dateRange);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = metrics && metrics.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Core Web Vitals
            </CardTitle>
            <CardDescription>
              Performance metrics that impact SEO and user experience
            </CardDescription>
          </div>
          {hasData && (
            <a 
              href="https://web.dev/vitals/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Learn more →
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gauge className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No Web Vitals data collected yet</p>
            <p className="text-xs mt-1">Metrics will appear as visitors browse your site</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="by-page">By Page</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {["LCP", "CLS", "INP"].map((metricName) => {
                  const metric = metrics.find(m => m.metric === metricName);
                  if (!metric) return (
                    <Card key={metricName} className="opacity-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{metricName}</CardTitle>
                        <CardDescription className="text-xs">No data</CardDescription>
                      </CardHeader>
                    </Card>
                  );
                  return <MetricCard key={metricName} metric={metric} />;
                })}
              </div>

              {/* Score Summary */}
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                {metrics.map((metric) => {
                  const config = METRIC_CONFIG[metric.metric];
                  if (!config) return null;
                  
                  const poorPercent = Math.round((metric.poor_count / metric.total_count) * 100);
                  const needsWork = poorPercent > 10;
                  
                  return (
                    <div 
                      key={metric.metric}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                        needsWork ? "border-yellow-500/20 bg-yellow-500/5" : "border-green-500/20 bg-green-500/5"
                      }`}
                    >
                      {needsWork ? (
                        <TrendingDown className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm">
                        {needsWork 
                          ? `${poorPercent}% of ${metric.metric} experiences are poor`
                          : `${metric.metric} is performing well`
                        }
                      </span>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="by-page">
              {byPage && byPage.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">LCP</TableHead>
                      <TableHead className="text-right">CLS</TableHead>
                      <TableHead className="text-right">INP</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byPage.map((page) => (
                      <TableRow key={page.url}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {page.url}
                        </TableCell>
                        <TableCell className={`text-right ${page.lcp ? getScoreColor("LCP", page.lcp) : ""}`}>
                          {page.lcp ? `${Math.round(page.lcp)}ms` : "-"}
                        </TableCell>
                        <TableCell className={`text-right ${page.cls ? getScoreColor("CLS", page.cls) : ""}`}>
                          {page.cls !== null ? page.cls.toFixed(3) : "-"}
                        </TableCell>
                        <TableCell className={`text-right ${page.inp ? getScoreColor("INP", page.inp) : ""}`}>
                          {page.inp ? `${Math.round(page.inp)}ms` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {getScoreBadge(page.score)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No per-page data available yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
