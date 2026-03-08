import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEmbeddedDashboards } from "@/hooks/useEmbeddedDashboards";
import { Plus, Code, Copy, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface EmbedDashboardCardProps {
  siteId: string;
}

export function EmbedDashboardCard({ siteId }: EmbedDashboardCardProps) {
  const { tokens, isLoading, createToken, deleteToken, toggleToken } = useEmbeddedDashboards(siteId);
  

  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dashboard_id: '',
    allowed_domains: '',
    expires_at: '',
  });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      const result = await createToken.mutateAsync({
        name: form.name,
        dashboard_id: form.dashboard_id || undefined,
        allowed_domains: form.allowed_domains ? form.allowed_domains.split(',').map(d => d.trim()) : [],
        expires_at: form.expires_at || undefined,
      });
      setNewToken((result as any).plainToken);
      toast.success('Embed token created');
    } catch { toast.error('Failed to create token'); }
  };

  const handleCopyEmbed = (token: string) => {
    const embedUrl = `${window.location.origin}/embed/${token}`;
    const snippet = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Embed code copied!');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5 text-primary" />Embeddable Dashboards</CardTitle>
            <CardDescription>Create signed embed tokens for external websites</CardDescription>
          </div>
          <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setNewToken(null); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Create Embed</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{newToken ? 'Token Created' : 'New Embed Token'}</DialogTitle></DialogHeader>
              {newToken ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Copy this token — it won't be shown again:</p>
                    <code className="text-xs break-all">{newToken}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(newToken); toast.success('Token copied'); }}>
                      <Copy className="h-4 w-4 mr-2" />Copy Token
                    </Button>
                    <Button className="flex-1" onClick={() => handleCopyEmbed(newToken)}>
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
                      Copy Embed Code
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Website Embed" /></div>
                  <div><Label>Allowed Domains (comma-separated)</Label><Input value={form.allowed_domains} onChange={e => setForm({ ...form, allowed_domains: e.target.value })} placeholder="example.com, app.example.com" /></div>
                  <div><Label>Expires At (optional)</Label><Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
                  <Button onClick={handleCreate} disabled={!form.name.trim()} className="w-full">Create Token</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : tokens.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No embed tokens yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map(token => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell>
                    {token.allowed_domains.length > 0 
                      ? token.allowed_domains.map(d => <Badge key={d} variant="outline" className="mr-1 text-xs">{d}</Badge>)
                      : <span className="text-xs text-muted-foreground">All domains</span>
                    }
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(token.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Switch checked={token.is_active} onCheckedChange={() => toggleToken.mutate({ id: token.id, is_active: !token.is_active })} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteToken.mutate(token.id)}>
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
