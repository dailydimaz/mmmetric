import { Link } from "react-router-dom";
import { ArrowLeft, Terminal, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import mmmetricLogo from "@/assets/mmmetric-logo.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DocsCLI() {
    const { toast } = useToast();
    const [copiedContent, setCopiedContent] = useState<string | null>(null);

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedContent(text);
        toast({ title: "Copied!", description: "Code snippet copied to clipboard." });
        setTimeout(() => setCopiedContent(null), 2000);
    };

    const CodeBlock = ({ code, language }: { code: string; language: string }) => (
        <div className="relative mt-4">
            <div className="absolute top-2 right-2 text-xs text-muted-foreground uppercase">{language}</div>
            <pre className="bg-muted text-foreground p-4 rounded-xl overflow-x-auto text-sm font-mono border border-border mt-2 pt-8">
                <code>{code}</code>
            </pre>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-12 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(code)}
            >
                {copiedContent === code ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background font-sans">
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
                            <span className="font-display text-xl font-bold">mmmetric</span>
                        </Link>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container max-w-4xl mx-auto px-4 lg:px-8 py-12">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                        <Terminal className="h-4 w-4" />
                        API & CLI Documentation
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Public API Documentation</h1>
                    <p className="text-xl text-muted-foreground">
                        Integrate mmmetric into your own tools, build custom dashboards, or export your data via our REST API.
                    </p>
                </div>

                <div className="space-y-16">
                    {/* SECTION 1: AUTHENTICATION */}
                    <section>
                        <h2 className="text-2xl font-bold border-b border-border pb-2 mb-6">1. Authentication</h2>
                        <p className="text-muted-foreground mb-4">
                            All API requests require an API key to be passed in the headers. You can generate one from your Dashboard &gt; API Keys settings.
                        </p>
                        <CodeBlock
                            language="HEADER"
                            code={`Authorization: Bearer YOUR_API_KEY\nx-api-key: YOUR_API_KEY`}
                        />
                    </section>

                    {/* SECTION 2: COMMON COMMANDS */}
                    <section>
                        <h2 className="text-2xl font-bold border-b border-border pb-2 mb-6">2. Common Commands</h2>

                        <div className="space-y-12">
                            {/* List Sites */}
                            <div>
                                <h3 className="text-xl font-semibold mb-2">List Sites</h3>
                                <p className="text-muted-foreground mb-4">Retrieve all sites associated with your account.</p>
                                <Tabs defaultValue="curl">
                                    <TabsList>
                                        <TabsTrigger value="curl">cURL</TabsTrigger>
                                        <TabsTrigger value="js">JavaScript</TabsTrigger>
                                        <TabsTrigger value="python">Python</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="curl">
                                        <CodeBlock language="BASH" code={`curl -X GET "https://api.mmmetric.com/v1/sites" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`} />
                                    </TabsContent>
                                    <TabsContent value="js">
                                        <CodeBlock language="JS" code={`fetch('https://api.mmmetric.com/v1/sites', {\n  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }\n})\n  .then(res => res.json())\n  .then(console.log);`} />
                                    </TabsContent>
                                    <TabsContent value="python">
                                        <CodeBlock language="PYTHON" code={`import requests\n\nheaders = {'Authorization': 'Bearer YOUR_API_KEY'}\nresponse = requests.get('https://api.mmmetric.com/v1/sites', headers=headers)\nprint(response.json())`} />
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Get Stats */}
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Get Stats</h3>
                                <p className="text-muted-foreground mb-4">Fetch aggregated analytics for a specific site over a date range.</p>
                                <Tabs defaultValue="curl">
                                    <TabsList>
                                        <TabsTrigger value="curl">cURL</TabsTrigger>
                                        <TabsTrigger value="js">JavaScript</TabsTrigger>
                                        <TabsTrigger value="python">Python</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="curl">
                                        <CodeBlock language="BASH" code={`curl -X GET "https://api.mmmetric.com/v1/stats?site_id=SITE_ID&start_date=2024-01-01&end_date=2024-01-31" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`} />
                                    </TabsContent>
                                    <TabsContent value="js">
                                        <CodeBlock language="JS" code={`const params = new URLSearchParams({\n  site_id: 'SITE_ID',\n  start_date: '2024-01-01',\n  end_date: '2024-01-31'\n});\n\nfetch(\`https://api.mmmetric.com/v1/stats?$\{params}\`, {\n  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }\n})\n  .then(res => res.json())\n  .then(console.log);`} />
                                    </TabsContent>
                                    <TabsContent value="python">
                                        <CodeBlock language="PYTHON" code={`import requests\n\nurl = 'https://api.mmmetric.com/v1/stats'\nparams = {'site_id': 'SITE_ID', 'start_date': '2024-01-01', 'end_date': '2024-01-31'}\nheaders = {'Authorization': 'Bearer YOUR_API_KEY'}\n\nresponse = requests.get(url, params=params, headers=headers)\nprint(response.json())`} />
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Export Data */}
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Export Events (CSV)</h3>
                                <p className="text-muted-foreground mb-4">Download a CSV of raw events for a site.</p>
                                <Tabs defaultValue="curl">
                                    <TabsList>
                                        <TabsTrigger value="curl">cURL</TabsTrigger>
                                        <TabsTrigger value="js">JavaScript</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="curl">
                                        <CodeBlock language="BASH" code={`curl -X GET "https://api.mmmetric.com/v1/export?site_id=SITE_ID&format=csv" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -o export.csv`} />
                                    </TabsContent>
                                    <TabsContent value="js">
                                        <CodeBlock language="JS" code={`// In Node.js environment\nconst fs = require('fs');\nconst { pipeline } = require('stream/promises');\n\nasync function downloadCsv() {\n  const res = await fetch('https://api.mmmetric.com/v1/export?site_id=SITE_ID&format=csv', {\n    headers: { 'Authorization': 'Bearer YOUR_API_KEY' }\n  });\n  await pipeline(res.body, fs.createWriteStream('export.csv'));\n}`} />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
