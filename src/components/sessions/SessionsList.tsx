import { format } from "date-fns";
import { Globe, Monitor, Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/hooks/useSessions";

interface SessionsListProps {
  sessions: SessionSummary[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
}

export function SessionsList({
  sessions,
  total,
  page,
  onPageChange,
  isLoading,
  selectedSessionId,
  onSelectSession,
}: SessionsListProps) {
  const totalPages = Math.ceil(total / 50);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{total.toLocaleString()} Sessions</CardTitle>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-1">
                {page}/{totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No sessions found for this period
          </p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.session_id}
              onClick={() => onSelectSession(session.session_id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all hover:bg-accent/50",
                selectedSessionId === session.session_id
                  ? "border-primary bg-accent/30 shadow-sm"
                  : "border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    {session.custom_id && (
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {session.custom_id}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      {session.session_id.substring(0, 12)}…
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {session.country && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {session.country}
                      </span>
                    )}
                    {session.browser && (
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" /> {session.browser}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {session.pageviews} pages
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDuration(session.duration_seconds)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {format(new Date(session.first_activity), "HH:mm")}
                </span>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
