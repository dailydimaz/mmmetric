import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContentTracking } from "@/hooks/useContentTracking";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { MousePointerClick, Eye, Percent } from "lucide-react";

interface ContentTrackingStatsProps {
  siteId: string;
  dateRange: DateRange;
}

export function ContentTrackingStats({ siteId, dateRange }: ContentTrackingStatsProps) {
  const { data, isLoading } = useContentTracking(siteId, dateRange);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" /> Content Tracking
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const items = data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MousePointerClick className="h-4 w-4" /> Content Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No content tracking data yet. Add <code className="text-xs bg-muted px-1 py-0.5 rounded">data-track-content</code> attributes to elements.
          </p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground pb-2 border-b">
              <span>Content</span>
              <span className="text-right flex items-center justify-end gap-1"><Eye className="h-3 w-3" /> Impressions</span>
              <span className="text-right flex items-center justify-end gap-1"><MousePointerClick className="h-3 w-3" /> Clicks</span>
              <span className="text-right flex items-center justify-end gap-1"><Percent className="h-3 w-3" /> CTR</span>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-4 py-2 text-sm border-b border-border/50 last:border-0">
                <div className="truncate">
                  <span className="font-medium">{item.content_name}</span>
                  {item.content_piece && (
                    <span className="block text-xs text-muted-foreground truncate">{item.content_piece}</span>
                  )}
                </div>
                <span className="text-right tabular-nums">{item.impressions.toLocaleString()}</span>
                <span className="text-right tabular-nums">{item.interactions.toLocaleString()}</span>
                <span className="text-right tabular-nums font-medium">{item.ctr}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
