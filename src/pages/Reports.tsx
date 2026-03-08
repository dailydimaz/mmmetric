import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSavedReports } from "@/hooks/useSavedReports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Plus, Folder, FileText, Star, MoreVertical, Trash2, Edit, Pin, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Reports() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sites } = useSites();
  const site = sites.find(s => s.id === siteId);
  const { reports, collections, isLoading, deleteReport, updateReport, createCollection, deleteCollection } = useSavedReports(siteId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);

  const filteredReports = reports.filter(r => {
    const matchesSearch = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = !selectedCollection || r.collection_id === selectedCollection;
    return matchesSearch && matchesCollection;
  });

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport.mutateAsync(id);
      toast.success('Report deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    try {
      await updateReport.mutateAsync({ id, is_pinned: !pinned } as any);
      toast.success(pinned ? 'Unpinned' : 'Pinned');
    } catch { toast.error('Failed to update'); }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      await createCollection.mutateAsync({ name: newCollectionName });
      toast.success('Collection created');
      setNewCollectionName('');
      setShowNewCollection(false);
    } catch { toast.error('Failed to create collection'); }
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
              <h1 className="text-2xl font-bold">Reports & Collections</h1>
              <p className="text-muted-foreground text-sm">{site.name} — Saved queries and organized reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowNewCollection(true)}>
              <Folder className="h-4 w-4 mr-2" />New Collection
            </Button>
            <Button onClick={() => navigate(`/dashboard/sites/${siteId}/query-builder`)}>
              <Plus className="h-4 w-4 mr-2" />New Query
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          {/* Sidebar - Collections */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search reports..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>

            <Card>
              <CardContent className="p-2 space-y-1">
                <button
                  onClick={() => setSelectedCollection(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${!selectedCollection ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                >
                  <FileText className="h-4 w-4" />
                  All Reports
                  <Badge variant="secondary" className="ml-auto text-xs">{reports.length}</Badge>
                </button>

                {collections.map(col => (
                  <div key={col.id} className="flex items-center">
                    <button
                      onClick={() => setSelectedCollection(col.id)}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedCollection === col.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                    >
                      <Folder className="h-4 w-4" style={{ color: col.color }} />
                      {col.name}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {reports.filter(r => r.collection_id === col.id).length}
                      </Badge>
                    </button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => deleteCollection.mutate(col.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Reports Grid */}
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredReports.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No reports yet</p>
                <Button className="mt-4" onClick={() => navigate(`/dashboard/sites/${siteId}/query-builder`)}>
                  <Plus className="h-4 w-4 mr-2" />Create Your First Report
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredReports.map(report => (
                  <Card key={report.id} className="group hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/dashboard/sites/${siteId}/query-builder`)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {report.is_pinned && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          <CardTitle className="text-base line-clamp-1">{report.name}</CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleTogglePin(report.id, report.is_pinned); }}>
                              <Pin className="h-4 w-4 mr-2" />{report.is_pinned ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); handleDeleteReport(report.id); }}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {report.description && <CardDescription className="line-clamp-2">{report.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{report.visualization_type}</Badge>
                        <span>Updated {format(new Date(report.updated_at), 'MMM d, yyyy')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Collection Dialog */}
      <Dialog open={showNewCollection} onOpenChange={setShowNewCollection}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Collection</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="Collection name" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} />
            <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim()} className="w-full">Create Collection</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
