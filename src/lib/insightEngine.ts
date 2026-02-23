import type {
    TimeSeriesData,
    StatsData,
    TopPage,
    TopReferrer
} from "@/hooks/useAnalytics";

export type InsightSeverity = 'success' | 'warning' | 'info';
export type InsightCategory = 'traffic' | 'engagement' | 'audience' | 'content';

export interface Insight {
    id: string;
    message: string;
    severity: InsightSeverity;
    category: InsightCategory;
}

export interface InsightEngineInput {
    timeSeries?: TimeSeriesData[];
    stats?: StatsData;
    topPages?: TopPage[];
    topReferrers?: TopReferrer[];
}

export function generateInsights(data: InsightEngineInput): Insight[] {
    const insights: Insight[] = [];

    if (!data.stats && !data.timeSeries && !data.topPages && !data.topReferrers) {
        return insights;
    }

    // 1. Traffic Trend Detection
    if (data.stats && data.stats.visitorsChange !== undefined) {
        const percentChange = data.stats.visitorsChange;

        if (percentChange > 10) {
            insights.push({
                id: 'traffic-up',
                message: `Great job! Traffic is up ${Math.round(percentChange)}% compared to the previous period.`,
                severity: 'success',
                category: 'traffic'
            });
        } else if (percentChange < -10) {
            insights.push({
                id: 'traffic-down',
                message: `Traffic has decreased by ${Math.abs(Math.round(percentChange))}%. Check for any seasonal trends or broken links.`,
                severity: 'warning',
                category: 'traffic'
            });
        }
    }

    // 2. Bounce Rate Alerts
    if (data.stats && data.stats.bounceRate !== undefined) {
        const currentBounce = data.stats.bounceRate;
        if (currentBounce > 70) {
            insights.push({
                id: 'high-bounce',
                message: `Your bounce rate is high at ${Math.round(currentBounce)}%. Consider improving page load times or content relevance.`,
                severity: 'warning',
                category: 'engagement'
            });
        } else if (currentBounce < 40 && currentBounce > 0) {
            insights.push({
                id: 'low-bounce',
                message: `Excellent engagement! Your bounce rate is notably low at ${Math.round(currentBounce)}%.`,
                severity: 'success',
                category: 'engagement'
            });
        }
    }

    // 3. Best Performing Page
    if (data.topPages && data.topPages.length > 0) {
        const bestPage = data.topPages[0];
        const totalViews = data.topPages.reduce((acc, curr) => acc + curr.pageviews, 0);
        if (totalViews > 0) {
            const pagePct = Math.round((bestPage.pageviews / totalViews) * 100);
            insights.push({
                id: 'best-page',
                message: `"${bestPage.url}" is your most popular page, accounting for ${pagePct}% of total pageviews.`,
                severity: 'info',
                category: 'content'
            });
        }
    }

    // 4. Top Referrer Analysis
    if (data.topReferrers && data.topReferrers.length > 0) {
        const bestReferrer = data.topReferrers[0];
        if (bestReferrer.source !== 'Direct') {
            insights.push({
                id: 'top-referrer',
                message: `${bestReferrer.source} is your top external traffic source with ${bestReferrer.visitors} visitors.`,
                severity: 'info',
                category: 'audience'
            });
        }
    }

    // 5. Day of Week Patterns
    if (data.timeSeries && data.timeSeries.length >= 7) {
        const dayTotals = new Array(7).fill(0);
        data.timeSeries.forEach(point => {
            const date = new Date(point.date);
            const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...
            dayTotals[dayOfWeek] += point.visitors;
        });

        const maxVisitors = Math.max(...dayTotals);
        if (maxVisitors > 0) {
            const bestDayIndex = dayTotals.indexOf(maxVisitors);
            const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
            const bestDayName = dayNames[bestDayIndex];

            // Only show this insight if there's a clear winner (e.g. at least 20% more than average)
            const averageVisitors = dayTotals.reduce((a, b) => a + b, 0) / 7;
            if (maxVisitors > averageVisitors * 1.2) {
                insights.push({
                    id: 'best-day',
                    message: `${bestDayName} tend to be your busiest days for traffic.`,
                    severity: 'info',
                    category: 'traffic'
                });
            }
        }
    }

    // Ensure we don't overwhelm with too many insights
    return insights.slice(0, 5);
}
