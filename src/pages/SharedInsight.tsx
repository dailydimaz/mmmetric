import { useParams } from "react-router-dom";
import { useSharedInsight, InsightDateRange, InsightFilters } from "@/hooks/useInsights";
import {
  useAnalyticsStats,
  useAnalyticsTimeSeries,
  useTopPages,
  useTopReferrers,
  useGeoStats,
  useCityStats,
  useDeviceStats,
  DateRange,
  AnalyticsFilter,
} from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCards, TopPages, TopReferrers, GeoStats, DeviceStats, VisitorChart } from "@/components/analytics";
import { BarChart3, Lock, Calendar } from "lucide-react";

function getDateRangePreset(dateRange: InsightDateRange): DateRange {
  if (dateRange.preset) {
    switch (dateRange.preset) {
      case "24h":
        return "today";
      case "7d":
        return "7d";
      case "30d":
        return "30d";
      case "90d":
        return "90d";
      default:
        return "7d";
    }
  }
  return "7d";
}

function getDateRangeLabel(dateRange: InsightDateRange): string {
  if (dateRange.preset) {
    const labels: Record<string, string> = {
      "24h": "Last 24 hours",
      "7d": "Last 7 days",
      "30d": "Last 30 days",
      "90d": "Last 90 days",
      "12m": "Last 12 months",
    };
    return labels[dateRange.preset] || dateRange.preset;
  }
  if (dateRange.startDate && dateRange.endDate) {
    return `${dateRange.startDate} to ${dateRange.endDate}`;
  }
  return "Custom range";
}

function filtersToAnalyticsFilter(filters: InsightFilters): AnalyticsFilter {
  return {
    country: filters.country,
    browser: filters.browser,
    os: filters.os,
    device: filters.device,
    url: filters.url,
    referrerPattern: filters.referrerPattern,
  };
}

export default function SharedInsight() {
  const { token } = useParams<{ token: string }>();
  const { data: insight, isLoading, error } = useSharedInsight(token);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Insight Not Found</h2>
            <p className="text-muted-foreground">
              This insight doesn't exist or is not publicly shared.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dateRangePreset = getDateRangePreset(insight.date_range);
  const dateRangeLabel = getDateRangeLabel(insight.date_range);
  const analyticsFilters = filtersToAnalyticsFilter(insight.filters);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <BarChart3 className="h-6 w-6" />
                  {insight.name}
                </CardTitle>
                {insight.description && (
                  <p className="text-muted-foreground mt-1">{insight.description}</p>
                )}
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dateRangeLabel}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <SharedInsightContent
          siteId={insight.site_id}
          dateRange={dateRangePreset}
          filters={analyticsFilters}
          widgets={insight.widgets}
        />
      </div>
    </div>
  );
}

function SharedInsightContent({
  siteId,
  dateRange,
  filters,
  widgets,
}: {
  siteId: string;
  dateRange: DateRange;
  filters: AnalyticsFilter;
  widgets: string[];
}) {
  const { data: stats, isLoading: statsLoading } = useAnalyticsStats({ siteId, dateRange, filters });
  const { data: timeseries, isLoading: timeseriesLoading } = useAnalyticsTimeSeries({ siteId, dateRange, filters });
  const { data: topPages, isLoading: pagesLoading } = useTopPages({ siteId, dateRange, filters });
  const { data: topReferrers, isLoading: referrersLoading } = useTopReferrers({ siteId, dateRange, filters });
  const { data: geoStats, isLoading: geoLoading } = useGeoStats({ siteId, dateRange, filters });
  const { data: cityStats, isLoading: citiesLoading } = useCityStats({ siteId, dateRange, filters });
  const { data: deviceStats, isLoading: devicesLoading } = useDeviceStats({ siteId, dateRange, filters });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {(widgets.includes("visitors") ||
        widgets.includes("pageviews") ||
        widgets.includes("bounce_rate") ||
        widgets.includes("avg_duration")) && (
        <StatsCards stats={stats} isLoading={statsLoading} />
      )}

      {/* Visitor Chart */}
      {widgets.includes("visitor_chart") && (
        <VisitorChart data={timeseries} isLoading={timeseriesLoading} />
      )}

      {/* Top Pages & Referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {widgets.includes("top_pages") && (
          <TopPages pages={topPages} isLoading={pagesLoading} />
        )}
        {widgets.includes("top_referrers") && (
          <TopReferrers referrers={topReferrers} isLoading={referrersLoading} />
        )}
      </div>

      {/* Geo & Device Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {widgets.includes("geo_stats") && (
          <GeoStats countries={geoStats} cities={cityStats} isLoading={geoLoading || citiesLoading} />
        )}
        {widgets.includes("device_stats") && (
          <DeviceStats
            browsers={deviceStats?.browsers}
            operatingSystems={deviceStats?.operatingSystems}
            devices={deviceStats?.devices}
            isLoading={devicesLoading}
          />
        )}
      </div>
    </div>
  );
}
