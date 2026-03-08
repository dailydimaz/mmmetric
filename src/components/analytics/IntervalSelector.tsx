import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";

export type ChartInterval = "hour" | "day" | "week" | "month";

interface IntervalSelectorProps {
  value: ChartInterval;
  onChange: (interval: ChartInterval) => void;
  dateRange: DateRange;
}

const allIntervals: { value: ChartInterval; label: string }[] = [
  { value: "hour", label: "Hourly" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

function getAvailableIntervals(dateRange: DateRange): ChartInterval[] {
  switch (dateRange) {
    case "today":
      return ["hour"];
    case "7d":
      return ["hour", "day"];
    case "30d":
      return ["day", "week"];
    case "90d":
      return ["day", "week", "month"];
    default:
      return ["day"];
  }
}

export function getDefaultInterval(dateRange: DateRange): ChartInterval {
  switch (dateRange) {
    case "today":
      return "hour";
    case "7d":
      return "day";
    case "30d":
      return "day";
    case "90d":
      return "week";
    default:
      return "day";
  }
}

export function IntervalSelector({ value, onChange, dateRange }: IntervalSelectorProps) {
  const [open, setOpen] = useState(false);
  const available = getAvailableIntervals(dateRange);

  if (available.length <= 1) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-xs">
          <BarChart3 className="h-3.5 w-3.5" />
          {allIntervals.find(i => i.value === value)?.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-2" align="end">
        <ul className="space-y-1">
          {allIntervals
            .filter(i => available.includes(i.value))
            .map((interval) => (
              <li key={interval.value}>
                <button
                  className={`w-full px-3 py-1.5 text-sm rounded-md transition-colors text-left
                    ${value === interval.value ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                  onClick={() => {
                    onChange(interval.value);
                    setOpen(false);
                  }}
                >
                  {interval.label}
                </button>
              </li>
            ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
