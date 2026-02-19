import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ExperimentStats {
    variant_id: string;
    variant_name: string;
    is_control: boolean;
    visitors: number;
    conversions: number;
    conversion_rate: number;
    uplift: number;
}

export function ExperimentResults({ experimentId }: { experimentId: string }) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["experiment_stats", experimentId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_experiment_stats", {
                _experiment_id: experimentId,
            });

            if (error) throw error;
            return data as ExperimentStats[];
        },
        // Refresh every minute
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm">Loading results...</span>
            </div>
        );
    }

    if (!stats || stats.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                <p className="text-sm">No data available yet.</p>
                <p className="text-xs mt-1">Wait for visitors to be exposed to this experiment.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead className="text-right">Visitors</TableHead>
                        <TableHead className="text-right">Conversions</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Uplift</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.map((stat) => (
                        <TableRow key={stat.variant_id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{stat.variant_name}</span>
                                    {stat.is_control && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                            Control
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">{stat.visitors}</TableCell>
                            <TableCell className="text-right">{stat.conversions}</TableCell>
                            <TableCell className="text-right font-medium">
                                {stat.conversion_rate}%
                            </TableCell>
                            <TableCell className="text-right">
                                {stat.is_control ? (
                                    <span className="text-muted-foreground text-xs">—</span>
                                ) : (
                                    <div
                                        className={`flex items-center justify-end gap-1 text-xs font-medium ${stat.uplift > 0
                                                ? "text-green-600"
                                                : stat.uplift < 0
                                                    ? "text-red-600"
                                                    : "text-muted-foreground"
                                            }`}
                                    >
                                        {stat.uplift > 0 ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : stat.uplift < 0 ? (
                                            <TrendingDown className="h-3 w-3" />
                                        ) : (
                                            <Minus className="h-3 w-3" />
                                        )}
                                        {stat.uplift > 0 ? "+" : ""}
                                        {stat.uplift}%
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
