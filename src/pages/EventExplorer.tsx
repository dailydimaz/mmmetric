import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import {
  Search,
  Filter,
  Activity,
  Globe,
  MousePointer,
  BarChart3,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";

interface Event {
  id: string;
  event_name: string;
  url: string | null;
  created_at: string;
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  referrer: string | null;
  visitor_id: string | null;
  session_id: string | null;
  properties: Record<string, unknown> | null;
}

interface EventStats {
  event_name: string;
  event_count: number;
}

function useEventExplorer(siteId: string, dateRange: { start: Date; end: Date }, eventFilter: string) {
  return useQuery({
    queryKey: ["event-explorer", siteId, dateRange.start.toISOString(), dateRange.end.toISOString(), eventFilter],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("id, event_name, url, created_at, country, city, browser, os, device_type, referrer, visitor_id, session_id, properties")
        .eq("site_id", siteId)
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (eventFilter && eventFilter !== "all") {
        query = query.eq("event_name", eventFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!siteId,
  });
}

function useEventStats(siteId: string, dateRange: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ["event-stats", siteId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_groups_stats", {
        _site_id: siteId,
        _start_date: dateRange.start.toISOString(),
        _end_date: dateRange.end.toISOString(),
      });
      if (error) throw error;
      return (data || []) as unknown as EventStats[];
    },
    enabled: !!siteId,
  });
}

function PropertyBreakdown({ events, propertyKey }: { events: Event[]; propertyKey: string }) {
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      const value = (e as any)[propertyKey] || "Unknown";
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [events, propertyKey]);

  const total = events.length;

  return (
    <div className="space-y-2">
      {breakdown.map(([value, count]) => (
        <div key={value} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="truncate">{value}</span>
              <span className="text-muted-foreground ml-2">{count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-muted-foreground w-12 text-right">
            {((count / total) * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function EventExplorer() {
  const { siteId } = useParams<{ siteId: string }>();
  const [dateRange] = useState({ start: subDays(new Date(), 7), end: new Date() });
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeBreakdown, setActiveBreakdown] = useState("country");

  const { data: events = [], isLoading, refetch } = useEventExplorer(siteId || "", dateRange, eventFilter);
  const { data: eventStats = [] } = useEventStats(siteId || "", dateRange);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(e =>
      e.url?.toLowerCase().includes(query) ||
      e.event_name.toLowerCase().includes(query) ||
      e.country?.toLowerCase().includes(query) ||
      e.browser?.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  const eventTypes = useMemo(() => {
    return eventStats.map(s => s.event_name).sort();
  }, [eventStats]);

  if (!siteId) return null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="h-6 w-6" />
              Event Explorer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse and analyze all tracked events
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Event Type Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${eventFilter === "all" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setEventFilter("all")}
          >
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold">{events.length}</p>
              <p className="text-xs text-muted-foreground">All Events</p>
            </CardContent>
          </Card>
          {eventStats.slice(0, 5).map(stat => (
            <Card 
              key={stat.event_name}
              className={`cursor-pointer transition-all hover:shadow-md ${eventFilter === stat.event_name ? "ring-2 ring-primary" : ""}`}
              onClick={() => setEventFilter(stat.event_name)}
            >
              <CardContent className="p-4 text-center">
                {stat.event_name === "pageview" ? (
                  <Globe className="h-5 w-5 mx-auto mb-2 text-primary" />
                ) : (
                  <MousePointer className="h-5 w-5 mx-auto mb-2 text-secondary-foreground" />
                )}
                <p className="text-xl font-bold">{stat.event_count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground truncate">{stat.event_name}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {eventTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Events ({filteredEvents.length})</span>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Activity className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No events found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr className="text-xs text-muted-foreground">
                        <th className="text-left p-3 font-medium">Event</th>
                        <th className="text-left p-3 font-medium">URL</th>
                        <th className="text-left p-3 font-medium hidden md:table-cell">Location</th>
                        <th className="text-left p-3 font-medium hidden lg:table-cell">Browser</th>
                        <th className="text-left p-3 font-medium">Time</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredEvents.map(event => (
                        <tr 
                          key={event.id} 
                          className={`hover:bg-muted/50 cursor-pointer ${selectedEvent?.id === event.id ? "bg-muted/70" : ""}`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <td className="p-3">
                            <Badge variant="secondary" className="text-xs">
                              {event.event_name}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-mono truncate block max-w-[200px]">
                              {event.url || "—"}
                            </span>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {event.country || "Unknown"}
                            </span>
                          </td>
                          <td className="p-3 hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {event.browser || "Unknown"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), "MMM d, HH:mm")}
                            </span>
                          </td>
                          <td className="p-3">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {selectedEvent ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Event Name</p>
                    <Badge>{selectedEvent.event_name}</Badge>
                  </div>
                  {selectedEvent.url && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">URL</p>
                      <p className="text-sm font-mono break-all">{selectedEvent.url}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Country</p>
                      <p>{selectedEvent.country || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">City</p>
                      <p>{selectedEvent.city || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Browser</p>
                      <p>{selectedEvent.browser || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">OS</p>
                      <p>{selectedEvent.os || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Device</p>
                      <p>{selectedEvent.device_type || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p>{format(new Date(selectedEvent.created_at), "HH:mm:ss")}</p>
                    </div>
                  </div>
                  {selectedEvent.referrer && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Referrer</p>
                        <p className="text-sm font-mono break-all">{selectedEvent.referrer}</p>
                      </div>
                    </>
                  )}
                  {selectedEvent.properties && Object.keys(selectedEvent.properties).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Properties</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(selectedEvent.properties, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Property Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeBreakdown} onValueChange={setActiveBreakdown}>
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="country">Country</TabsTrigger>
                      <TabsTrigger value="browser">Browser</TabsTrigger>
                      <TabsTrigger value="device_type">Device</TabsTrigger>
                      <TabsTrigger value="os">OS</TabsTrigger>
                    </TabsList>
                    <TabsContent value={activeBreakdown}>
                      <PropertyBreakdown events={filteredEvents} propertyKey={activeBreakdown} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Top URLs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Top URLs</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyBreakdown events={filteredEvents} propertyKey="url" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
