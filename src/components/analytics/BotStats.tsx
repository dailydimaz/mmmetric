import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBotStats } from "@/hooks/useBotStats";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot } from "lucide-react";
import { format } from "date-fns";

interface BotStatsProps {
  siteId: string;
  dateRange: DateRange;
}

export function BotStats({ siteId, dateRange }: BotStatsProps) {
  const { data, isLoading } = useBotStats(siteId, dateRange);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" /> Bot / Crawler Traffic
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const bots = data || [];
  const totalHits = bots.reduce((sum, b) => sum + b.hit_count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2"><Bot className="h-4 w-4" /> Bot / Crawler Traffic</span>
          <span className="text-xs font-normal text-muted-foreground">{totalHits.toLocaleString()} total hits</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No bot traffic detected.</p>
        ) : (
          <div className="space-y-1">
            {bots.map((bot, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm border-b border-border/50 last:border-0">
                <span className="font-medium">{bot.bot_name}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="tabular-nums">{bot.hit_count.toLocaleString()} hits</span>
                  <span className="text-xs">{format(new Date(bot.last_seen), "MMM d")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
