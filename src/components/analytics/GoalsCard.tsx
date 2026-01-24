import { useState } from "react";
import { Target, TrendingUp, Plus, Trash2, DollarSign } from "lucide-react";
import { useGoalStats, useDeleteGoal, GoalStats } from "@/hooks/useGoals";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { useToast } from "@/hooks/use-toast";

interface GoalsCardProps {
  siteId: string;
  dateRange: DateRange;
  onCreateGoal: () => void;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function GoalRow({ goalStats, onDelete }: { goalStats: GoalStats; onDelete: () => void }) {
  const hasRevenue = goalStats.goal.revenue_property && goalStats.totalRevenue > 0;
  const hasTarget = goalStats.goal.target_value && goalStats.goal.target_value > 0;
  const progressPercent = hasTarget 
    ? Math.min((goalStats.totalRevenue / goalStats.goal.target_value!) * 100, 100)
    : 0;

  return (
    <div className="p-4 bg-muted/50 rounded-lg group border border-transparent hover:border-border transition-all duration-200 hover:shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{goalStats.goal.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="bg-muted px-1.5 py-0.5 rounded">{goalStats.goal.event_name}</span>
            {goalStats.goal.url_match && (
              <>
                <span>•</span>
                <span className="truncate">{goalStats.goal.url_match}</span>
              </>
            )}
            {goalStats.goal.revenue_property && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <DollarSign className="h-3 w-3" />
                  {goalStats.goal.revenue_property}
                </span>
              </>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-2xl font-bold">{goalStats.conversions.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">conversions</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-2xl font-bold">{goalStats.conversionRate.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-muted-foreground">conversion rate</p>
        </div>
        {hasRevenue && (
          <>
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(goalStats.totalRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">total revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(goalStats.averageOrderValue)}
              </p>
              <p className="text-xs text-muted-foreground">avg. order value</p>
            </div>
          </>
        )}
      </div>

      {hasTarget && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Target Progress</span>
            <span className="font-medium">
              {formatCurrency(goalStats.totalRevenue)} / {formatCurrency(goalStats.goal.target_value!)}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {progressPercent.toFixed(1)}% of monthly target
          </p>
        </div>
      )}
    </div>
  );
}

export function GoalsCard({ siteId, dateRange, onCreateGoal }: GoalsCardProps) {
  const { data: goalStats, isLoading } = useGoalStats({ siteId, dateRange });
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();
  const [goalToDelete, setGoalToDelete] = useState<{ id: string; name: string } | null>(null);

  const confirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      await deleteGoal.mutateAsync({ id: goalToDelete.id, siteId });
      toast({
        title: "Goal deleted",
        description: `"${goalToDelete.name}" has been removed.`,
      });
      setGoalToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal.",
        variant: "destructive",
      });
    }
  };

  // Calculate totals for summary
  const totalConversions = goalStats?.reduce((sum, s) => sum + s.conversions, 0) || 0;
  const totalRevenue = goalStats?.reduce((sum, s) => sum + s.totalRevenue, 0) || 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Goals & Conversions</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onCreateGoal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          {goalStats && goalStats.length > 0 && (
            <div className="flex items-center gap-6 mb-4 pb-4 border-b">
              <div>
                <p className="text-3xl font-bold">{totalConversions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">total conversions</p>
              </div>
              {totalRevenue > 0 && (
                <div>
                  <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground">total revenue</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))
            ) : goalStats && goalStats.length > 0 ? (
              goalStats.map((stats) => (
                <GoalRow
                  key={stats.goal.id}
                  goalStats={stats}
                  onDelete={() => setGoalToDelete({ id: stats.goal.id, name: stats.goal.name })}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Track conversions and revenue by creating goals
                </p>
                <Button size="sm" onClick={onCreateGoal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Goal
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete goal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">"{goalToDelete?.name}"</span>?
              This will stop tracking conversions for this goal. Historic data will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
