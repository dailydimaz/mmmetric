
import { useState, useEffect } from "react";
import { Copy, QrCode, History, RotateCcw, ArrowRight, ExternalLink, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Textarea } from "@/components/ui/textarea";

interface CampaignParams {
    website: string;
    source: string;
    medium: string;
    name: string;
    term: string;
    content: string;
}

interface SavedUrl {
    url: string;
    params: CampaignParams;
    createdAt: string;
}

export default function CampaignBuilder() {
    const { toast } = useToast();
    const [params, setParams] = useState<CampaignParams>({
        website: "",
        source: "",
        medium: "",
        name: "",
        term: "",
        content: "",
    });

    const [generatedUrl, setGeneratedUrl] = useState("");
    const [history, setHistory] = useState<SavedUrl[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Load history from localStorage
        const savedHistory = localStorage.getItem("campaign_builder_history");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    useEffect(() => {
        // Generate URL
        if (!params.website) {
            setGeneratedUrl("");
            return;
        }

        try {
            let baseUrl = params.website;
            if (!baseUrl.match(/^https?:\/\//)) {
                baseUrl = "https://" + baseUrl;
            }

            const url = new URL(baseUrl);

            if (params.source) url.searchParams.set("utm_source", params.source);
            if (params.medium) url.searchParams.set("utm_medium", params.medium);
            if (params.name) url.searchParams.set("utm_campaign", params.name);
            if (params.term) url.searchParams.set("utm_term", params.term);
            if (params.content) url.searchParams.set("utm_content", params.content);

            setGeneratedUrl(url.toString());
        } catch (e) {
            // Invalid URL, just ignore
            setGeneratedUrl("");
        }
    }, [params]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setParams((prev) => ({ ...prev, [name]: value }));
    };

    const handleCopy = () => {
        if (!generatedUrl) return;

        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        toast({
            title: "Copied to clipboard",
            description: "The campaign URL has been copied.",
        });

        // Save to history if distinct from last entry
        const newEntry: SavedUrl = {
            url: generatedUrl,
            params: { ...params },
            createdAt: new Date().toISOString(),
        };

        setHistory((prev) => {
            const newHistory = [newEntry, ...prev.filter(h => h.url !== generatedUrl)].slice(0, 10);
            localStorage.setItem("campaign_builder_history", JSON.stringify(newHistory));
            return newHistory;
        });

        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setParams({
            website: "",
            source: "",
            medium: "",
            name: "",
            term: "",
            content: "",
        });
    };

    const loadFromHistory = (entry: SavedUrl) => {
        setParams(entry.params);
    };

    return (
        <DashboardLayout>
            <div className="container max-w-6xl py-8 space-y-8 animate-fade-in">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Campaign URL Builder</h1>
                    <p className="text-muted-foreground">
                        Generate custom campaign parameters for your advertising URLs.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Campaign Parameters</CardTitle>
                                <CardDescription>
                                    Enter the details of your campaign. Fields marked with * are recommended.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website URL *</Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="website"
                                            name="website"
                                            placeholder="https://example.com"
                                            className="pl-9"
                                            value={params.website}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">The full website URL (e.g. https://www.example.com)</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="source">Campaign Source *</Label>
                                        <Input
                                            id="source"
                                            name="source"
                                            placeholder="google, newsletter"
                                            value={params.source}
                                            onChange={handleChange}
                                        />
                                        <p className="text-xs text-muted-foreground">The referrer: (e.g. google, newsletter)</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="medium">Campaign Medium *</Label>
                                        <Input
                                            id="medium"
                                            name="medium"
                                            placeholder="cpc, banner, email"
                                            value={params.medium}
                                            onChange={handleChange}
                                        />
                                        <p className="text-xs text-muted-foreground">Marketing medium: (e.g. cpc, banner, email)</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Campaign Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="summer_sale"
                                        value={params.name}
                                        onChange={handleChange}
                                    />
                                    <p className="text-xs text-muted-foreground">Product, promo code, or slogan (e.g. spring_sale)</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="term">Campaign Term</Label>
                                        <Input
                                            id="term"
                                            name="term"
                                            placeholder="running+shoes"
                                            value={params.term}
                                            onChange={handleChange}
                                        />
                                        <p className="text-xs text-muted-foreground">Identify the paid keywords</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="content">Campaign Content</Label>
                                        <Input
                                            id="content"
                                            name="content"
                                            placeholder="logolink, textlink"
                                            value={params.content}
                                            onChange={handleChange}
                                        />
                                        <p className="text-xs text-muted-foreground">Use to differentiate ads</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-between border-t px-6 py-4">
                                <Button variant="ghost" onClick={handleReset} className="gap-2">
                                    <RotateCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Preview Section */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="overflow-hidden border-primary/20 shadow-lg transition-all duration-300">
                            <CardHeader className="bg-primary/5 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ExternalLink className="h-5 w-5 text-primary" />
                                    Generated URL
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="p-4 bg-muted rounded-lg break-all font-mono text-sm min-h-[5rem] flex items-center">
                                    {generatedUrl || <span className="text-muted-foreground italic">Fill in the website URL to see the result...</span>}
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 gap-2"
                                        onClick={handleCopy}
                                        disabled={!generatedUrl}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? "Copied!" : "Copy URL"}
                                    </Button>
                                </div>

                                {generatedUrl && (
                                    <div className="border-t pt-6 text-center">
                                        <Label className="mb-4 block text-muted-foreground">QR Code</Label>
                                        <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generatedUrl)}`}
                                                alt="Campaign QR Code"
                                                className="w-40 h-40"
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* History Section */}
                        {history.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <History className="h-5 w-5" />
                                        Recent Campaigns
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y max-h-[400px] overflow-y-auto">
                                        {history.map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() => loadFromHistory(item)}
                                                className="w-full text-left p-4 hover:bg-muted/50 transition-colors group flex items-start gap-3"
                                            >
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <p className="font-medium text-sm truncate">{item.params.website}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.params.source && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                                                src:{item.params.source}
                                                            </span>
                                                        )}
                                                        {item.params.name && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                                                cmp:{item.params.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
