import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface WhiteLabelingCardProps {
    siteId: string;
}

export function WhiteLabelingCard({ siteId }: WhiteLabelingCardProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [brandColor, setBrandColor] = useState("#000000");
    const [brandLogoUrl, setBrandLogoUrl] = useState("");
    const [customDomain, setCustomDomain] = useState("");
    const [customCss, setCustomCss] = useState("");
    const [removeBranding, setRemoveBranding] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, [siteId]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from("sites")
                .select("brand_color, brand_logo_url, custom_domain, custom_css, remove_branding")
                .eq("id", siteId)
                .single();

            if (error) throw error;

            if (data) {
                setBrandColor(data.brand_color || "#000000");
                setBrandLogoUrl(data.brand_logo_url || "");
                setCustomDomain(data.custom_domain || "");
                setCustomCss(data.custom_css || "");
                setRemoveBranding(data.remove_branding || false);
            }
        } catch (error) {
            console.error("Error fetching white label settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${siteId}/${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('brand-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('brand-assets')
                .getPublicUrl(fileName);

            setBrandLogoUrl(publicUrl);
            toast({
                title: "Logo uploaded",
                description: "Your brand logo has been uploaded successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Error uploading logo",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("sites")
                .update({
                    brand_color: brandColor,
                    brand_logo_url: brandLogoUrl,
                    custom_domain: customDomain || null, // Handle empty string for unique constraint
                    custom_css: customCss,
                    remove_branding: removeBranding,
                })
                .eq("id", siteId);

            if (error) throw error;

            toast({
                title: "Settings saved",
                description: "Your white labeling settings have been updated.",
            });
        } catch (error: any) {
            toast({
                title: "Error saving settings",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>White Labeling</CardTitle>
                <CardDescription>
                    Customize the look and feel of your public dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="brandColor">Brand Color</Label>
                    <div className="flex gap-2">
                        <Input
                            id="brandColor"
                            type="color"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="w-12 h-10 p-1"
                        />
                        <Input
                            type="text"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="flex-1"
                            placeholder="#000000"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="brandLogo">Brand Logo</Label>
                    <div className="flex gap-2 items-center">
                        <Input
                            id="brandLogo"
                            value={brandLogoUrl}
                            onChange={(e) => setBrandLogoUrl(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="flex-1"
                        />
                        <div className="relative">
                            <Input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                disabled={uploading}
                            />
                            <Button type="button" variant="outline" disabled={uploading}>
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                            </Button>
                        </div>
                    </div>
                    {brandLogoUrl && (
                        <div className="mt-2 border rounded-md p-2 w-fit bg-muted/20">
                            <img
                                src={brandLogoUrl}
                                alt="Brand Logo Preview"
                                className="h-12 object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customDomain">Custom Domain</Label>
                    <Input
                        id="customDomain"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="analytics.yourdomain.com"
                    />
                    <p className="text-sm text-muted-foreground">
                        Configure your CNAME record to point to our server.
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="removeBranding"
                        checked={removeBranding}
                        onCheckedChange={setRemoveBranding}
                    />
                    <Label htmlFor="removeBranding">Remove "Powered by mmmetric" badge</Label>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customCss">Custom CSS</Label>
                    <Textarea
                        id="customCss"
                        value={customCss}
                        onChange={(e) => setCustomCss(e.target.value)}
                        placeholder=".dashboard-header { background: red; }"
                        rows={5}
                        className="font-mono text-sm"
                    />
                </div>

                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardContent>
        </Card>
    );
}
