import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Layout } from "lucide-react";

interface DashboardCustomizerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentWidgets: Set<string> | null;
    onApply: (widgets: string[] | null) => void;
}

const ALL_WIDGETS = [
    { id: "realtime", label: "Realtime stats" },
    { id: "visitors", label: "Stats: Visitors" },
    { id: "pageviews", label: "Stats: Pageviews" },
    { id: "bounce_rate", label: "Stats: Bounce Rate" },
    { id: "avg_duration", label: "Stats: Avg Duration" },
    { id: "visitor_chart", label: "Visitor Chart" },
    { id: "top_pages", label: "Top Pages" },
    { id: "top_referrers", label: "Top Referrers" },
    { id: "funnels", label: "Funnels" },
    { id: "goals", label: "Goals" },
    { id: "retention", label: "Retention" },
    { id: "custom_events", label: "Custom Events" },
    { id: "device_stats", label: "Device Stats" },
    { id: "utm_campaigns", label: "UTM Campaigns" },
    { id: "geo_stats", label: "Geo Stats" },
    { id: "language_stats", label: "Language Stats" },
    { id: "links", label: "Outbound Links" },
];

export function DashboardCustomizer({ open, onOpenChange, currentWidgets, onApply }: DashboardCustomizerProps) {
    const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            if (currentWidgets) {
                setSelectedWidgets(Array.from(currentWidgets));
            } else {
                // If no widgets param, all are selected by default
                setSelectedWidgets(ALL_WIDGETS.map(w => w.id));
            }
        }
    }, [open, currentWidgets]);

    const toggleWidget = (id: string) => {
        setSelectedWidgets(prev =>
            prev.includes(id)
                ? prev.filter(w => w !== id)
                : [...prev, id]
        );
    };

    const handleApply = () => {
        // If all are selected, we can clear the param to keep URL clean (optional optimization)
        if (selectedWidgets.length === ALL_WIDGETS.length) {
            onApply(null);
        } else {
            onApply(selectedWidgets);
        }
        onOpenChange(false);
    };

    const handleReset = () => {
        setSelectedWidgets(ALL_WIDGETS.map(w => w.id));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5" />
                        Customize Dashboard
                    </DialogTitle>
                    <DialogDescription>
                        Select which widgets to display on this dashboard.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4 py-4">
                        {ALL_WIDGETS.map((widget) => (
                            <div key={widget.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                <Checkbox
                                    id={`widget-${widget.id}`}
                                    checked={selectedWidgets.includes(widget.id)}
                                    onCheckedChange={() => toggleWidget(widget.id)}
                                />
                                <Label
                                    htmlFor={`widget-${widget.id}`}
                                    className="flex-1 cursor-pointer font-medium"
                                >
                                    {widget.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button variant="outline" onClick={handleReset}>
                        Reset Default
                    </Button>
                    <Button onClick={handleApply}>
                        Apply Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
