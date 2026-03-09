import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisitorProfileDialog } from "@/components/analytics/VisitorProfileDialog";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, subDays } from "date-fns";
import {
  Users,
  Search,
  Filter,
  Eye,
  Clock,
  Globe,
  Monitor,
  MapPin,
  Calendar,
  Activity,
  ArrowUpRight,
  ChevronRight,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react";

interface VisitorSummary {
  visitor_id: string;
  first_seen: string;
  last_seen: string;
  total_pageviews: number;
  total_sessions: number;
  country: string | null;
  city: string | null;
  browser: string | null;
  device_type: string | null;
  os: string | null;
}

function useVisitorList(siteId: string, dateRange: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ["visitor-list", siteId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      // Get unique visitors with aggregated stats
      const { data, error } = await supabase
        .from("events")
        .select("visitor_id, created_at, country, city, browser, device_type, os")
        .eq("site_id", siteId)
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .not("visitor_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Aggregate by visitor
      const visitorMap = new Map<string, VisitorSummary>();
      
      data?.forEach(event => {
        if (!event.visitor_id) return;
        
        const existing = visitorMap.get(event.visitor_id);
        if (existing) {
          existing.total_pageviews++;
          if (new Date(event.created_at) > new Date(existing.last_seen)) {
            existing.last_seen = event.created_at;
          }
          if (new Date(event.created_at) < new Date(existing.first_seen)) {
            existing.first_seen = event.created_at;
          }
        } else {
          visitorMap.set(event.visitor_id, {
            visitor_id: event.visitor_id,
            first_seen: event.created_at,
            last_seen: event.created_at,
            total_pageviews: 1,
            total_sessions: 1, // Simplified
            country: event.country,
            city: event.city,
            browser: event.browser,
            device_type: event.device_type,
            os: event.os,
          });
        }
      });

      return Array.from(visitorMap.values())
        .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());
    },
    enabled: !!siteId,
  });
}

function getDeviceIcon(deviceType: string | null) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className="h-4 w-4" />;
    case "tablet":
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

function getVisitorInitials(visitorId: string) {
  return visitorId.slice(0, 2).toUpperCase();
}

export default function UserProfiles() {
  const { siteId } = useParams<{ siteId: string }>();
  const [dateRange] = useState({ start: subDays(new Date(), 30), end: new Date() });
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: visitors = [], isLoading, refetch } = useVisitorList(siteId || "", dateRange);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const set = new Set(visitors.map(v => v.country).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [visitors]);

  // Filter visitors
  const filteredVisitors = useMemo(() => {
    let result = visitors;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.visitor_id.toLowerCase().includes(query) ||
        v.country?.toLowerCase().includes(query) ||
        v.city?.toLowerCase().includes(query) ||
        v.browser?.toLowerCase().includes(query)
      );
    }
    
    if (countryFilter !== "all") {
      result = result.filter(v => v.country === countryFilter);
    }
    
    if (deviceFilter !== "all") {
      result = result.filter(v => v.device_type?.toLowerCase() === deviceFilter);
    }
    
    return result;
  }, [visitors, searchQuery, countryFilter, deviceFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalVisitors = visitors.length;
    const totalPageviews = visitors.reduce((sum, v) => sum + v.total_pageviews, 0);
    const avgPageviews = totalVisitors > 0 ? (totalPageviews / totalVisitors).toFixed(1) : "0";
    const countries = new Set(visitors.map(v => v.country).filter(Boolean)).size;
    
    return { totalVisitors, totalPageviews, avgPageviews, countries };
  }, [visitors]);

  const handleViewProfile = (visitorId: string) => {
    setSelectedVisitorId(visitorId);
    setProfileOpen(true);
  };

  if (!siteId) return null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-6 w-6" />
              User Profiles
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore individual visitor journeys and behavior
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalVisitors.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total visitors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPageviews.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total pageviews</p>
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
                  <p className="text-2xl font-bold">{stats.avgPageviews}</p>
                  <p className="text-xs text-muted-foreground">Avg pages/visitor</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.countries}</p>
                  <p className="text-xs text-muted-foreground">Countries</p>
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
              placeholder="Search by visitor ID, country, browser..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Monitor className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All devices</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Visitors List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Visitors ({filteredVisitors.length})</span>
              <Badge variant="outline" className="font-mono">
                Last 30 days
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredVisitors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No visitors found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredVisitors.map(visitor => (
                    <div
                      key={visitor.visitor_id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getVisitorInitials(visitor.visitor_id)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-medium">
                            {visitor.visitor_id.slice(0, 12)}...
                          </span>
                          {visitor.country && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {visitor.country}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {getDeviceIcon(visitor.device_type)}
                            {visitor.browser || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {visitor.total_pageviews} pages
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(visitor.last_seen), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">First seen</p>
                        <p className="text-sm">{format(new Date(visitor.first_seen), "MMM d, HH:mm")}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProfile(visitor.visitor_id)}
                        className="gap-1"
                      >
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Profile Dialog */}
      {selectedVisitorId && (
        <VisitorProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          siteId={siteId}
          visitorId={selectedVisitorId}
        />
      )}
    </DashboardLayout>
  );
}
