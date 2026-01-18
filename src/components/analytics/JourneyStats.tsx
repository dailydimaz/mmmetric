import { Card, CardContent } from "@/components/ui/card";
import { Route, LogIn, LogOut, TrendingUp } from "lucide-react";
import { JourneyStats as JourneyStatsType } from "@/hooks/useJourneys";

interface JourneyStatsProps {
  stats: JourneyStatsType | null;
  isLoading?: boolean;
}

export function JourneyStatsCards({ stats, isLoading }: JourneyStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="skeleton h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Sessions",
      value: stats?.total_sessions?.toLocaleString() ?? "0",
      icon: Route,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Avg Pages/Session",
      value: stats?.avg_pages_per_session?.toFixed(1) ?? "0",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface PageListProps {
  title: string;
  icon: typeof LogIn;
  iconColor: string;
  pages: Array<{ page: string; count: number }>;
  isLoading?: boolean;
}

export function PageList({ title, icon: Icon, iconColor, pages, isLoading }: PageListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const maxCount = Math.max(...pages.map((p) => p.count), 1);

  return (
    <div className="space-y-2">
      {pages.slice(0, 10).map((page, index) => {
        const widthPercent = (page.count / maxCount) * 100;

        return (
          <div
            key={`${page.page}-${index}`}
            className="relative flex items-center justify-between p-2 rounded-lg overflow-hidden"
          >
            {/* Background bar */}
            <div
              className="absolute inset-y-0 left-0 bg-muted/50 rounded-lg transition-all"
              style={{ width: `${widthPercent}%` }}
            />

            {/* Content */}
            <div className="relative flex items-center gap-2 min-w-0 flex-1">
              <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
              <span className="text-sm truncate" title={page.page}>
                {formatPagePath(page.page)}
              </span>
            </div>
            <span className="relative text-sm font-medium text-muted-foreground ml-2">
              {page.count.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatPagePath(path: string): string {
  try {
    const url = new URL(path);
    return url.pathname || "/";
  } catch {
    if (path.startsWith("/")) return path;
    return "/" + path;
  }
}

interface TopPathsListProps {
  paths: Array<{ path: string[]; count: number }>;
  isLoading?: boolean;
}

export function TopPathsList({ paths, isLoading }: TopPathsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!paths || paths.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No common paths found. Users need to visit at least 3 pages.
      </div>
    );
  }

  const maxCount = Math.max(...paths.map((p) => p.count), 1);

  return (
    <div className="space-y-3">
      {paths.slice(0, 10).map((pathData, index) => {
        const widthPercent = (pathData.count / maxCount) * 100;

        return (
          <div
            key={index}
            className="relative p-3 rounded-lg border border-border overflow-hidden"
          >
            {/* Background bar */}
            <div
              className="absolute inset-y-0 left-0 bg-primary/5 transition-all"
              style={{ width: `${widthPercent}%` }}
            />

            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Path #{index + 1}
                </span>
                <span className="text-sm font-bold">
                  {pathData.count.toLocaleString()} sessions
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {pathData.path.map((page, pageIndex) => (
                  <div key={pageIndex} className="flex items-center gap-2">
                    <span
                      className="text-sm bg-background border border-border px-2 py-1 rounded truncate max-w-[150px]"
                      title={page}
                    >
                      {formatPagePath(page)}
                    </span>
                    {pageIndex < pathData.path.length - 1 && (
                      <span className="text-muted-foreground">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
