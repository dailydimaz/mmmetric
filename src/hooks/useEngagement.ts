import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "@/hooks/useAnalytics";

export interface EngagementData {
    url: string;
    avgDuration: number;
    totalDuration: number;
    visits: number;
}

interface UseEngagementProps {
    siteId: string;
    dateRange: DateRange;
}

export function useEngagement({ siteId, dateRange }: UseEngagementProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["engagement", siteId, dateRange],
        queryFn: async (): Promise<EngagementData[]> => {
            const { data, error } = await supabase.rpc("get_engagement_stats", {
                _site_id: siteId,
                _start_date: start.toISOString(),
                _end_date: end.toISOString(),
                _limit: 10,
            });

            if (error) throw error;

            return (data || []).map((row: any) => ({
                url: row.url,
                avgDuration: Number(row.avg_duration) || 0,
                totalDuration: Number(row.total_duration) || 0,
                visits: Number(row.visits) || 0,
            }));
        },
        enabled: !!siteId,
    });
}
