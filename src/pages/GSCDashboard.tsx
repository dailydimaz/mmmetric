import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, Search, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function GSCDashboard() {
    const { siteId } = useParams();
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState("30d");

    // Fetch GSC stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ["gsc-stats", siteId, dateRange],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("gsc_stats")
                .select("*")
                .eq("site_id", siteId)
                .order("date", { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!siteId,
    });

    // Aggregate data for charts and summary
    const summary = stats?.reduce(
        (acc, curr) => {
            acc.clicks += curr.clicks;
            acc.impressions += curr.impressions;
            acc.ctr += curr.ctr;
            acc.position += curr.position;
            return acc;
        },
        { clicks: 0, impressions: 0, ctr: 0, position: 0 }
    );

    const avgCtr = summary ? (summary.ctr / (stats?.length || 1)) : 0;
    const avgPosition = summary ? (summary.position / (stats?.length || 1)) : 0;

    // Process data for chart (group by date)
    const chartData = stats?.reduce((acc: any[], curr) => {
        const existing = acc.find((d) => d.date === curr.date);
        if (existing) {
            existing.clicks += curr.clicks;
            existing.impressions += curr.impressions;
        } else {
            acc.push({ date: curr.date, clicks: curr.clicks, impressions: curr.impressions });
        }
        return acc;
    }, []);

    // Top keywords
    const { data: keywords, isLoading: keywordsLoading } = useQuery({
        queryKey: ["gsc-keywords", siteId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("gsc_stats")
                .select("keyword, clicks, impressions, ctr, position")
                .eq("site_id", siteId)
                .order("clicks", { ascending: false }) // Simplified for demo, usually aggregated
                .limit(10);

            if (error) throw error;
            return data;
        },
        enabled: !!siteId
    });

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/sites/${siteId}/integrations`)}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Search Console</h1>
                            <p className="text-muted-foreground">Organic search performance</p>
                        </div>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Open GSC
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary?.clicks.toLocaleString() ?? 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Impressions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary?.impressions.toLocaleString() ?? 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg CTR</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgCtr.toFixed(2)}%</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Position</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgPosition.toFixed(1)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Performance Over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {isLoading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="clicks"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorClicks)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Keywords Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Keyword</TableHead>
                                    <TableHead className="text-right">Clicks</TableHead>
                                    <TableHead className="text-right">Impressions</TableHead>
                                    <TableHead className="text-right">CTR</TableHead>
                                    <TableHead className="text-right">Position</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keywordsLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : keywords?.map((k) => (
                                    <TableRow key={k.keyword}>
                                        <TableCell className="font-medium">{k.keyword}</TableCell>
                                        <TableCell className="text-right">{k.clicks.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{k.impressions.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{k.ctr}%</TableCell>
                                        <TableCell className="text-right">{k.position.toFixed(1)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
