import { useState, useEffect, useCallback } from "react";
import { ExperimentResults } from "@/components/ExperimentResults";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ArrowLeft, FlaskConical, Play, CheckCircle2, FileText, Users, Settings2, Trash2, Square, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useSites } from "@/hooks/useSites";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExperimentVariant {
  id: string;
  experiment_id: string;
  name: string;
  weight: number;
  is_control: boolean;
}

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused" | "ended";
  target_url: string;
  goal_event: string;
  traffic_percentage: number;
  created_at: string;
  variants: ExperimentVariant[];
}

export default function Experiments() {
  const navigate = useNavigate();
  const { siteId: siteIdParam } = useParams<{ siteId: string }>();
  const { toast } = useToast();
  const { sites, isLoading: sitesLoading } = useSites();

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newExpName, setNewExpName] = useState("");
  const [newExpDescription, setNewExpDescription] = useState("");
  const [managedExp, setManagedExp] = useState<Experiment | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingVariants, setEditingVariants] = useState<ExperimentVariant[]>([]);
  const [editTargetUrl, setEditTargetUrl] = useState("");
  const [editGoalEvent, setEditGoalEvent] = useState("");
  const [saving, setSaving] = useState(false);

  const siteId = siteIdParam || sites[0]?.id;
  const site = sites.find(s => s.id === siteId);

  // Define fetchExperiments before useEffect
  const fetchExperiments = useCallback(async () => {
    if (!siteId) return;
    try {
      const { data, error } = await supabase
        .from("experiments")
        .select("*, variants:experiment_variants(*)")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExperiments(data as Experiment[]);
    } catch (error) {
      console.error("Error fetching experiments:", error);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    if (siteId) fetchExperiments();
  }, [siteId, fetchExperiments]);

  const handleCreate = async () => {
    if (!newExpName || !siteId) return;
    try {
      const { data: exp, error: expError } = await supabase
        .from("experiments")
        .insert([{
          site_id: siteId,
          name: newExpName,
          description: newExpDescription || null,
          status: "draft",
          target_url: '/',
          goal_event: 'conversion'
        }])
        .select()
        .single();

      if (expError) throw expError;

      const { error: varError } = await supabase
        .from("experiment_variants")
        .insert([
          { experiment_id: exp.id, name: "Control", weight: 50, is_control: true },
          { experiment_id: exp.id, name: "Variant A", weight: 50, is_control: false }
        ]);

      if (varError) throw varError;

      toast({ title: "Experiment created", description: "Configure your variants and start testing." });
      setIsCreateOpen(false);
      setNewExpName("");
      setNewExpDescription("");
      fetchExperiments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleManage = (exp: Experiment) => {
    setManagedExp(exp);
    setEditingVariants(exp.variants ? [...exp.variants] : []);
    setEditTargetUrl(exp.target_url);
    setEditGoalEvent(exp.goal_event);
    setIsManageOpen(true);
  };

  const handleSaveExperiment = async () => {
    if (!managedExp) return;
    setSaving(true);
    try {
      // Update experiment settings
      const { error: expError } = await supabase
        .from("experiments")
        .update({ target_url: editTargetUrl, goal_event: editGoalEvent })
        .eq("id", managedExp.id);
      if (expError) throw expError;

      // Update each variant
      for (const variant of editingVariants) {
        if (variant.id) {
          const { error: varError } = await supabase
            .from("experiment_variants")
            .update({ name: variant.name, weight: variant.weight })
            .eq("id", variant.id);
          if (varError) throw varError;
        }
      }

      toast({ title: "Experiment updated" });
      setIsManageOpen(false);
      setManagedExp(null);
      fetchExperiments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (exp: Experiment, newStatus: "draft" | "active" | "paused" | "ended") => {
    try {
      const { error } = await supabase
        .from("experiments")
        .update({ status: newStatus })
        .eq("id", exp.id);
      if (error) throw error;

      toast({ title: `Experiment ${newStatus}`, description: `"${exp.name}" is now ${newStatus}.` });
      setIsManageOpen(false);
      setManagedExp(null);
      fetchExperiments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!managedExp) return;
    try {
      // Delete variants first (foreign key constraint)
      const { error: varError } = await supabase
        .from("experiment_variants")
        .delete()
        .eq("experiment_id", managedExp.id);
      if (varError) throw varError;

      const { error: expError } = await supabase
        .from("experiments")
        .delete()
        .eq("id", managedExp.id);
      if (expError) throw expError;

      toast({ title: "Experiment deleted" });
      setIsDeleteOpen(false);
      setIsManageOpen(false);
      setManagedExp(null);
      fetchExperiments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAddVariant = async () => {
    if (!managedExp) return;
    try {
      const variantName = `Variant ${String.fromCharCode(65 + editingVariants.length - 1)}`;
      const { data, error } = await supabase
        .from("experiment_variants")
        .insert([{
          experiment_id: managedExp.id,
          name: variantName,
          weight: 0,
          is_control: false,
        }])
        .select()
        .single();

      if (error) throw error;
      setEditingVariants([...editingVariants, data as ExperimentVariant]);
      toast({ title: "Variant added" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveVariant = async (variantId: string) => {
    try {
      const { error } = await supabase
        .from("experiment_variants")
        .delete()
        .eq("id", variantId);
      if (error) throw error;

      setEditingVariants(editingVariants.filter(v => v.id !== variantId));
      toast({ title: "Variant removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'ended': return <CheckCircle2 className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'ended': return 'secondary';
      default: return 'outline';
    }
  };

  // Calculate stats
  const totalExperiments = experiments.length;
  const activeExperiments = experiments.filter(e => e.status === 'active').length;
  const completedExperiments = experiments.filter(e => e.status === 'ended').length;
  const totalVariants = experiments.reduce((sum, e) => sum + (e.variants?.length || 0), 0);

  // Show loading while sites are being fetched
  if (sitesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // Redirect if no site ID in URL but sites exist
  if (!siteIdParam && sites.length > 0) {
    navigate(`/dashboard/sites/${sites[0].id}/experiments`, { replace: true });
    return null;
  }

  if (!siteId || !site) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No site selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a site to view A/B tests.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/sites/${siteId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">A/B Testing</h1>
              <p className="text-muted-foreground">{site.name}</p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Experiment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Experiment</DialogTitle>
                <DialogDescription>
                  Set up a new A/B test to optimize your site performance.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Experiment Name</Label>
                  <Input
                    id="name"
                    value={newExpName}
                    onChange={e => setNewExpName(e.target.value)}
                    placeholder="e.g. Hero Headline Test"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={newExpDescription}
                    onChange={e => setNewExpDescription(e.target.value)}
                    placeholder="What are you testing?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newExpName}>Create Experiment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FlaskConical className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{totalExperiments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Play className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeExperiments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedExperiments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Variants</p>
                  <p className="text-2xl font-bold">{totalVariants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Experiments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Experiments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : experiments.length === 0 ? (
              <div className="text-center py-12">
                <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No experiments yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Create your first A/B test to start optimizing your site's performance.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Experiment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Experiment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Target URL</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experiments.map(exp => (
                    <TableRow key={exp.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium">{exp.name}</p>
                          {exp.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(exp.status)} className="gap-1">
                          {getStatusIcon(exp.status)}
                          {exp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {exp.variants?.length || 0} variants
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {exp.target_url}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleManage(exp)}
                        >
                          <Settings2 className="h-4 w-4" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">A/B Testing Best Practices</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Test one variable at a time for clear results</li>
              <li>• Run tests until you reach statistical significance</li>
              <li>• Start with high-impact pages like landing pages</li>
              <li>• Document your hypotheses before starting each test</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Manage Experiment Dialog */}
      <Dialog open={isManageOpen} onOpenChange={(open) => {
        setIsManageOpen(open);
        if (!open) setManagedExp(null);
      }}>
        <DialogContent className="sm:max-w-[550px]">
          {managedExp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  {managedExp.name}
                </DialogTitle>
                <DialogDescription>
                  {managedExp.description || "Manage experiment settings, variants, and status."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {/* Status & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={getStatusVariant(managedExp.status)} className="gap-1">
                      {getStatusIcon(managedExp.status)}
                      {managedExp.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {managedExp.status === "draft" && (
                      <Button size="sm" onClick={() => handleStatusChange(managedExp, "active")}>
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                    {managedExp.status === "active" && (
                      <Button size="sm" variant="secondary" onClick={() => handleStatusChange(managedExp, "ended")}>
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    )}
                    {managedExp.status === "ended" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(managedExp, "draft")}>
                        Reset to Draft
                      </Button>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="target_url" className="text-sm">Target URL</Label>
                    <Input
                      id="target_url"
                      value={editTargetUrl}
                      onChange={e => setEditTargetUrl(e.target.value)}
                      placeholder="/"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="goal_event" className="text-sm">Goal Event</Label>
                    <Input
                      id="goal_event"
                      value={editGoalEvent}
                      onChange={e => setEditGoalEvent(e.target.value)}
                      placeholder="conversion"
                    />
                  </div>
                </div>

                {/* Variants */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Variants</Label>
                    <Button variant="outline" size="sm" onClick={handleAddVariant}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Variant
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingVariants.map((variant, i) => (
                      <div key={variant.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                        <div className="flex-1">
                          <Input
                            value={variant.name}
                            onChange={e => {
                              const updated = [...editingVariants];
                              updated[i] = { ...variant, name: e.target.value };
                              setEditingVariants(updated);
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-1 w-24">
                          <Input
                            type="number"
                            value={variant.weight}
                            onChange={e => {
                              const updated = [...editingVariants];
                              updated[i] = { ...variant, weight: parseInt(e.target.value) || 0 };
                              setEditingVariants(updated);
                            }}
                            className="h-8 text-sm w-16"
                            min={0}
                            max={100}
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                        {variant.is_control ? (
                          <Badge variant="outline" className="text-xs shrink-0">Control</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveVariant(variant.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {editingVariants.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Total weight: {editingVariants.reduce((s, v) => s + v.weight, 0)}%
                      {editingVariants.reduce((s, v) => s + v.weight, 0) !== 100 && (
                        <span className="text-destructive ml-1">(should be 100%)</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Results Section */}
                {managedExp.status !== 'draft' && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Results
                    </h4>
                    <ExperimentResults experimentId={managedExp.id} />
                  </div>
                )}
              </div>

              <DialogFooter className="flex-row justify-between sm:justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsManageOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveExperiment} disabled={saving}>
                    {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experiment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{managedExp?.name}"? This will also delete all variants and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout >
  );
}