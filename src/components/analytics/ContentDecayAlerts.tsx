import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useContentDecayMonitors,
  useCheckContentDecay,
  useSetupContentDecayMonitors,
  useAddContentDecayMonitor,
  useDeleteContentDecayMonitor,
  useUpdateContentDecayMonitor,
} from "@/hooks/useContentDecay";
import { formatDistanceToNow } from "date-fns";

interface ContentDecayAlertsProps {
  siteId: string;
}

export function ContentDecayAlerts({ siteId }: ContentDecayAlertsProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newThreshold, setNewThreshold] = useState("30");
  const [autoSetupThreshold, setAutoSetupThreshold] = useState("30");
  const [autoSetupCount, setAutoSetupCount] = useState("10");

  const { data: monitors, isLoading: monitorsLoading } = useContentDecayMonitors(siteId);
  const { data: decayCheck, isLoading: checkLoading, refetch } = useCheckContentDecay(siteId);
  const setupMutation = useSetupContentDecayMonitors();
  const addMutation = useAddContentDecayMonitor();
  const deleteMutation = useDeleteContentDecayMonitor();
  const updateMutation = useUpdateContentDecayMonitor();

  const isLoading = monitorsLoading || checkLoading;

  // Merge monitor data with decay check results
  const monitorStatus = monitors?.map((monitor) => {
    const check = decayCheck?.find((c) => c.monitor_id === monitor.id);
    return {
      ...monitor,
      current_pageviews: check?.current_pageviews ?? 0,
      decay_percent: check?.decay_percent ?? 0,
      is_decaying: check?.is_decaying ?? false,
    };
  });

  const decayingCount = monitorStatus?.filter((m) => m.is_decaying).length ?? 0;
  const healthyCount = monitorStatus?.filter((m) => !m.is_decaying && m.is_enabled).length ?? 0;

  const handleAutoSetup = () => {
    setupMutation.mutate({
      siteId,
      topN: parseInt(autoSetupCount),
      threshold: parseInt(autoSetupThreshold),
    });
  };

  const handleAddMonitor = () => {
    if (!newUrl.trim()) return;
    addMutation.mutate(
      {
        siteId,
        url: newUrl.startsWith("/") ? newUrl : `/${newUrl}`,
        threshold: parseInt(newThreshold),
      },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          setNewUrl("");
        },
      }
    );
  };

  const getStatusBadge = (isDecaying: boolean, decayPercent: number, isEnabled: boolean) => {
    if (!isEnabled) {
      return <Badge variant="outline">Paused</Badge>;
    }
    if (isDecaying) {
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingDown className="h-3 w-3" />
          -{decayPercent}%
        </Badge>
      );
    }
    if (decayPercent > 0) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          -{decayPercent}%
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle className="h-3 w-3" />
        Healthy
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Content Decay Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Content Decay Alerts
            </CardTitle>
            <CardDescription>
              Get notified when high-performing pages start declining
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Page
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Monitor a Page</DialogTitle>
                  <DialogDescription>
                    Add a specific page URL to monitor for traffic decline.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Page URL</Label>
                    <Input
                      placeholder="/blog/my-article"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Alert Threshold</Label>
                    <Select value={newThreshold} onValueChange={setNewThreshold}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20% decline</SelectItem>
                        <SelectItem value="30">30% decline</SelectItem>
                        <SelectItem value="40">40% decline</SelectItem>
                        <SelectItem value="50">50% decline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddMonitor} disabled={addMutation.isPending}>
                    {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Monitor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{monitors?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">Monitored Pages</div>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
            <div className="text-xs text-muted-foreground">Healthy</div>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{decayingCount}</div>
            <div className="text-xs text-muted-foreground">Declining</div>
          </div>
        </div>

        {/* Auto-setup if no monitors */}
        {(!monitors || monitors.length === 0) && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-medium mb-2">Auto-detect Top Pages</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Automatically set up monitoring for your best-performing pages based on the last 30 days.
            </p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Top</Label>
                <Select value={autoSetupCount} onValueChange={setAutoSetupCount}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
                <Label className="text-sm">pages</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Alert at</Label>
                <Select value={autoSetupThreshold} onValueChange={setAutoSetupThreshold}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
                <Label className="text-sm">decline</Label>
              </div>
            </div>
            <Button onClick={handleAutoSetup} disabled={setupMutation.isPending}>
              {setupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2 h-4 w-4" />
              Set Up Monitoring
            </Button>
          </div>
        )}

        {/* Monitor List */}
        {monitorStatus && monitorStatus.length > 0 && (
          <div className="space-y-3">
            {monitorStatus.map((monitor) => (
              <div
                key={monitor.id}
                className={`p-4 rounded-lg border transition-colors ${
                  monitor.is_decaying
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border bg-muted/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate" title={monitor.url}>
                        {monitor.url}
                      </span>
                      {getStatusBadge(monitor.is_decaying, monitor.decay_percent, monitor.is_enabled)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Baseline: {monitor.baseline_pageviews.toLocaleString()} views
                      </span>
                      <span>
                        Current: {monitor.current_pageviews.toLocaleString()} views (7d)
                      </span>
                      <span>Threshold: {monitor.decay_threshold_percent}%</span>
                    </div>
                    {monitor.decay_percent > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Traffic change</span>
                          <span className={monitor.is_decaying ? "text-red-500" : ""}>
                            -{monitor.decay_percent}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(100, monitor.decay_percent)}
                          className={`h-1.5 ${monitor.is_decaying ? "[&>div]:bg-red-500" : ""}`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={monitor.is_enabled}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({
                          id: monitor.id,
                          siteId,
                          updates: { is_enabled: checked },
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate({ id: monitor.id, siteId })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Re-baseline button */}
        {monitors && monitors.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoSetup}
              disabled={setupMutation.isPending}
            >
              {setupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Baselines
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Update baseline metrics using the last 30 days of data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
