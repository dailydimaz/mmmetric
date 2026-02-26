import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "@/hooks/useAnalytics";

export interface FormStats {
    formId: string;
    views: number;
    submissions: number;
    abandons: number;
    conversionRate: number;
}

interface UseFormAnalyticsProps {
    siteId: string;
    dateRange: DateRange;
}

export function useFormAnalytics({ siteId, dateRange }: UseFormAnalyticsProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["form-analytics", siteId, dateRange],
        queryFn: async (): Promise<FormStats[]> => {
            const { data, error } = await supabase.rpc("get_form_analytics_stats", {
                _site_id: siteId,
                _start_date: start.toISOString(),
                _end_date: end.toISOString(),
            });

            if (error) throw error;

            return (data || []).map((row: any) => ({
                formId: row.form_id,
                views: Number(row.starts) || 0,
                submissions: Number(row.submissions) || 0,
                abandons: Number(row.abandons) || 0,
                conversionRate: Number(row.conversion_rate) || 0,
            }));
        },
        enabled: !!siteId,
    });
}
