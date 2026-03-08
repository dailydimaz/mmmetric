import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSqlQuery } from "@/hooks/useSqlQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Play, Clock, Database, FileCode, Loader2, History } from "lucide-react";

export default function SqlEditor() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sites } = useSites();
  const site = sites.find(s => s.id === siteId);
  const { sql, setSql, result, history, runSql, isLoading, error, templates, loadTemplate } = useSqlQuery(siteId);

  const [showHistory, setShowHistory] = useState(false);

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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" />
                SQL Query Editor
              </h1>
              <p className="text-muted-foreground text-sm">{site.name} — Write custom analytics queries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-2" />History
            </Button>
            <Button onClick={runSql} disabled={isLoading || !sql.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Run
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
          <div className="space-y-4">
            {/* SQL Editor */}
            <Card>
              <CardContent className="p-0">
                <Textarea
                  value={sql}
                  onChange={e => setSql(e.target.value)}
                  placeholder="SELECT ... FROM events_partitioned WHERE ..."
                  className="min-h-[200px] font-mono text-sm border-0 rounded-lg resize-y focus-visible:ring-0"
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runSql(); } }}
                />
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Results</CardTitle>
                  {result && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{result.executionTime}ms • {result.rowCount} rows
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}
                {isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                {!isLoading && !result && !error && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Database className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">Write a query and press Run (⌘+Enter)</p>
                  </div>
                )}
                {result && !isLoading && result.rows.length > 0 && (
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {result.columns.map(col => <TableHead key={col} className="capitalize text-xs">{col.replace('_', ' ')}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.rows.map((row, i) => (
                          <TableRow key={i}>
                            {result.columns.map(col => (
                              <TableCell key={col} className="text-sm">{typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '')}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Templates</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {templates.map((t, i) => (
                  <Button key={i} variant="ghost" size="sm" className="w-full justify-start text-xs h-auto py-2" onClick={() => loadTemplate(i)}>
                    <FileCode className="h-3 w-3 mr-2 shrink-0" />
                    <span className="truncate">{t.name}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {showHistory && history.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Queries</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {history.map((h, i) => (
                    <Button key={i} variant="ghost" size="sm" className="w-full justify-start text-xs h-auto py-2 font-mono" onClick={() => setSql(h.sql)}>
                      <span className="truncate">{h.sql.slice(0, 40)}...</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Note</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Queries are securely executed through the analytics engine. Only SELECT queries against your site's data are permitted.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
