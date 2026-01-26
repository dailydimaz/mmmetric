import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Code, Check, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TagManagerCardProps {
    siteId: string;
}

interface Tag {
    id: string;
    name: string;
    type: "custom_html" | "google_analytics" | "facebook_pixel" | "google_tag_manager" | "custom_script";
    config: any;
    trigger_rules: any[];
    is_enabled: boolean;
    load_priority: number;
}

export function TagManagerCard({ siteId }: TagManagerCardProps) {
    const { toast } = useToast();
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [newTag, setNewTag] = useState<Partial<Tag>>({
        name: "",
        type: "custom_html",
        config: {},
        is_enabled: true,
        load_priority: 100
    });

    const [configStr, setConfigStr] = useState("{}");

    useEffect(() => {
        fetchTags();
    }, [siteId]);

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase
                .from("tags")
                .select("*")
                .eq("site_id", siteId)
                .order("load_priority", { ascending: true });

            if (error) throw error;
            setTags(data as Tag[]);
        } catch (error) {
            console.error("Error fetching tags:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTag.name) {
            toast({ title: "Error", description: "Name is required", variant: "destructive" });
            return;
        }

        try {
            const config = JSON.parse(configStr);

            setIsCreating(true);
            const { error } = await supabase
                .from("tags")
                .insert({
                    site_id: siteId,
                    ...newTag,
                    config,
                } as any);

            if (error) throw error;

            toast({ title: "Success", description: "Tag added successfully" });
            setIsCreateOpen(false);
            fetchTags();
            setNewTag({
                name: "",
                type: "custom_html",
                config: {},
                is_enabled: true,
                load_priority: 100
            });
            setConfigStr("{}");
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Invalid JSON config", variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from("tags").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Success", description: "Tag deleted" });
            setTags(tags.filter(t => t.id !== id));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const toggleEnabled = async (tag: Tag) => {
        try {
            const { error } = await supabase
                .from("tags")
                .update({ is_enabled: !tag.is_enabled })
                .eq("id", tag.id);

            if (error) throw error;

            setTags(tags.map(t => t.id === tag.id ? { ...t, is_enabled: !t.is_enabled } : t));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Tag Manager</CardTitle>
                    <CardDescription>Inject custom scripts and pixels into your site.</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Tag</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Tag</DialogTitle>
                            <DialogDescription>
                                Configure your tag. For custom HTML, enter the script content in the config JSON as <code>{"{ \"html\": \"<script>...</script>\" }"}</code>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Tag Name</Label>
                                <Input value={newTag.name} onChange={e => setNewTag({ ...newTag, name: e.target.value })} placeholder="e.g. Analytics Pixel" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select value={newTag.type} onValueChange={(v: any) => setNewTag({ ...newTag, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="custom_html">Custom HTML</SelectItem>
                                            <SelectItem value="google_analytics">Google Analytics</SelectItem>
                                            <SelectItem value="facebook_pixel">Facebook Pixel</SelectItem>
                                            <SelectItem value="google_tag_manager">Google Tag Manager</SelectItem>
                                            <SelectItem value="custom_script">Custom Script URL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Priority (Lower runs first)</Label>
                                    <Input type="number" value={newTag.load_priority} onChange={e => setNewTag({ ...newTag, load_priority: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Configuration (JSON)</Label>
                                <Textarea
                                    value={configStr}
                                    onChange={e => setConfigStr(e.target.value)}
                                    className="font-mono text-sm"
                                    rows={6}
                                    placeholder='{ "trackingId": "UA-123", "html": "..." }'
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Tag
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {tags.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Code className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No tags configured yet.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tags.map(tag => (
                                <TableRow key={tag.id}>
                                    <TableCell className="font-medium">{tag.name}</TableCell>
                                    <TableCell className="capitalize">{tag.type.replace('_', ' ')}</TableCell>
                                    <TableCell>{tag.load_priority}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => toggleEnabled(tag)} className={tag.is_enabled ? "text-green-500" : "text-muted-foreground"}>
                                            {tag.is_enabled ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                                            {tag.is_enabled ? "Active" : "Disabled"}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}>
                                            <Trash className="h-4 w-4" />
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
