import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRowEvolution } from "@/hooks/useRowEvolution";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RowEvolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  dateRange: DateRange;
  dimension: string;
  value: string;
  label?: string;
}

export function RowEvolutionDialog({
  open,
  onOpenChange,
  siteId,
  dateRange,
  dimension,
  value,
  label,
}: RowEvolutionDialogProps) {
  const [metric, setMetric] = useState("pageviews");

  const { data, isLoading } = useRowEvolution({
    siteId,
    dateRange,
    dimension,
    value,
    metric,
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Row Evolution: <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{label || value}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pageviews">Pageviews</SelectItem>
              <SelectItem value="visitors">Visitors</SelectItem>
              <SelectItem value="sessions">Sessions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }}
                labelFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              />
              <Line
                type="monotone"
                dataKey="metric_value"
                name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}
