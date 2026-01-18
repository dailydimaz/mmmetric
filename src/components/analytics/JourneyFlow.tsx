import { useMemo } from "react";
import { JourneyTransition } from "@/hooks/useJourneys";

interface JourneyFlowProps {
  transitions: JourneyTransition[];
  isLoading?: boolean;
}

interface FlowNode {
  id: string;
  label: string;
  inflow: number;
  outflow: number;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

export function JourneyFlow({ transitions, isLoading }: JourneyFlowProps) {
  const { nodes, links, maxFlow } = useMemo(() => {
    if (!transitions || transitions.length === 0) {
      return { nodes: [], links: [], maxFlow: 0 };
    }

    const nodeMap = new Map<string, FlowNode>();
    const flowLinks: FlowLink[] = [];

    // Build nodes and links
    transitions.forEach((t) => {
      // Source node
      if (!nodeMap.has(t.from)) {
        nodeMap.set(t.from, { id: t.from, label: t.from, inflow: 0, outflow: 0 });
      }
      nodeMap.get(t.from)!.outflow += t.count;

      // Target node
      if (!nodeMap.has(t.to)) {
        nodeMap.set(t.to, { id: t.to, label: t.to, inflow: 0, outflow: 0 });
      }
      nodeMap.get(t.to)!.inflow += t.count;

      flowLinks.push({ source: t.from, target: t.to, value: t.count });
    });

    const nodesArray = Array.from(nodeMap.values());
    const max = Math.max(...flowLinks.map((l) => l.value), 1);

    return { nodes: nodesArray, links: flowLinks.slice(0, 15), maxFlow: max };
  }, [transitions]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No journey data available. Users need to visit multiple pages in a session.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {links.map((link, index) => {
        const widthPercent = (link.value / maxFlow) * 100;
        const opacity = 0.4 + (link.value / maxFlow) * 0.6;

        return (
          <div key={`${link.source}-${link.target}-${index}`} className="group">
            <div className="flex items-center gap-3">
              {/* Source page */}
              <div className="w-1/3 text-right">
                <span className="text-sm font-medium truncate block" title={link.source}>
                  {formatPagePath(link.source)}
                </span>
              </div>

              {/* Flow bar */}
              <div className="flex-1 relative h-8">
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                  <div
                    className="h-6 rounded-full transition-all duration-300 flex items-center justify-center"
                    style={{
                      width: `${Math.max(widthPercent, 15)}%`,
                      background: `linear-gradient(90deg, hsl(var(--primary) / ${opacity}) 0%, hsl(var(--chart-2) / ${opacity}) 100%)`,
                    }}
                  >
                    <span className="text-xs font-medium text-primary-foreground px-2">
                      {link.value.toLocaleString()}
                    </span>
                  </div>
                  {/* Arrow */}
                  <div className="ml-1 text-muted-foreground">→</div>
                </div>
              </div>

              {/* Target page */}
              <div className="w-1/3">
                <span className="text-sm font-medium truncate block" title={link.target}>
                  {formatPagePath(link.target)}
                </span>
              </div>
            </div>
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
    // If it's already a path, just return it
    if (path.startsWith("/")) return path;
    return "/" + path;
  }
}
