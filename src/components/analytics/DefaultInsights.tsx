import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Globe, Smartphone, FileText } from "lucide-react";
import { Insight } from "@/hooks/useInsights";

interface DefaultInsightsProps {
    onView: (insight: Insight) => void;
}

interface DefaultInsightConfig extends Partial<Insight> {
    icon: any;
    widgets: string[]; // Make widgets required for our defaults
    name: string;      // Make name required
}

const DEFAULT_INSIGHTS: DefaultInsightConfig[] = [
    {
        id: "default-traffic",
        name: "Traffic Overview",
        description: "Comprehensive view of your site traffic and growth trends.",
        widgets: ["visitors", "pageviews", "bounce_rate", "avg_duration", "visitor_chart"],
        filters: {},
        date_range: { preset: "30d" },
        icon: TrendingUp,
    },
    {
        id: "default-geo-device",
        name: "Geographic & Devices",
        description: "Understand where your visitors are coming from and what devices they use.",
        widgets: ["geo_stats", "device_stats"],
        filters: {},
        date_range: { preset: "30d" },
        icon: Globe,
    },
    {
        id: "default-content",
        name: "Content Performance",
        description: "Analyze your top performing pages and where traffic is coming from.",
        widgets: ["top_pages", "top_referrers", "bounce_rate"],
        filters: {},
        date_range: { preset: "30d" },
        icon: FileText,
    },
];

export function DefaultInsights({ onView }: DefaultInsightsProps) {
    const handleView = (partialInsight: DefaultInsightConfig) => {
        // Construct a full insight object from the partial default
        const fullInsight: Insight = {
            id: partialInsight.id!,
            site_id: "", // detailed view doesn't strict check this for display
            user_id: "",
            name: partialInsight.name!,
            description: partialInsight.description || null,
            filters: partialInsight.filters || {},
            date_range: partialInsight.date_range || { preset: "7d" },
            widgets: partialInsight.widgets || [],
            share_token: "",
            is_public: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        onView(fullInsight);
    };

    return (
        <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Recommended Insights</h3>
            <div className="grid gap-4 md:grid-cols-3">
                {DEFAULT_INSIGHTS.map((insight) => {
                    const Icon = insight.icon as any;
                    return (
                        <Card key={insight.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleView(insight)}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    {insight.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-xs">
                                    {insight.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                    <Badge variant="secondary" className="font-normal">
                                        {insight.widgets?.length} widgets
                                    </Badge>
                                    <span>•</span>
                                    <span>Last 30 days</span>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full text-xs h-8 gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                                >
                                    <Eye className="h-3 w-3" />
                                    View Report
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
