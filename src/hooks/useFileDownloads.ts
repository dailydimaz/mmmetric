import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, getDateRangeFilter } from "@/hooks/useAnalytics";

export interface FileDownload {
    filename: string;
    extension: string;
    href: string;
    count: number;
}

interface UseFileDownloadsProps {
    siteId: string;
    dateRange: DateRange;
}

export function useFileDownloads({ siteId, dateRange }: UseFileDownloadsProps) {
    const { start, end } = getDateRangeFilter(dateRange);

    return useQuery({
        queryKey: ["file-downloads", siteId, dateRange],
        queryFn: async (): Promise<FileDownload[]> => {
            const { data, error } = await supabase.rpc("get_file_download_stats", {
                _site_id: siteId,
                _start_date: start.toISOString(),
                _end_date: end.toISOString(),
                _limit: 10,
            });

            if (error) throw error;

            return (data || []).map((row: any) => ({
                filename: row.filename,
                extension: row.extension,
                href: row.href,
                count: Number(row.download_count) || 0,
            }));
        },
        enabled: !!siteId,
    });
}
