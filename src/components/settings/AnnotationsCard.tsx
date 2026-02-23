import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, Plus, Trash2, Edit2, Loader2, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAnnotations, useCreateAnnotation, useUpdateAnnotation, useDeleteAnnotation, Annotation } from "@/hooks/useAnnotations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AnnotationsCardProps {
    siteId: string;
}

const CATEGORIES = ["Deploy", "Campaign", "Redesign", "Custom"];
const COLORS = [
    { label: "Blue", value: "#3b82f6" },
    { label: "Green", value: "#10b981" },
    { label: "Red", value: "#ef4444" },
    { label: "Yellow", value: "#f59e0b" },
    { label: "Purple", value: "#8b5cf6" },
    { label: "Pink", value: "#ec4899" },
];

export function AnnotationsCard({ siteId }: AnnotationsCardProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const { data: annotations, isLoading } = useAnnotations(siteId);
    const createMutation = useCreateAnnotation();
    const updateMutation = useUpdateAnnotation();
    const deleteMutation = useDeleteAnnotation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [color, setColor] = useState(COLORS[0].value);
    const [date, setDate] = useState<Date>(new Date());

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setCategory(CATEGORIES[0]);
        setColor(COLORS[0].value);
        setDate(new Date());
        setEditingId(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (annotation: Annotation) => {
        setEditingId(annotation.id);
        setTitle(annotation.title);
        setDescription(annotation.description || "");
        setCategory(annotation.category);
        setColor(annotation.color);
        setDate(new Date(annotation.annotation_date));
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            if (editingId) {
                await updateMutation.mutateAsync({
                    id: editingId,
                    site_id: siteId,
                    title,
                    description,
                    category,
                    color,
                    annotation_date: date.toISOString(),
                });
                toast({ title: "Success", description: "Annotation updated" });
            } else {
                await createMutation.mutateAsync({
                    site_id: siteId,
                    user_id: user.id,
                    title,
                    description,
                    category,
                    color,
                    annotation_date: date.toISOString(),
                });
                toast({ title: "Success", description: "Annotation created" });
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this annotation?")) return;
        try {
            await deleteMutation.mutateAsync({ id, siteId });
            toast({ title: "Deleted", description: "Annotation removed" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Bookmark className="h-5 w-5" />
                        Annotations
                    </CardTitle>
                    <CardDescription>
                        Mark important events on your charts like deployments, campaigns, or redesigns.
                    </CardDescription>
                </div>
                <Button onClick={handleOpenCreate} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Annotation
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : !annotations || annotations.length === 0 ? (
                    <div className="text-center p-8 bg-muted/20 rounded-lg border border-dashed border-border/50">
                        <Bookmark className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                        <h3 className="text-sm font-medium mb-1">No annotations yet</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Create markers to overlay on your traffic charts and see how specific events impact your metrics.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {annotations.map((annotation) => (
                            <div key={annotation.id} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: annotation.color }} />
                                        <h4 className="font-medium text-sm">{annotation.title}</h4>
                                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                            {format(new Date(annotation.annotation_date), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                    {annotation.description && (
                                        <p className="text-xs text-muted-foreground pl-4 mt-1">
                                            {annotation.description}
                                        </p>
                                    )}
                                    <span className="text-xs text-muted-foreground pl-4 block mt-1">
                                        {annotation.category}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(annotation)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(annotation.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Annotation" : "Create Annotation"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Product Launch v2.0"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => d && setDate(d)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <Select value={color} onValueChange={setColor}>
                                        <SelectTrigger>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COLORS.map(c => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.value }} />
                                                        {c.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add more details about this event..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? "Save Changes" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
