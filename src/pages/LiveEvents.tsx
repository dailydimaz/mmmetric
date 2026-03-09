import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import { formatDistanceToNow, format } from "date-fns";
import {
  Activity,
  Globe,
  MousePointer,
  ExternalLink,
  AlertCircle,
  Search,
  Filter,
  Users,
  FileText,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Pause,
  Play,
  X,
} from "lucide-react";

function getEventIcon(eventName: string) {
  switch (eventName) {
    case "pageview":
      return <Globe className="h-4 w-4" />;
    case "click":
      return <MousePointer className="h-4 w-4" />;
    case "outbound":
      return <ExternalLink className="h-4 w-4" />;
    case "404":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function getDeviceIcon(deviceType: string | null) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className="h-3 w-3" />;
    case "tablet":
      return <Tablet className="h-3 w-3" />;
    default:
      return <Monitor className="h-3 w-3" />;
  }
}

function getEventColor(eventName: string) {
  switch (eventName) {
    case "pageview":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "click":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "outbound":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "404":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "scroll":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "form_submit":
      return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function LiveEvents() {
  const { siteId } = useParams<{ siteId: string }>();
  const { recentEvents, activeVisitors, activePages, isConnected } = useRealtimeAnalytics(siteId || "");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [isPaused, setIsPaused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<typeof recentEvents[0] | null>(null);

  // Get unique event types for filter
  const eventTypes = useMemo(() => {
    const types = new Set(recentEvents.map(e => e.event_name));
    return Array.from(types).sort();
  }, [recentEvents]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let events = recentEvents;
    
    if (eventTypeFilter !== "all") {
      events = events.filter(e => e.event_name === eventTypeFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      events = events.filter(e => 
        e.url?.toLowerCase().includes(query) ||
        e.event_name.toLowerCase().includes(query) ||
        e.country?.toLowerCase().includes(query) ||
        e.browser?.toLowerCase().includes(query)
      );
    }
    
    return events;
  }, [recentEvents, eventTypeFilter, searchQuery]);

  if (!siteId) return null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Activity className="h-6 w-6" />
              Live Events
              {isConnected && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Watch events as they happen in real-time
            </p>
          </div>
          <Button
            variant={isPaused ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="gap-2"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeVisitors}</p>
                  <p className="text-xs text-muted-foreground">Active visitors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activePages.length}</p>
                  <p className="text-xs text-muted-foreground">Active pages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recentEvents.length}</p>
                  <p className="text-xs text-muted-foreground">Recent events</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{eventTypes.length}</p>
                  <p className="text-xs text-muted-foreground">Event types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by URL, country, browser..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
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
          {/* Events List */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Event Stream</span>
                <Badge variant="outline" className="font-mono">
                  {filteredEvents.length} events
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Activity className="h-8 w-8 mb-3 opacity-50" />
                    <p className="text-sm">No events matching your filters</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                          selectedEvent?.id === event.id ? "bg-muted/70" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getEventColor(event.event_name)}`}>
                            {getEventIcon(event.event_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs uppercase">
                                {event.event_name}
                              </Badge>
                              {event.country && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {event.country}
                                </span>
                              )}
                            </div>
                            {event.url && (
                              <p className="text-sm font-mono text-foreground/80 truncate">
                                {event.url}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {getDeviceIcon(event.device_type)}
                                {event.browser || "Unknown"}
                              </span>
                              <span>
                                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Event Detail / Active Pages */}
          <div className="space-y-6">
            {selectedEvent ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    Event Details
                    <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Event</p>
                    <Badge className={getEventColor(selectedEvent.event_name)}>
                      {selectedEvent.event_name}
                    </Badge>
                  </div>
                  
                  {selectedEvent.url && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">URL</p>
                      <p className="text-sm font-mono break-all">{selectedEvent.url}</p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Country</p>
                      <p className="text-sm">{selectedEvent.country || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Device</p>
                      <p className="text-sm">{selectedEvent.device_type || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Browser</p>
                      <p className="text-sm">{selectedEvent.browser || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time</p>
                      <p className="text-sm">{format(new Date(selectedEvent.created_at), "HH:mm:ss")}</p>
                    </div>
                  </div>
                  
                  {selectedEvent.referrer && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Referrer</p>
                        <p className="text-sm font-mono break-all">{selectedEvent.referrer}</p>
                      </div>
                    </>
                  )}
                  
                  {selectedEvent.visitor_id && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Visitor ID</p>
                        <p className="text-sm font-mono">{selectedEvent.visitor_id.slice(0, 16)}...</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Active Pages</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px]">
                    {activePages.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        No active pages
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {activePages.map((page, i) => (
                          <div key={i} className="flex items-center justify-between p-3 hover:bg-muted/30">
                            <p className="text-sm font-mono truncate flex-1 mr-3">{page.url}</p>
                            <Badge variant="secondary">{page.count}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Event Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {eventTypes.slice(0, 8).map(type => {
                    const count = recentEvents.filter(e => e.event_name === type).length;
                    const percentage = (count / recentEvents.length) * 100;
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${getEventColor(type)}`}>
                          {getEventIcon(type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{type}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
