import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Shield, User, Database, Settings, Eye, Edit, Trash2, Plus, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const ACTION_ICONS: Record<string, any> = {
  view: Eye,
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: User,
  settings: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-600',
  delete: 'bg-destructive/10 text-destructive',
  update: 'bg-amber-500/10 text-amber-600',
  view: 'bg-primary/10 text-primary',
  login: 'bg-blue-500/10 text-blue-600',
};

export default function AuditLogPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sites } = useSites();
  const site = siteId ? sites.find(s => s.id === siteId) : null;
  const { entries, isLoading, refetch } = useAuditLog(siteId);

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(siteId ? `/dashboard/sites/${siteId}` : '/dashboard/settings')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Audit Log
              </h1>
              <p className="text-muted-foreground text-sm">
                {site ? `${site.name} — ` : ''}Track all user actions and changes
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Shield className="h-12 w-12 mb-4 opacity-30" />
                <p>No audit log entries yet</p>
                <p className="text-xs mt-1">Actions will be recorded as you use the platform</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => {
                    const actionType = entry.action.split('.')[0] || 'view';
                    const IconComp = ACTION_ICONS[actionType] || Database;
                    const colorClass = ACTION_COLORS[actionType] || 'bg-muted text-muted-foreground';

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.created_at), 'MMM d, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${colorClass}`}>
                            <IconComp className="h-3 w-3" />
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{entry.entity_type}</span>
                          {entry.entity_id && <span className="text-xs text-muted-foreground ml-1">#{entry.entity_id.slice(0, 8)}</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {entry.details && typeof entry.details === 'object' ? JSON.stringify(entry.details) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{entry.ip_address || '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
