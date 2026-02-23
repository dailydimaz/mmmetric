import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, TrendingDown, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { generateInsights, InsightEngineInput, InsightSeverity } from "@/lib/insightEngine";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightsCardProps {
    data: InsightEngineInput;
    isLoading: boolean;
}

export function InsightsCard({ data, isLoading }: InsightsCardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        AI Insights
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                </CardContent>
            </Card>
        );
    }

    const insights = generateInsights(data);

    if (insights.length === 0) {
        return null;
    }

    const getIcon = (severity: InsightSeverity) => {
        switch (severity) {
            case 'success': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'info': return <Info className="h-4 w-4 text-blue-500" />;
            default: return <Lightbulb className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getBgColor = (severity: InsightSeverity) => {
        switch (severity) {
            case 'success': return 'bg-green-500/10 border-green-500/20';
            case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
            case 'info': return 'bg-blue-500/10 border-blue-500/20';
            default: return 'bg-muted border-border';
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    AI Insights
                </CardTitle>
                <CardDescription className="text-xs">
                    Automated observations based on your selected date range.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className={`flex flex-col gap-1 p-3 rounded-lg border ${getBgColor(insight.severity)}`}
                    >
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                                {getIcon(insight.severity)}
                            </div>
                            <p className="text-sm font-medium leading-snug">
                                {insight.message}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
