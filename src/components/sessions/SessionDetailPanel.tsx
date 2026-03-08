import { format } from "date-fns";
import { X, Globe, Monitor, Smartphone, Clock, ExternalLink, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessionDetail } from "@/hooks/useSessions";

interface SessionDetailPanelProps {
  siteId: string;
  sessionId: string;
  onClose: () => void;
}

export function SessionDetailPanel({ siteId, sessionId, onClose }: SessionDetailPanelProps) {
  const { data: detail, isLoading } = useSessionDetail(siteId, sessionId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Session not found
        </CardContent>
      </Card>
    );
  }

  const meta = detail.metadata;
  const identify = detail.identify;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Session Detail</CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {identify?.custom_id && (
            <MetaItem label="User ID" value={identify.custom_id} />
          )}
          <MetaItem label="Country" value={meta.country || "Unknown"} icon={<Globe className="h-3 w-3" />} />
          {meta.city && <MetaItem label="City" value={meta.city} />}
          <MetaItem label="Browser" value={meta.browser || "Unknown"} icon={<Monitor className="h-3 w-3" />} />
          <MetaItem label="OS" value={meta.os || "Unknown"} />
          <MetaItem label="Device" value={meta.device_type || "Unknown"} icon={<Smartphone className="h-3 w-3" />} />
          <MetaItem label="Duration" value={formatDuration(meta.duration_seconds)} icon={<Clock className="h-3 w-3" />} />
          <MetaItem label="Events" value={String(meta.total_events)} />
          <MetaItem label="Pageviews" value={String(meta.pageviews)} />
          {meta.language && <MetaItem label="Language" value={meta.language} />}
        </div>

        {/* Custom Properties */}
        {identify?.data && Object.keys(identify.data).length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Custom Properties
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(identify.data).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-[11px] font-mono">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Event Timeline */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Activity Timeline
          </h4>
          <ScrollArea className="h-[500px]">
            <div className="space-y-0.5">
              {detail.events.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded hover:bg-accent/30 transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${getEventColor(event.event_name)}`} />
                    {index < detail.events.length - 1 && (
                      <div className="w-px h-full bg-border min-h-[20px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={event.event_name === "pageview" ? "default" : "secondary"} className="text-[10px]">
                        {event.event_name}
                      </Badge>
                      {event.tag && (
                        <Badge variant="outline" className="text-[10px]">
                          <Tag className="h-2.5 w-2.5 mr-0.5" />
                          {event.tag}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {format(new Date(event.created_at), "HH:mm:ss")}
                      </span>
                    </div>
                    {event.url && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{event.title || event.url}</span>
                      </div>
                    )}
                    {event.properties && Object.keys(event.properties).length > 0 && event.event_name !== "pageview" && (
                      <div className="text-[11px] text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1 mt-1">
                        {JSON.stringify(event.properties, null, 0).substring(0, 200)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function MetaItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium flex items-center gap-1">
        {icon} {value}
      </p>
    </div>
  );
}

function getEventColor(eventName: string): string {
  switch (eventName) {
    case "pageview": return "bg-primary";
    case "engagement": return "bg-green-500";
    case "outbound": return "bg-blue-500";
    case "scroll_depth": return "bg-amber-500";
    case "identify": return "bg-purple-500";
    case "form_start": case "form_submit": return "bg-cyan-500";
    case "form_abandon": return "bg-red-500";
    case "js_error": return "bg-destructive";
    default: return "bg-muted-foreground";
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
