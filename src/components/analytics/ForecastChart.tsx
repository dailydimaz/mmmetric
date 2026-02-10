import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Brain, Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeSeriesData, DateRange } from "@/hooks/useAnalytics";
import { useForecast } from "@/hooks/useForecast";
import { format, parseISO } from "date-fns";

interface ForecastChartProps {
  timeSeries: TimeSeriesData[] | undefined;
  dateRange: DateRange;
  isLoading: boolean;
}

export function ForecastChart({ timeSeries, dateRange, isLoading }: ForecastChartProps) {
  const [metric, setMetric] = useState<"pageviews" | "visitors">("pageviews");
  const forecast = useForecast({ timeSeries, dateRange, metric });

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Brain className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">Predictive Forecast</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-[350px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!timeSeries || timeSeries.length < 3 || !forecast) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Brain className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold">Predictive Forecast</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12 text-muted-foreground text-sm">
            Need at least 3 days of data to generate forecasts.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build combined chart data: historical + forecast
  const historicalData = timeSeries.map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    rawDate: d.date,
    actual: d[metric],
    predicted: null as number | null,
    lower: null as number | null,
    upper: null as number | null,
    isForecast: false,
  }));

  // Overlap: last historical point becomes first forecast anchor
  const lastHistorical = historicalData[historicalData.length - 1];

  const forecastData = forecast.forecast.map((f) => ({
    date: format(parseISO(f.date), "MMM d"),
    rawDate: f.date,
    actual: null as number | null,
    predicted: f.predicted,
    lower: f.lower,
    upper: f.upper,
    isForecast: true,
  }));

  // Bridge point: connect historical to forecast
  const bridgePoint = {
    ...lastHistorical,
    predicted: lastHistorical.actual,
    lower: lastHistorical.actual,
    upper: lastHistorical.actual,
  };

  const chartData = [
    ...historicalData.slice(0, -1),
    bridgePoint,
    ...forecastData,
  ];

  const TrendIcon =
    forecast.trend === "up" ? TrendingUp
    : forecast.trend === "down" ? TrendingDown
    : Minus;

  const trendColor =
    forecast.trend === "up" ? "text-green-500"
    : forecast.trend === "down" ? "text-destructive"
    : "text-muted-foreground";

  const confidenceLabel =
    forecast.confidence > 0.7 ? "High"
    : forecast.confidence > 0.4 ? "Medium"
    : "Low";

  const confidenceVariant =
    forecast.confidence > 0.7 ? "default"
    : forecast.confidence > 0.4 ? "secondary"
    : "outline";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <motion.div
              className="p-2 bg-primary/10 rounded-lg text-primary"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Brain className="h-4 w-4" />
            </motion.div>
            <CardTitle className="text-base font-semibold">Predictive Forecast</CardTitle>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={metric} onValueChange={(v) => setMetric(v as "pageviews" | "visitors")}>
              <TabsList className="h-8">
                <TabsTrigger value="pageviews" className="text-xs px-2 h-6">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Pageviews
                </TabsTrigger>
                <TabsTrigger value="visitors" className="text-xs px-2 h-6">
                  <Calendar className="h-3 w-3 mr-1" />
                  Visitors
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              <div>
                <p className="text-xs text-muted-foreground">Trend</p>
                <p className={`text-sm font-semibold capitalize ${trendColor}`}>
                  {forecast.trend}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Daily Growth</p>
                <p className="text-sm font-semibold">
                  {forecast.avgGrowthRate > 0 ? "+" : ""}
                  {forecast.avgGrowthRate.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Seasonality</p>
                <p className="text-sm font-semibold">
                  {forecast.seasonalityDetected ? "Detected" : "None"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <Badge variant={confidenceVariant as any} className="text-xs">
                  {confidenceLabel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12, opacity: 0.6 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12, opacity: 0.6 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 40px -10px rgb(0 0 0 / 0.2)",
                    color: "hsl(var(--foreground))",
                    padding: "12px 16px",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number | null, name: string) => {
                    if (value === null) return ["-", name];
                    return [value.toLocaleString(), name];
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />

                {/* Confidence band (upper) */}
                <Area
                  type="monotone"
                  dataKey="upper"
                  name="Upper Bound"
                  stroke="none"
                  fillOpacity={1}
                  fill="url(#colorConfidence)"
                  animationDuration={800}
                  dot={false}
                  connectNulls={false}
                />

                {/* Confidence band (lower) — invisible filler */}
                <Area
                  type="monotone"
                  dataKey="lower"
                  name="Lower Bound"
                  stroke="hsl(var(--chart-4))"
                  strokeDasharray="2 4"
                  strokeOpacity={0.3}
                  fillOpacity={0}
                  animationDuration={800}
                  dot={false}
                  connectNulls={false}
                />

                {/* Actual historical */}
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorActual)"
                  strokeWidth={2.5}
                  animationDuration={1000}
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 2,
                    stroke: "hsl(var(--background))",
                    fill: "hsl(var(--primary))",
                  }}
                  connectNulls={false}
                />

                {/* Forecast line */}
                <Area
                  type="monotone"
                  dataKey="predicted"
                  name="Forecast"
                  stroke="hsl(var(--chart-4))"
                  strokeDasharray="6 3"
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                  strokeWidth={2.5}
                  animationDuration={1000}
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 2,
                    stroke: "hsl(var(--background))",
                    fill: "hsl(var(--chart-4))",
                  }}
                  connectNulls={false}
                />

                {/* Divider line between historical and forecast */}
                <ReferenceLine
                  x={bridgePoint.date}
                  stroke="hsl(var(--border))"
                  strokeDasharray="4 4"
                  label={{
                    value: "Today",
                    position: "top",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Forecasts are generated using local statistical models (linear regression + seasonal decomposition). No external AI API is used.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
