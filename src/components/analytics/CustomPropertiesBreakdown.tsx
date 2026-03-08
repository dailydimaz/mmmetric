import { useState } from "react";
import { Braces, ChevronRight, ArrowLeft, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DateRange } from "@/hooks/useAnalytics";
import { useCustomPropertyKeys, useCustomPropertyValues } from "@/hooks/useCustomProperties";

interface CustomPropertiesBreakdownProps {
  siteId: string;
  dateRange: DateRange;
  eventName?: string;
}

export function CustomPropertiesBreakdown({ siteId, dateRange, eventName }: CustomPropertiesBreakdownProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { data: keys, isLoading: keysLoading } = useCustomPropertyKeys(siteId, dateRange, eventName);
  const { data: values, isLoading: valuesLoading } = useCustomPropertyValues(
    siteId,
    dateRange,
    selectedKey || "",
    eventName
  );

  const isLoading = selectedKey ? valuesLoading : keysLoading;
  const maxCount = selectedKey
    ? Math.max(...(values || []).map(v => v.count), 1)
    : Math.max(...(keys || []).map(k => k.occurrences), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Braces className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">
            {selectedKey ? `Property: ${selectedKey}` : "Custom Properties"}
          </CardTitle>
        </div>
        {selectedKey && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedKey(null)} className="gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
        ) : selectedKey ? (
          <div className="space-y-2">
            {(!values || values.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">No values found</p>
            ) : (
              values.map((v) => (
                <div key={v.value} className="relative">
                  <div
                    className="absolute inset-0 bg-primary/5 rounded"
                    style={{ width: `${(v.count / maxCount) * 100}%` }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium truncate">{v.value}</span>
                    <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {v.unique_visitors}
                      </span>
                      <span className="font-medium text-foreground tabular-nums">{v.count}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {(!keys || keys.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">No custom properties tracked yet</p>
            ) : (
              keys.map((k) => (
                <button
                  key={k.key}
                  onClick={() => setSelectedKey(k.key)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <span className="font-medium">{k.key}</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="tabular-nums">{k.occurrences}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
