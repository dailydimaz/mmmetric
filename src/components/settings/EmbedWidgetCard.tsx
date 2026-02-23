import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePublicDashboard } from "@/hooks/usePublicDashboard";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmbedWidgetCardProps {
    siteId: string;
}

export function EmbedWidgetCard({ siteId }: EmbedWidgetCardProps) {
    const { toast } = useToast();
    const { config } = usePublicDashboard(siteId);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [widgetType, setWidgetType] = useState<"badge" | "counter">("badge");
    const [theme, setTheme] = useState<"light" | "dark">("light");

    const copyToClipboard = async (text: string, fieldName: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast({ title: "Copied", description: `${fieldName} copied to clipboard` });
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (!config || !config.is_enabled) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Embed Widgets
                    </CardTitle>
                    <CardDescription>
                        Generate badges to show your live stats on your website or GitHub README.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg flex items-center justify-between">
                        <span>You need to enable your Public Dashboard first to use embed widgets.</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const widgetUrl = `${supabaseUrl}/functions/v1/embed-widget?token=${config.share_token}&type=${widgetType}&theme=${theme}`;

    // Fallback image tag for preview if environment variables are not set
    const previewUrl = widgetUrl;

    const htmlCode = `<a href="https://yourdomain.com/statistics" target="_blank"><img src="${widgetUrl}" alt="Analytics Stats" /></a>`;
    const markdownCode = `[![Analytics Stats](${widgetUrl})](https://yourdomain.com/statistics)`;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            Embed Widgets
                        </CardTitle>
                        <CardDescription>
                            Show off your live traffic stats on external sites or GitHub repositories.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>Widget Type</Label>
                            <RadioGroup value={widgetType} onValueChange={(v) => setWidgetType(v as "badge" | "counter")} className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="badge" id="type-badge" />
                                    <Label htmlFor="type-badge" className="font-normal">Minimal Badge (Views Only)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="counter" id="type-counter" />
                                    <Label htmlFor="type-counter" className="font-normal">Detailed Counter (Views & Visitors)</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-3">
                            <Label>Theme</Label>
                            <RadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")} className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="light" id="theme-light" />
                                    <Label htmlFor="theme-light" className="font-normal">Light</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="dark" id="theme-dark" />
                                    <Label htmlFor="theme-dark" className="font-normal">Dark</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col items-center justify-center space-y-4 bg-muted/40 p-6 rounded-lg border border-dashed border-border/60">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
                        <div className="min-h-[60px] flex items-center justify-center">
                            <img src={previewUrl} alt="Widget Preview" className="max-w-full drop-shadow-sm" />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center mt-4">
                            Updates live directly from your analytics database
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <Tabs defaultValue="html" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-[200px] mb-4">
                            <TabsTrigger value="html">HTML</TabsTrigger>
                            <TabsTrigger value="markdown">Markdown</TabsTrigger>
                        </TabsList>

                        <TabsContent value="html">
                            <div className="relative">
                                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono text-muted-foreground">
                                    <code>{htmlCode}</code>
                                </pre>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 h-7"
                                    onClick={() => copyToClipboard(htmlCode, 'HTML Code')}
                                >
                                    {copiedField === 'HTML Code' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="markdown">
                            <div className="relative">
                                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono text-muted-foreground">
                                    <code>{markdownCode}</code>
                                </pre>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 h-7"
                                    onClick={() => copyToClipboard(markdownCode, 'Markdown Code')}
                                >
                                    {copiedField === 'Markdown Code' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
}
