import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bug, AlertTriangle, FileCode, Clock, ExternalLink } from "lucide-react";
import { useErrorTracking, ErrorGroup } from "@/hooks/useErrorTracking";
import type { DateRange } from "@/hooks/useAnalytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ErrorTrackingStatsProps {
  siteId: string;
  dateRange: DateRange;
}

function StatCard({ label, value, icon: Icon, variant = "default" }: {
  label: string;
  value: string | number;
  icon: typeof Bug;
  variant?: "default" | "warning" | "success";
}) {
  const variantStyles = {
    default: "bg-muted/50",
    warning: "bg-yellow-500/10 text-yellow-600",
    success: "bg-green-500/10 text-green-600",
  };

  return (
    <div className={`p-4 rounded-lg ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ErrorRow({ error }: { error: ErrorGroup }) {
  const isRecent = new Date(error.last_seen).getTime() > Date.now() - 3600000; // Last hour

  return (
    <AccordionItem value={`${error.message}-${error.filename}`} className="border-b last:border-b-0">
      <AccordionTrigger className="hover:no-underline px-4 py-3">
        <div className="flex items-start gap-3 text-left w-full">
          <div className={`p-1.5 rounded-md mt-0.5 ${
            error.count > 10 ? "bg-red-500/10" : "bg-yellow-500/10"
          }`}>
            <Bug className={`h-4 w-4 ${
              error.count > 10 ? "text-red-500" : "text-yellow-500"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate max-w-[400px]">
                {error.message}
              </p>
              {isRecent && (
                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
                  Recent
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {error.filename && (
                <span className="flex items-center gap-1">
                  <FileCode className="h-3 w-3" />
                  {error.filename}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(error.last_seen), { addSuffix: true })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {error.count}x
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-3 pl-10">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Error Type</p>
              <Badge variant="outline">{error.type}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">First Seen</p>
              <p>{formatDistanceToNow(new Date(error.first_seen), { addSuffix: true })}</p>
            </div>
          </div>
          
          <div>
            <p className="text-muted-foreground text-xs mb-2">
              Affected Pages ({error.affected_urls.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {error.affected_urls.slice(0, 5).map((url) => (
                <Badge key={url} variant="outline" className="font-mono text-xs">
                  {url}
                </Badge>
              ))}
              {error.affected_urls.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{error.affected_urls.length - 5} more
                </Badge>
              )}
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-muted-foreground text-xs mb-1">Full Message</p>
            <code className="text-xs bg-muted p-2 rounded block break-all">
              {error.message}
            </code>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function ErrorTrackingStats({ siteId, dateRange }: ErrorTrackingStatsProps) {
  const { errors, stats, isLoading } = useErrorTracking(siteId, dateRange);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Error Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasErrors = errors && errors.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Error Tracking
            </CardTitle>
            <CardDescription>
              Privacy-first JavaScript error monitoring
            </CardDescription>
          </div>
          {hasErrors && stats && stats.error_rate > 10 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    High Error Rate
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.error_rate} errors per 1,000 pageviews</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasErrors ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bug className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-green-600">No errors detected! 🎉</p>
            <p className="text-xs mt-1">JavaScript errors will appear here when they occur</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Errors"
                value={stats?.total_errors || 0}
                icon={Bug}
                variant={stats && stats.total_errors > 100 ? "warning" : "default"}
              />
              <StatCard
                label="Unique Errors"
                value={stats?.unique_errors || 0}
                icon={AlertTriangle}
              />
              <StatCard
                label="Affected Pages"
                value={stats?.affected_pages || 0}
                icon={FileCode}
              />
              <StatCard
                label="Error Rate"
                value={`${stats?.error_rate || 0}/1k`}
                icon={ExternalLink}
                variant={stats && stats.error_rate < 5 ? "success" : stats && stats.error_rate > 20 ? "warning" : "default"}
              />
            </div>

            {/* Error List */}
            <div>
              <h4 className="text-sm font-medium mb-3">Error Groups</h4>
              <div className="border rounded-lg">
                <Accordion type="single" collapsible className="w-full">
                  {errors.slice(0, 20).map((error, index) => (
                    <ErrorRow key={`${error.message}-${index}`} error={error} />
                  ))}
                </Accordion>
              </div>
              {errors.length > 20 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Showing top 20 of {errors.length} error groups
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
