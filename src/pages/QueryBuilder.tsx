import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useQueryBuilder, AVAILABLE_METRICS, AVAILABLE_DIMENSIONS, VISUALIZATION_TYPES } from "@/hooks/useQueryBuilder";
import { useSavedReports } from "@/hooks/useSavedReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Save, Plus, X, BarChart3, LineChart, PieChart, TableIcon, Loader2, ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { LineChart as RechartsLine, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function QueryVisualization({ data, type, metrics, dimensions }: { data: Record<string, any>[]; type: string; metrics: string[]; dimensions: string[] }) {
  if (!data || data.length === 0) return <p className="text-muted-foreground text-center py-8">No results</p>;

  const primaryMetric = metrics[0] || 'pageviews';
  const primaryDimension = dimensions[0] || 'date';

  switch (type) {
    case 'number':
      const total = data.reduce((sum, row) => sum + (Number(row[primaryMetric]) || 0), 0);
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary">{total.toLocaleString()}</div>
            <div className="text-muted-foreground mt-2 text-lg capitalize">{primaryMetric.replace('_', ' ')}</div>
          </div>
        </div>
      );
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RechartsPie>
            <Pie data={data.slice(0, 10)} dataKey={primaryMetric} nameKey={primaryDimension} cx="50%" cy="50%" outerRadius={150} label>
              {data.slice(0, 10).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPie>
        </ResponsiveContainer>
      );
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={primaryDimension} className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            {metrics.map((m, i) => <Bar key={m} dataKey={m} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />)}
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={primaryDimension} className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            {metrics.map((m, i) => <Area key={m} type="monotone" dataKey={m} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.3} stroke={CHART_COLORS[i % CHART_COLORS.length]} />)}
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      );
    case 'scatter':
      if (metrics.length >= 2) {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey={metrics[0]} name={metrics[0]} className="text-xs fill-muted-foreground" />
              <YAxis dataKey={metrics[1]} name={metrics[1]} className="text-xs fill-muted-foreground" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Scatter data={data} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      }
      // fall through to line
    case 'table':
      return (
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(data[0]).map(col => <TableHead key={col} className="capitalize">{col.replace('_', ' ')}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  {Object.values(row).map((val, j) => <TableCell key={j}>{typeof val === 'number' ? val.toLocaleString() : String(val ?? '')}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    case 'gauge':
      const gaugeVal = data[0]?.[primaryMetric] || 0;
      const maxVal = Math.max(...data.map(r => Number(r[primaryMetric]) || 0));
      const pct = maxVal > 0 ? (Number(gaugeVal) / maxVal) * 100 : 0;
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-48 h-24 overflow-hidden">
            <div className="absolute inset-0 bg-muted rounded-t-full" />
            <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-full transition-all" style={{ height: `${pct}%` }} />
          </div>
          <div className="text-3xl font-bold mt-4">{Number(gaugeVal).toLocaleString()}</div>
          <div className="text-muted-foreground capitalize">{primaryMetric.replace('_', ' ')}</div>
        </div>
      );
    default: // line
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RechartsLine data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={primaryDimension} className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            {metrics.map((m, i) => <Line key={m} type="monotone" dataKey={m} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} />)}
            <Legend />
          </RechartsLine>
        </ResponsiveContainer>
      );
  }
}

export default function QueryBuilder() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sites } = useSites();
  const site = sites.find(s => s.id === siteId);

  const { queryConfig, updateConfig, result, visualizationType, setVisualizationType, runQuery, isLoading, error } = useQueryBuilder(siteId);
  const { saveReport } = useSavedReports(siteId);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [reportName, setReportName] = useState('');

  const handleSave = async () => {
    if (!reportName.trim()) return;
    try {
      await saveReport.mutateAsync({
        name: reportName,
        query_config: queryConfig,
        visualization_type: visualizationType,
      });
      toast.success('Report saved');
      setSaveDialogOpen(false);
      setReportName('');
    } catch {
      toast.error('Failed to save report');
    }
  };

  if (!user || !site) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/sites/${siteId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Query Builder</h1>
              <p className="text-muted-foreground text-sm">{site.name} — Build custom analytics queries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!result}>
                  <Save className="h-4 w-4 mr-2" />Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Save Report</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div><Label>Report Name</Label><Input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="My Report" /></div>
                  <Button onClick={handleSave} disabled={!reportName.trim()} className="w-full">Save Report</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={runQuery} disabled={isLoading || queryConfig.metrics.length === 0}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Run Query
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Query Config Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {AVAILABLE_METRICS.map(m => (
                  <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={queryConfig.metrics.includes(m.value)}
                      onChange={e => {
                        const newMetrics = e.target.checked
                          ? [...queryConfig.metrics, m.value]
                          : queryConfig.metrics.filter(x => x !== m.value);
                        updateConfig({ metrics: newMetrics });
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{m.label}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Dimensions (Group By)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {AVAILABLE_DIMENSIONS.map(d => (
                  <label key={d.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={queryConfig.dimensions.includes(d.value)}
                      onChange={e => {
                        const newDims = e.target.checked
                          ? [...queryConfig.dimensions, d.value]
                          : queryConfig.dimensions.filter(x => x !== d.value);
                        updateConfig({ dimensions: newDims });
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{d.label}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Date Range</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={queryConfig.startDate} onChange={e => updateConfig({ startDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={queryConfig.endDate} onChange={e => updateConfig({ endDate: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Options</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Sort By</Label>
                  <Select value={queryConfig.orderBy || ''} onValueChange={v => updateConfig({ orderBy: v || undefined })}>
                    <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Auto</SelectItem>
                      {[...queryConfig.metrics, ...queryConfig.dimensions].map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Limit</Label>
                  <Input type="number" value={queryConfig.limit || 100} onChange={e => updateConfig({ limit: parseInt(e.target.value) || 100 })} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* Visualization Type Selector */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {VISUALIZATION_TYPES.map(v => (
                    <Badge
                      key={v.value}
                      variant={visualizationType === v.value ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setVisualizationType(v.value)}
                    >
                      {v.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results Card */}
            <Card className="min-h-[500px]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Results</CardTitle>
                  {result && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {result.executionTime}ms • {result.rows.length} rows
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}
                {isLoading && (
                  <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                )}
                {!isLoading && !result && !error && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-4 opacity-30" />
                    <p>Configure your query and click "Run Query"</p>
                  </div>
                )}
                {result && !isLoading && (
                  <QueryVisualization
                    data={result.rows}
                    type={visualizationType}
                    metrics={queryConfig.metrics}
                    dimensions={queryConfig.dimensions}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
