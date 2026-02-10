import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, ShieldCheck } from "lucide-react";
import { useAnomalyDetection } from "@/hooks/useAnomalyDetection";
import { TimeSeriesData, DateRange } from "@/hooks/useAnalytics";
import { Anomaly, AnomalySeverity } from "@/lib/anomalyDetection";
import { useState } from "react";

interface AnomalyDetectionStatsProps {
  timeSeries: TimeSeriesData[] | undefined;
  dateRange: DateRange;
  isLoading: boolean;
}

const severityColors: Record<AnomalySeverity, string> = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  low: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
};

const severityLabels: Record<AnomalySeverity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  const isSpike = anomaly.type === "spike";
  const formattedDate = new Date(anomaly.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="shrink-0">
        {isSpike ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-destructive" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{formattedDate}</span>
          <Badge variant="outline" className={severityColors[anomaly.severity]}>
            {severityLabels[anomaly.severity]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isSpike ? "Spike" : "Drop"} of{" "}
          <span className="font-medium">
            {anomaly.deviation > 0 ? "+" : ""}
            {anomaly.deviation}%
          </span>{" "}
          from expected ({anomaly.expected.toLocaleString()}) → actual ({anomaly.value.toLocaleString()})
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          Detected by: {anomaly.methods.join(", ")} · Confidence: {Math.round(anomaly.confidence * 100)}%
        </p>
      </div>
    </div>
  );
}

export function AnomalyDetectionStats({
  timeSeries,
  dateRange,
  isLoading,
}: AnomalyDetectionStatsProps) {
  const [metric, setMetric] = useState<"pageviews" | "visitors">("pageviews");
  const result = useAnomalyDetection({ timeSeries, dateRange, metric });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnomalies = result && result.anomalies.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Anomaly Detection</CardTitle>
          {result && (
            <Badge variant="secondary" className="ml-1">
              {result.summary.totalAnomalies} found
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMetric("pageviews")}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              metric === "pageviews"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Pageviews
          </button>
          <button
            onClick={() => setMetric("visitors")}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              metric === "visitors"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Visitors
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        {result && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{result.summary.spikes}</p>
              <p className="text-xs text-muted-foreground">Spikes</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{result.summary.drops}</p>
              <p className="text-xs text-muted-foreground">Drops</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-destructive">{result.summary.highSeverity}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{(result.summary.overallVolatility * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Volatility</p>
            </div>
          </div>
        )}

        {/* Anomaly list */}
        {hasAnomalies ? (
          <div className="space-y-1 max-h-[320px] overflow-y-auto">
            {result.anomalies.slice(0, 10).map((anomaly, i) => (
              <AnomalyRow key={`${anomaly.date}-${i}`} anomaly={anomaly} />
            ))}
            {result.anomalies.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{result.anomalies.length - 10} more anomalies detected
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ShieldCheck className="h-10 w-10 mb-2 text-green-500" />
            <p className="text-sm font-medium">No anomalies detected</p>
            <p className="text-xs mt-1">
              Traffic patterns look normal for this period
            </p>
          </div>
        )}

        {/* Methods legend */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Using Z-Score, IQR, Moving Average & Seasonal analysis for detection
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
