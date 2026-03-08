import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGdprLookup, useGdprDelete } from "@/hooks/useGdprTools";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, Search, Trash2, Download, Loader2 } from "lucide-react";

interface GdprToolsCardProps {
  siteId: string;
}

export function GdprToolsCard({ siteId }: GdprToolsCardProps) {
  const [visitorId, setVisitorId] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const lookup = useGdprLookup();
  const deleteMut = useGdprDelete();

  const handleLookup = async () => {
    if (!visitorId.trim()) return;
    try {
      const data = await lookup.mutateAsync({ siteId, visitorId: visitorId.trim() });
      setLookupResult(data);
    } catch (e: any) {
      toast.error("Lookup failed: " + e.message);
    }
  };

  const handleDelete = async () => {
    if (!visitorId.trim()) return;
    try {
      const count = await deleteMut.mutateAsync({ siteId, visitorId: visitorId.trim() });
      toast.success(`Deleted ${count} events for visitor`);
      setLookupResult(null);
      setVisitorId("");
    } catch (e: any) {
      toast.error("Delete failed: " + e.message);
    }
  };

  const handleExport = () => {
    if (!lookupResult) return;
    const blob = new Blob([JSON.stringify(lookupResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdpr-export-${visitorId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" /> GDPR Data Subject Tools
        </CardTitle>
        <CardDescription>Look up, export, or delete all data for a specific visitor (right to access & erasure)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Visitor ID</Label>
          <p className="text-xs text-muted-foreground">Enter the hashed visitor ID to look up their data.</p>
          <div className="flex gap-2">
            <Input
              placeholder="Visitor ID hash"
              value={visitorId}
              onChange={(e) => setVisitorId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            />
            <Button onClick={handleLookup} disabled={lookup.isPending} variant="outline" className="gap-2">
              {lookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Lookup
            </Button>
          </div>
        </div>

        {lookupResult && (
          <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium text-sm">Visitor Data Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Events:</span> {lookupResult.event_count}</div>
              <div><span className="text-muted-foreground">Sessions:</span> {lookupResult.sessions}</div>
              <div><span className="text-muted-foreground">First Seen:</span> {lookupResult.first_seen ? new Date(lookupResult.first_seen).toLocaleDateString() : "—"}</div>
              <div><span className="text-muted-foreground">Last Seen:</span> {lookupResult.last_seen ? new Date(lookupResult.last_seen).toLocaleDateString() : "—"}</div>
              <div><span className="text-muted-foreground">Pages:</span> {lookupResult.pages_visited}</div>
              <div><span className="text-muted-foreground">Countries:</span> {lookupResult.countries?.join(", ") || "—"}</div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" /> Export Data
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all visitor data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {lookupResult.event_count} events, heatmap data, and session data for this visitor. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {deleteMut.isPending ? "Deleting…" : "Delete Permanently"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
