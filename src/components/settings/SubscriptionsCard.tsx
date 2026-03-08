import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useReportSubscriptions } from "@/hooks/useReportSubscriptions";
import { useSavedReports } from "@/hooks/useSavedReports";
import { Plus, Mail, Clock, Trash2, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SubscriptionsCardProps {
  siteId: string;
}

export function SubscriptionsCard({ siteId }: SubscriptionsCardProps) {
  const { subscriptions, isLoading, createSubscription, updateSubscription, deleteSubscription } = useReportSubscriptions(siteId);
  const { reports } = useSavedReports(siteId);
  

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    hour_of_day: 9,
    day_of_week: 1,
    day_of_month: 1,
    report_id: '',
    dashboard_id: '',
    channel: 'email',
    channel_config: {} as any,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createSubscription.mutateAsync({
        name: form.name,
        frequency: form.frequency,
        hour_of_day: form.hour_of_day,
        day_of_week: form.day_of_week,
        day_of_month: form.day_of_month,
        report_id: form.report_id || null,
        dashboard_id: form.dashboard_id || null,
        channel: form.channel,
        channel_config: form.channel_config,
        timezone: form.timezone,
        is_enabled: true,
      });
      toast.success('Subscription created');
      setShowCreate(false);
      setForm(prev => ({ ...prev, name: '' }));
    } catch { toast.error('Failed to create subscription'); }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateSubscription.mutateAsync({ id, is_enabled: !enabled });
  };

  const handleDelete = async (id: string) => {
    await deleteSubscription.mutateAsync(id);
    toast.success('Subscription deleted');
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Scheduled Reports</CardTitle>
            <CardDescription>Automatically receive reports via email or Slack</CardDescription>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Subscription</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Subscription</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Weekly Traffic Report" /></div>
                <div><Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.frequency === 'weekly' && (
                  <div><Label>Day of Week</Label>
                    <Select value={String(form.day_of_week)} onValueChange={v => setForm({ ...form, day_of_week: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Hour (0-23)</Label><Input type="number" min={0} max={23} value={form.hour_of_day} onChange={e => setForm({ ...form, hour_of_day: parseInt(e.target.value) || 0 })} /></div>
                {reports.length > 0 && (
                  <div><Label>Report (optional)</Label>
                    <Select value={form.report_id} onValueChange={v => setForm({ ...form, report_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select a report" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {reports.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Channel</Label>
                  <Select value={form.channel} onValueChange={v => setForm({ ...form, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={!form.name.trim()} className="w-full">Create Subscription</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : subscriptions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No subscriptions yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Last Sent</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{sub.frequency}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      {sub.channel === 'email' ? <Mail className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {sub.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {sub.last_sent_at ? format(new Date(sub.last_sent_at), 'MMM d, HH:mm') : '—'}
                  </TableCell>
                  <TableCell>
                    <Switch checked={sub.is_enabled} onCheckedChange={() => handleToggle(sub.id, sub.is_enabled)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
