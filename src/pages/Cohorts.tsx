
import { useParams } from "react-router-dom";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRetentionCohorts, DateRange } from "@/hooks/useAnalytics";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { Users, Loader2, Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Cohorts() {
    const { siteId } = useParams();
    const [dateRange, setDateRange] = useState<DateRange>("30d");

    const { data: retentionData, isLoading } = useRetentionCohorts({
        siteId: siteId || "",
        dateRange,
    });

    const getRetentionColor = (rate: number) => {
        if (rate >= 50) return "bg-emerald-500 text-white";
        if (rate >= 25) return "bg-emerald-400 text-white";
        if (rate >= 10) return "bg-emerald-300 text-emerald-900";
        if (rate > 0) return "bg-emerald-200 text-emerald-900";
        return "bg-slate-100 dark:bg-slate-800 text-slate-400";
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Retention Cohorts</h1>
                        <p className="text-muted-foreground">
                            Visualize user retention over time by cohort.
                        </p>
                    </div>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : retentionData ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Retention Matrix
                                    </CardTitle>
                                    <CardDescription>
                                        Percentage of users returning after their first visit
                                    </CardDescription>
                                </div>
                                {/* Legend */}
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-emerald-200 rounded"></div>
                                        <span>&lt;10%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-emerald-300 rounded"></div>
                                        <span>10-25%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                                        <span>25-50%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                                        <span>&gt;50%</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr>
                                            <th className="text-left font-medium p-2 min-w-[120px]">Cohort</th>
                                            <th className="text-left font-medium p-2">Users</th>
                                            <th className="text-center font-medium p-2">Day 1</th>
                                            <th className="text-center font-medium p-2">Day 3</th>
                                            <th className="text-center font-medium p-2">Day 7</th>
                                            <th className="text-center font-medium p-2">Day 14</th>
                                            <th className="text-center font-medium p-2">Day 30</th>
                                        </tr>
                                        {/* Average Row */}
                                        <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                                            <td className="p-2 font-semibold text-muted-foreground">Average</td>
                                            <td className="p-2"></td>
                                            {[1, 3, 7, 14, 30].map((day) => {
                                                const avg = retentionData.summary.find(s => s.day === day)?.average_rate || 0;
                                                return (
                                                    <td key={`avg-${day}`} className="p-2 text-center">
                                                        <div className={`mx-auto w-12 py-1 rounded text-xs font-medium ${getRetentionColor(avg)}`}>
                                                            {avg}%
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {retentionData.cohorts.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                    No cohort data available for this period.
                                                </td>
                                            </tr>
                                        ) : (
                                            retentionData.cohorts.map((cohort) => (
                                                <tr key={cohort.cohort_date}>
                                                    <td className="p-2 font-medium">
                                                        {new Date(cohort.cohort_date).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="p-2 text-muted-foreground">
                                                        {cohort.cohort_size.toLocaleString()}
                                                    </td>
                                                    {[1, 3, 7, 14, 30].map((day) => {
                                                        const dayData = cohort.retention.find(r => r.day === day);
                                                        const rate = dayData?.rate || 0;
                                                        const retained = dayData?.retained || 0;

                                                        // If cohort date + day is in future, don't show 0, show empty or dash
                                                        const futureDate = new Date(cohort.cohort_date);
                                                        futureDate.setDate(futureDate.getDate() + day);
                                                        const isFuture = futureDate > new Date();

                                                        if (isFuture) {
                                                            return <td key={day} className="p-2 text-center text-muted-foreground/30">-</td>;
                                                        }

                                                        return (
                                                            <td key={day} className="p-2 text-center">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className={`mx-auto w-12 py-1 rounded text-xs font-medium cursor-help ${getRetentionColor(rate)}`}>
                                                                                {rate}%
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{retained} users retained</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
