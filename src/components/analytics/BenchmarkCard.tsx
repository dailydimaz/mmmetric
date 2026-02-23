import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useBenchmarks, INDUSTRY_CATEGORIES, IndustryCategory } from "@/hooks/useBenchmarks";
import { StatsData } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSites } from "@/hooks/useSites";

interface BenchmarkCardProps {
    siteId: string;
    category: string | null;
    stats: StatsData | undefined;
    isLoading: boolean;
}

export function BenchmarkCard({ siteId, category, stats, isLoading }: BenchmarkCardProps) {
    const { updateSite } = useSites();
    const { data: benchmarkList, isLoading: benchmarkLoading } = useBenchmarks(category);

    const onCategoryChange = (val: string) => {
        updateSite.mutate({ id: siteId, category: val as IndustryCategory });
    };

    if (isLoading || benchmarkLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Industry Benchmarks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    if (!stats) return null;

    const myPagesPerSession = stats.uniqueVisitors > 0 ? (stats.totalPageviews / stats.uniqueVisitors) : 0;

    // Normalize data for Radar Chart
    const chartData = [
        {
            subject: 'Bounce Rate',
            A: stats.bounceRate,
            B: benchmarkList?.bounceRate || 0,
            fullMark: 100,
            inverse: true // Lower is better
        },
        {
            subject: 'Avg Duration',
            A: stats.avgSessionDuration,
            B: benchmarkList?.avgSessionDuration || 0,
            fullMark: 300,
        },
        {
            subject: 'Pages/Visit',
            A: myPagesPerSession,
            B: benchmarkList?.pagesPerSession || 0,
            fullMark: 10,
        }
    ];

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-base font-semibold">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Target className="h-4 w-4" />
                    </div>
                    Industry Benchmarks
                </div>
                <div className="w-40">
                    <Select value={category || 'Other'} onValueChange={onCategoryChange}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Industry" />
                        </SelectTrigger>
                        <SelectContent>
                            {INDUSTRY_CATEGORIES.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                            <Radar name="Your Site" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                            <Radar name="Industry Avg" dataKey="B" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.3} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-muted-foreground w-2/5">Metric</th>
                                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">You</th>
                                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Industry</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {chartData.map((row) => {
                                    const diff = row.A - row.B;
                                    const isPositive = row.inverse ? diff < 0 : diff > 0;
                                    const percentDiff = row.B > 0 ? Math.abs((diff / row.B) * 100) : 0;

                                    const formatVal = (val: number, isTime: boolean) => isTime ? `${Math.round(val)}s` : val.toFixed(1);

                                    return (
                                        <tr key={row.subject} className="bg-card">
                                            <td className="px-4 py-3 font-medium">{row.subject}</td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                {formatVal(row.A, row.subject === 'Avg Duration')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">
                                                <div className="flex items-center justify-end gap-2">
                                                    {formatVal(row.B, row.subject === 'Avg Duration')}
                                                    {percentDiff > 5 && (
                                                        <span className={`text-[10px] flex items-center gap-0.5 ${isPositive ? 'text-green-500' : 'text-amber-500'}`}>
                                                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
