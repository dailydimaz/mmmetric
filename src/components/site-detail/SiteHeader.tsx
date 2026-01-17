import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    ExportButton,
    FilterBar,
    DateRangePicker,
} from "@/components/analytics";
import { AnalyticsFilter, DateRange } from "@/hooks/useAnalytics";
import { Site } from "@/hooks/useSites";

interface SiteHeaderProps {
    site: Site;
    isEditing: boolean;
    editName: string;
    editDomain: string;
    showComparison: boolean;
    filters: AnalyticsFilter;
    dateRange: DateRange;
    isUpdating: boolean;
    onNavigateBack: () => void;
    onSetIsEditing: (val: boolean) => void;
    onSetEditName: (val: string) => void;
    onSetEditDomain: (val: string) => void;
    onSave: () => void;
    onToggleComparison: (val: boolean) => void;
    onSetFilters: (val: AnalyticsFilter) => void;
    onSetDateRange: (val: DateRange) => void;
    onToggleSettings: () => void;
    onToggleCustomizer: () => void;
}

export function SiteHeader({
    site,
    isEditing,
    editName,
    editDomain,
    showComparison,
    filters,
    dateRange,
    isUpdating,
    onNavigateBack,
    onSetIsEditing,
    onSetEditName,
    onSetEditDomain,
    onSave,
    onToggleComparison,
    onSetFilters,
    onSetDateRange,
    onToggleSettings,
    onToggleCustomizer,
}: SiteHeaderProps) {

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 shrink-0"
                    onClick={onNavigateBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                className="text-2xl font-bold w-full max-w-xs h-auto py-1 px-2"
                                value={editName}
                                onChange={(e) => onSetEditName(e.target.value)}
                                autoFocus
                            />
                        </div>
                    ) : (
                        <h1 className="text-2xl font-bold tracking-tight truncate">{site.name}</h1>
                    )}
                    <div className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Globe className="h-4 w-4 shrink-0" />
                        {isEditing ? (
                            <Input
                                type="text"
                                className="h-7 text-sm py-1 px-2 w-[200px]"
                                value={editDomain}
                                onChange={(e) => onSetEditDomain(e.target.value)}
                                placeholder="example.com"
                            />
                        ) : (
                            <span className="truncate">{site.domain || "No domain set"}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
                <ExportButton siteId={site.id} siteName={site.name} dateRange={dateRange} />
                <div className="flex items-center space-x-2 px-2">
                    <Switch
                        id="comparison-mode"
                        checked={showComparison}
                        onCheckedChange={onToggleComparison}
                    />
                    <Label htmlFor="comparison-mode" className="text-sm font-medium cursor-pointer text-muted-foreground hidden md:block">
                        Compare
                    </Label>
                </div>

                <FilterBar
                    filters={filters}
                    onFilterChange={onSetFilters}
                    siteId={site.id}
                />

                <DateRangePicker
                    value={dateRange}
                    onChange={onSetDateRange}
                />

                {isEditing ? (
                    <>
                        <Button variant="ghost" onClick={() => onSetIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={onSave}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="ghost" size="sm" onClick={onToggleCustomizer}>
                            Customize
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleSettings}
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
