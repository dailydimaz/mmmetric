import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSites } from "@/hooks/useSites";
import { useJourneys } from "@/hooks/useJourneys";
import { DateRange } from "@/hooks/useAnalytics";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { JourneyFlow } from "@/components/analytics/JourneyFlow";
import {
  JourneyStatsCards,
  PageList,
  TopPathsList,
} from "@/components/analytics/JourneyStats";
import { ArrowLeft, Route, LogIn, LogOut } from "lucide-react";

export default function Journeys() {
  const navigate = useNavigate();
  const { siteId: siteIdParam } = useParams<{ siteId: string }>();
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const { sites } = useSites();

  // Get the first available site if no siteId provided
  const siteId = siteIdParam || sites[0]?.id;
  const site = sites.find((s) => s.id === siteId);

  const { data: journeyData, isLoading } = useJourneys({
    siteId: siteId || "",
    dateRange,
  });

  // Redirect to dashboard if no site ID in URL
  if (!siteIdParam && sites.length > 0) {
    navigate(`/dashboard/sites/${sites[0].id}/journeys`, { replace: true });
    return null;
  }

  if (!siteId || !site) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Route className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No site selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a site to view user journeys.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/sites/${siteId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Journeys</h1>
              <p className="text-muted-foreground">{site.name}</p>
            </div>
          </div>

          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Stats */}
        <JourneyStatsCards stats={journeyData?.stats || null} isLoading={isLoading} />

        {/* Flow Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Navigation Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JourneyFlow
              transitions={journeyData?.transitions || []}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Entry & Exit Pages */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-green-500" />
                Entry Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PageList
                title="Entry Pages"
                icon={LogIn}
                iconColor="text-green-500"
                pages={journeyData?.entryPages || []}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-orange-500" />
                Exit Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PageList
                title="Exit Pages"
                icon={LogOut}
                iconColor="text-orange-500"
                pages={journeyData?.exitPages || []}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Top Paths */}
        <Card>
          <CardHeader>
            <CardTitle>Most Common Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <TopPathsList paths={journeyData?.topPaths || []} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Journey Analysis Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Entry pages show where users start their sessions</li>
              <li>• Exit pages indicate where users leave your site</li>
              <li>• High-flow transitions reveal popular navigation patterns</li>
              <li>• Use common paths to optimize user experience and conversions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
