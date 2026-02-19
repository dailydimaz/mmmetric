import { useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar,
} from "recharts";
import { Loader2, Users, Eye, TrendingUp, LayoutGrid } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays } from "date-fns";

interface GroupStats {
    visitors: number;
    pageviews: number;
    sessions: number;
    bounce_rate: number;
    previous: {
        visitors: number;
        pageviews: number;
        sessions: number;
        bounce_rate: number;
    } | null;
    timeseries: Array<{ date: string; visitors: number; pageviews: number }>;
    top_sites: Array<{ name: string; visitors: number; pageviews: number }>;
    top_referrers: Array<{ referrer: string; visitors: number; pageviews: number }>;
}

export default function SiteGroupDashboard() {
    const { groupId } = useParams<{ groupId: string }>();
    const [dateRange, setDateRange] = useState("7d");

    const getDateRange = () => {
        const end = new Date();
        let start: Date;
        let prevStart: Date;
        let prevEnd: Date;

        switch (dateRange) {
            case "30d":
                start = subDays(end, 30);
                prevStart = subDays(start, 30);
                prevEnd = subDays(end, 30);
                break;
            case "90d":
                start = subDays(end, 90);
                prevStart = subDays(start, 90);
                prevEnd = subDays(end, 90);
                break;
            case "today":
                start = new Date();
                start.setHours(0, 0, 0, 0);
                prevStart = subDays(start, 1);
                prevEnd = subDays(end, 1);
                break;
            default: // 7d
                start = subDays(end, 7);
                prevStart = subDays(start, 7);
                prevEnd = subDays(end, 7);
        }
        return {
            start: format(start, "yyyy-MM-dd"),
            end: format(end, "yyyy-MM-dd"),
            prevStart: format(prevStart, "yyyy-MM-dd"),
            prevEnd: format(prevEnd, "yyyy-MM-dd"),
        };
    };

    const { data: group, isLoading: groupLoading } = useQuery({
        queryKey: ["site-group", groupId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("site_groups")
                .select("*")
                .eq("id", groupId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!groupId,
    });

    const { data: stats, isLoading } = useQuery({
        queryKey: ["site-group-stats", groupId, dateRange],
        queryFn: async () => {
            const { start, end, prevStart, prevEnd } = getDateRange();
            const { data, error } = await supabase.rpc("get_site_group_stats", {
                _group_id: groupId,
                _start_date: format(start, "yyyy-MM-dd"),
                _end_date: format(end, "yyyy-MM-dd"),
                _prev_start_date: format(prevStart, "yyyy-MM-dd"),
                _prev_end_date: format(prevEnd, "yyyy-MM-dd"),
            });

            if (error) throw error;
            return data as unknown as GroupStats;
        },
        enabled: !!groupId,
    });

    const calculateGrowth = (current: number, previous: number) => {
        if (!previous) return 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const renderGrowth = (current: number, previous: number | undefined, inverse = false) => {
        if (previous === undefined || previous === null) return null;
        const growth = calculateGrowth(current, previous);
        if (growth === 0) return <span className="text-muted-foreground text-sm ml-2">0%</span>;

        const isPositive = growth > 0;
        const isGood = inverse ? !isPositive : isPositive;
        const colorClass = isGood ? "text-green-600" : "text-red-600";
        const arrow = isPositive ? "↑" : "↓";

        return (
            <span className={`${colorClass} text-sm ml-2 font-medium`}>
                {arrow} {Math.abs(growth)}%
            </span>
        );
    };

    if (groupLoading || isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
            </DashboardLayout>
        );
    }

    if (!group) return (
        <DashboardLayout>
            <div>Group not found</div>
        </DashboardLayout>
    );

    const chartData = stats?.timeseries?.map(p => ({
        date: format(new Date(p.date), 'MMM d'),
        Visitors: p.visitors,
        Pageviews: p.pageviews
    })) || [];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                        <p className="text-muted-foreground">Aggregated statistics for {group.description || "your site group"}</p>
                    </div>
                    <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.visitors.toLocaleString()}
                                {renderGrowth(stats?.visitors || 0, stats?.previous?.visitors)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pageviews</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.pageviews.toLocaleString()}
                                {renderGrowth(stats?.pageviews || 0, stats?.previous?.pageviews)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.bounce_rate}%
                                {renderGrowth(stats?.bounce_rate || 0, stats?.previous?.bounce_rate, true)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.sessions.toLocaleString()}
                                {renderGrowth(stats?.sessions || 0, stats?.previous?.sessions)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Traffic Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.timeseries}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(date) => format(new Date(date), "MMM d")}
                                            className="text-muted-foreground" tick={{ fontSize: 12 }}
                                        />
                                        <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="visitors" name="Unique Visitors" fill="hsl(var(--primary))" />
                                        <Bar dataKey="pageviews" name="Pageviews" fill="hsl(var(--muted-foreground))" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
