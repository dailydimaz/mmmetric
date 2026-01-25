import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Link,
  Globe,
  Lock,
  Search,
  BarChart3,
} from "lucide-react";
import { useInsights, Insight } from "@/hooks/useInsights";
import { format } from "date-fns";
import { toast } from "sonner";

interface InsightsListProps {
  siteId: string;
  onCreateNew: () => void;
  onView: (insight: Insight) => void;
  onEdit: (insight: Insight) => void;
}

import { DefaultInsights } from "./DefaultInsights";

export function InsightsList({ siteId, onCreateNew, onView, onEdit }: InsightsListProps) {
  const { insights, isLoading, deleteInsight, togglePublic } = useInsights(siteId);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredInsights = insights?.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const copyShareUrl = (insight: Insight) => {
    const url = `${window.location.origin}/insight/${insight.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Share URL copied to clipboard");
  };

  const getDateRangeLabel = (dateRange: Insight["date_range"]) => {
    if (dateRange.preset) {
      const presets: Record<string, string> = {
        "24h": "Last 24 hours",
        "7d": "Last 7 days",
        "30d": "Last 30 days",
        "90d": "Last 90 days",
        "12m": "Last 12 months",
      };
      return presets[dateRange.preset] || dateRange.preset;
    }
    if (dateRange.startDate && dateRange.endDate) {
      return `${dateRange.startDate} - ${dateRange.endDate}`;
    }
    return "Custom";
  };

  const getFilterCount = (filters: Insight["filters"]) => {
    return Object.values(filters).filter((v) => v).length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <DefaultInsights onView={onView} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Saved Insights
          </CardTitle>
          <Button onClick={onCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Insight
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search insights..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredInsights?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No insights yet</p>
              <p className="text-sm mt-1">Create your first custom report</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInsights?.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{insight.name}</h4>
                      {insight.is_public ? (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{getDateRangeLabel(insight.date_range)}</span>
                      {getFilterCount(insight.filters) > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {getFilterCount(insight.filters)} filter(s)
                        </Badge>
                      )}
                      <span>
                        Updated {format(new Date(insight.updated_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onView(insight)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(insight)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyShareUrl(insight)}>
                          <Link className="h-4 w-4 mr-2" />
                          Copy Share URL
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            togglePublic.mutate({
                              id: insight.id,
                              isPublic: !insight.is_public,
                            })
                          }
                        >
                          {insight.is_public ? (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Make Private
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4 mr-2" />
                              Make Public
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(insight.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Insight?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the insight and its
              share URL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteInsight.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
