import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

import {
    LayoutDashboard,
    Magnet,
    FileText,
    Users,
    MousePointerClick,
    Target,
    Monitor,
    Twitter,
    Flame,
    Video
} from "lucide-react";
import {
    StatsCards,
    VisitorChart,
    TopPages,
    TopReferrers,
    DeviceStats,
    GeoStats,
    LanguageStats,
    UTMStats,
    RealtimeStats,
    RealtimeActivityFeed,
    CustomEvents,
    GoalsCard,
    RetentionCard,
    FunnelList,
    OutboundLinksStats,
    FileDownloadsStats,
    ScrollDepthStats,
    EngagementStats,
    EntryExitStats,
    FormStats,
    TwitterStats,
    HeatmapView,
    WebVitalsStats,
    ErrorTrackingStats,
    SiteSearchStats,
    ReadingDepthStats,
    SocialShareStats,
    VideoAnalyticsStats,
    ContentDecayAlerts,
    ForecastChart,
    AnomalyDetectionStats,
    SessionRecordingsList,
    InsightsCard,
    BenchmarkCard,
    CustomPropertiesBreakdown,
} from "@/components/analytics";
import { isSelfHosted } from "@/lib/billing";
import type { ChartInterval } from "@/components/analytics/IntervalSelector";
import {
    AnalyticsFilter,
    DateRange,
    StatsData,
    TimeSeriesData,
    TopPage,
    TopReferrer,
    DeviceStat,
    GeoStat,
    CityStat,
    LanguageStat,
    UTMStats as UTMStatsType
} from "@/hooks/useAnalytics";
import { Site } from "@/hooks/useSites";

// Props definition
interface SiteAnalyticsProps {
    site: Site;
    dateRange: DateRange;
    filters: AnalyticsFilter;
    // Data props passed down to avoid re-fetching
    stats: StatsData | undefined;
    statsLoading: boolean;
    timeSeries: TimeSeriesData[] | undefined;
    timeSeriesLoading: boolean;
    topPages: TopPage[] | undefined;
    pagesLoading: boolean;
    topReferrers: TopReferrer[] | undefined;
    referrersLoading: boolean;
    deviceStats: {
        browsers: DeviceStat[];
        operatingSystems: DeviceStat[];
        devices: DeviceStat[];
    } | undefined;
    devicesLoading: boolean;
    geoStats: GeoStat[] | undefined;
    cityStats: CityStat[] | undefined;
    geoLoading: boolean;
    citiesLoading: boolean;
    languageStats: LanguageStat[] | undefined;
    languagesLoading: boolean;
    utmStats: UTMStatsType | undefined;
    utmLoading: boolean;

    // UX State
    showComparison: boolean;
    visibleWidgets: Set<string> | null;
    chartInterval?: ChartInterval;
    onChartIntervalChange?: (interval: ChartInterval) => void;

    // Handlers
    onBreakdown: (dimension: any, value: string) => void;
    onCreateGoal: () => void;
}

export function SiteAnalytics({
    site,
    dateRange,
    stats,
    statsLoading,
    timeSeries,
    timeSeriesLoading,
    topPages,
    pagesLoading,
    topReferrers,
    referrersLoading,
    deviceStats,
    devicesLoading,
    geoStats,
    cityStats,
    geoLoading,
    citiesLoading,
    languageStats,
    languagesLoading,
    utmStats,
    utmLoading,
    showComparison,
    visibleWidgets,
    chartInterval,
    onChartIntervalChange,
    onBreakdown,
    onCreateGoal
}: SiteAnalyticsProps) {



    // Progressive Disclosure State
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Advanced Tabs check - any data present?
    const hasFormsData = false; // We would ideally check the actual formStats data if passed down
    const hasEcommerceData = false;
    const hasCustomEvents = false;

    // A tab is visible if:
    // 1. It is a core tab (always visible)
    // 2. The user has explicitly toggled 'show advanced'
    // 3. Or it has context-aware data that necessitates showing it
    const isAdvancedVisible = showAdvanced || hasFormsData || hasEcommerceData || hasCustomEvents;

    const shouldShow = (widgetKey: string) => {
        // If the user has explicitly configured widgets, respect that
        if (visibleWidgets && visibleWidgets.size > 0) {
            return visibleWidgets.has(widgetKey);
        }

        // Default Progressive Disclosure: Hide non-core widgets if advanced is not shown
        const advancedWidgets = ['realtime', 'insights', 'anomaly_detection', 'forecast', 'benchmarks', 'utm_campaigns', 'entry_exit', 'site_search', 'links', 'downloads', 'content_decay', 'top_referrers'];
        if (!showAdvanced && advancedWidgets.includes(widgetKey)) {
            return false;
        }

        // Core widgets shown by default
        const coreWidgets = ['visitors', 'pageviews', 'bounce_rate', 'avg_duration', 'views_per_visit', 'visitor_chart', 'top_pages', 'geo_stats', 'language_stats', 'device_stats', 'retention'];
        if (coreWidgets.includes(widgetKey)) return true;

        return showAdvanced;
    };

    return (
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
                <TabsTrigger value="overview" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Overview
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Content
                </TabsTrigger>
                <TabsTrigger value="audience" className="gap-2">
                    <Users className="h-4 w-4" />
                    Audience
                </TabsTrigger>
                {isAdvancedVisible && (
                    <>
                        <TabsTrigger value="acquisition" className="gap-2">
                            <Magnet className="h-4 w-4" />
                            Acquisition
                        </TabsTrigger>
                        <TabsTrigger value="engagement" className="gap-2">
                            <MousePointerClick className="h-4 w-4" />
                            Engagement
                        </TabsTrigger>
                        <TabsTrigger value="conversions" className="gap-2">
                            <Target className="h-4 w-4" />
                            Conversions
                        </TabsTrigger>
                        <TabsTrigger value="tech" className="gap-2">
                            <Monitor className="h-4 w-4" />
                            Tech
                        </TabsTrigger>
                        <TabsTrigger value="twitter" className="gap-2">
                            <Twitter className="h-4 w-4" />
                            X / Twitter
                        </TabsTrigger>
                        <TabsTrigger value="heatmap" className="gap-2">
                            <Flame className="h-4 w-4" />
                            Heatmap
                        </TabsTrigger>
                        {isSelfHosted() && (
                            <TabsTrigger value="recordings" className="gap-2">
                                <Video className="h-4 w-4" />
                                Recordings
                            </TabsTrigger>
                        )}
                    </>
                )}
            </TabsList>

            <div className="flex items-center justify-end space-x-2 pb-2">
                <Switch
                    id="advanced-mode"
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                />
                <label
                    htmlFor="advanced-mode"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                >
                    Show advanced analytics
                </label>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 animate-fade-in-up">
                {shouldShow('realtime') && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <RealtimeStats siteId={site.id} />
                        <RealtimeActivityFeed siteId={site.id} />
                    </div>
                )}

                {(shouldShow('visitors') || shouldShow('pageviews') || shouldShow('bounce_rate') || shouldShow('avg_duration') || shouldShow('views_per_visit')) && (
                    <StatsCards
                        stats={stats}
                        isLoading={statsLoading}
                        visibleMetrics={visibleWidgets ? Array.from(visibleWidgets) : undefined}
                        showComparison={showComparison}
                    />
                )}

                {shouldShow('insights') && (
                    <InsightsCard
                        data={{
                            stats,
                            timeSeries,
                            topPages,
                            topReferrers
                        }}
                        isLoading={statsLoading || timeSeriesLoading || pagesLoading || referrersLoading}
                    />
                )}

                {shouldShow('benchmarks') && (
                    <BenchmarkCard
                        siteId={site.id}
                        category={site.category}
                        stats={stats}
                        isLoading={statsLoading}
                    />
                )}

                {shouldShow('visitor_chart') && (
                    <VisitorChart siteId={site.id} data={timeSeries} isLoading={timeSeriesLoading} showComparison={showComparison} dateRange={dateRange} interval={chartInterval} onIntervalChange={onChartIntervalChange} />
                )}

                {shouldShow('forecast') && (
                    <ForecastChart timeSeries={timeSeries} dateRange={dateRange} isLoading={timeSeriesLoading} />
                )}

                {shouldShow('anomaly_detection') && (
                    <AnomalyDetectionStats
                        timeSeries={timeSeries}
                        dateRange={dateRange}
                        isLoading={timeSeriesLoading}
                    />
                )}
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6 animate-fade-in-up">
                <div className="grid gap-6 lg:grid-cols-2">
                    {shouldShow('top_pages') && (
                        <TopPages
                            pages={topPages}
                            isLoading={pagesLoading}
                            onBreakdown={(url) => onBreakdown('url', url)}
                            className="col-span-full lg:col-span-2"
                        />
                    )}
                    {shouldShow('entry_exit') && <EntryExitStats siteId={site.id} dateRange={dateRange} />}
                </div>

                {shouldShow('site_search') && <SiteSearchStats siteId={site.id} dateRange={dateRange} />}

                <div className="grid gap-6 lg:grid-cols-2">
                    {shouldShow('links') && <OutboundLinksStats siteId={site.id} dateRange={dateRange} />}
                    {shouldShow('downloads') && <FileDownloadsStats siteId={site.id} dateRange={dateRange} />}
                </div>

                {shouldShow('content_decay') && <ContentDecayAlerts siteId={site.id} />}
            </TabsContent>

            {/* Audience Tab */}
            <TabsContent value="audience" className="space-y-6 animate-fade-in-up">
                <div className="grid gap-6 lg:grid-cols-2">
                    {shouldShow('geo_stats') && (
                        <GeoStats
                            countries={geoStats}
                            cities={cityStats}
                            isLoading={geoLoading || citiesLoading}
                            onBreakdown={(country) => onBreakdown('country', country)}
                        />
                    )}
                    {shouldShow('language_stats') && (
                        <LanguageStats
                            languages={languageStats}
                            isLoading={languagesLoading}
                        />
                    )}
                </div>

                {shouldShow('device_stats') && (
                    <DeviceStats
                        browsers={deviceStats?.browsers}
                        operatingSystems={deviceStats?.operatingSystems}
                        devices={deviceStats?.devices}
                        isLoading={devicesLoading}
                        onBreakdown={(type, value) => onBreakdown(type, value)}
                    />
                )}

                {shouldShow('retention') && <RetentionCard siteId={site.id} dateRange={dateRange} />}
            </TabsContent>

            {/* Advanced Tabs Context Wrapper */}
            {isAdvancedVisible && (
                <>
                    {/* Acquisition Tab */}
                    <TabsContent value="acquisition" className="space-y-6 animate-fade-in-up">
                        {shouldShow('top_referrers') && (
                            <TopReferrers
                                referrers={topReferrers}
                                isLoading={referrersLoading}
                                onBreakdown={(ref) => onBreakdown('referrer', ref)}
                            />
                        )}
                        {shouldShow('utm_campaigns') && <UTMStats utmStats={utmStats} isLoading={utmLoading} />}
                    </TabsContent>

                    {/* Engagement Tab */}
                    <TabsContent value="engagement" className="space-y-6 animate-fade-in-up">
                        {shouldShow('engagement') && <EngagementStats siteId={site.id} dateRange={dateRange} />}

                        <div className="grid gap-6 lg:grid-cols-2">
                            {shouldShow('scroll_depth') && <ScrollDepthStats siteId={site.id} dateRange={dateRange} />}
                            {shouldShow('reading_depth') && <ReadingDepthStats siteId={site.id} dateRange={dateRange} />}
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {shouldShow('social_shares') && <SocialShareStats siteId={site.id} dateRange={dateRange} />}
                            {shouldShow('video_analytics') && <VideoAnalyticsStats siteId={site.id} dateRange={dateRange} />}
                        </div>
                    </TabsContent>

                    {/* Conversions Tab */}
                    <TabsContent value="conversions" className="space-y-6 animate-fade-in-up">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {shouldShow('goals') && (
                                <GoalsCard
                                    siteId={site.id}
                                    dateRange={dateRange}
                                    onCreateGoal={onCreateGoal}
                                />
                            )}
                            {shouldShow('custom_events') && <CustomEvents siteId={site.id} dateRange={dateRange} />}
                        </div>

                        {shouldShow('funnels') && <FunnelList siteId={site.id} />}
                        {shouldShow('forms') && <FormStats siteId={site.id} dateRange={dateRange} />}
                        {shouldShow('custom_properties') && <CustomPropertiesBreakdown siteId={site.id} dateRange={dateRange} />}
                    </TabsContent>

                    {/* Tech Tab */}
                    <TabsContent value="tech" className="space-y-6 animate-fade-in-up">
                        {shouldShow('web_vitals') && <WebVitalsStats siteId={site.id} dateRange={dateRange} />}
                        {shouldShow('error_tracking') && <ErrorTrackingStats siteId={site.id} dateRange={dateRange} />}
                    </TabsContent>

                    {/* Existing Separate Tabs */}
                    <TabsContent value="twitter" className="animate-fade-in-up">
                        <TwitterStats siteId={site.id} dateRange={dateRange} />
                    </TabsContent>

                    <TabsContent value="heatmap" className="animate-fade-in-up">
                        <HeatmapView siteId={site.id} />
                    </TabsContent>

                    {isSelfHosted() && (
                        <TabsContent value="recordings" className="animate-fade-in-up">
                            <SessionRecordingsList siteId={site.id} />
                        </TabsContent>
                    )}
                </>
            )}
        </Tabs>
    );
}
