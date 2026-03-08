import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVisitorProfile } from "@/hooks/useVisitorProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Monitor,
  Clock,
  FileText,
  Eye,
  MapPin,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface VisitorProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  visitorId: string;
}

export function VisitorProfileDialog({
  open,
  onOpenChange,
  siteId,
  visitorId,
}: VisitorProfileDialogProps) {
  const { data, isLoading } = useVisitorProfile(siteId, visitorId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Visitor Profile
            <Badge variant="outline" className="font-mono text-xs">{visitorId.slice(0, 12)}…</Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !data?.summary ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data found for this visitor.</p>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatItem icon={Eye} label="Pageviews" value={data.summary.total_pageviews} />
                <StatItem icon={FileText} label="Sessions" value={data.summary.total_sessions} />
                <StatItem icon={Globe} label="Unique Pages" value={data.summary.unique_pages} />
                <StatItem icon={Monitor} label="Device" value={`${data.summary.browser || "?"} / ${data.summary.os || "?"}`} />
                <StatItem icon={MapPin} label="Location" value={[data.summary.city, data.summary.country].filter(Boolean).join(", ") || "Unknown"} />
                <StatItem icon={Calendar} label="First Seen" value={data.summary.first_seen ? format(new Date(data.summary.first_seen), "MMM d, yyyy") : "—"} />
              </div>

              <Separator />

              {/* Sessions Timeline */}
              <div>
                <h3 className="text-sm font-medium mb-3">Sessions ({data.sessions?.length || 0})</h3>
                <div className="space-y-3">
                  {(data.sessions || []).slice(0, 20).map((session, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(session.started_at), "MMM d, HH:mm")}
                        </span>
                        <Badge variant="secondary" className="text-xs">{session.page_count} pages</Badge>
                      </div>
                      {session.pages && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {session.pages.slice(0, 5).map((page, j) => (
                            <Badge key={j} variant="outline" className="text-xs font-mono truncate max-w-[200px]">
                              {page}
                            </Badge>
                          ))}
                          {session.pages.length > 5 && (
                            <Badge variant="outline" className="text-xs">+{session.pages.length - 5}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Recent Events */}
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Events</h3>
                <div className="space-y-1">
                  {(data.recent_events || []).slice(0, 30).map((event, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 text-sm border-b border-border/50 last:border-0">
                      <Badge variant="secondary" className="text-xs shrink-0">{event.event_name}</Badge>
                      <span className="font-mono text-xs text-muted-foreground truncate">{event.url || "—"}</span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {format(new Date(event.created_at), "HH:mm:ss")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{typeof value === "number" ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
}
