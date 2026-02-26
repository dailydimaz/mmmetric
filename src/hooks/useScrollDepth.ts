import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "@/hooks/useAnalytics";

export interface ScrollDepthData {
    url: string;
    averageDepth: number;
    distribution: {
        depth: number;
        count: number;
        percentage: number;
    }[];
}

interface UseScrollDepthProps {
    siteId: string;
    dateRange: DateRange;
}

export function useScrollDepth({ siteId, dateRange }: UseScrollDepthProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["scroll-depth", siteId, dateRange],
        queryFn: async (): Promise<ScrollDepthData[]> => {
            const { data, error } = await supabase.rpc("get_scroll_depth_stats", {
                _site_id: siteId,
                _start_date: start.toISOString(),
                _end_date: end.toISOString(),
                _limit: 5,
            });

            if (error) throw error;

            const pages = (data as any[]) || [];

            return pages.map((page: any) => {
                const milestones = page.milestones || {};
                const totalEvents = Number(page.total_events) || 0;

                const distribution = [25, 50, 75, 90, 100].map(depth => {
                    const count = Number(milestones[String(depth)]) || 0;
                    return {
                        depth,
                        count,
                        percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0,
                    };
                });

                let weightedSum = 0;
                distribution.forEach(d => {
                    weightedSum += d.depth * d.count;
                });
                const averageDepth = totalEvents > 0 ? weightedSum / totalEvents : 0;

                return {
                    url: page.url,
                    averageDepth,
                    distribution,
                };
            });
        },
        enabled: !!siteId,
    });
}
