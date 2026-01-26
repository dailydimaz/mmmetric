import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LookerStudioCardProps {
    siteId: string;
}

export function LookerStudioCard({ siteId }: LookerStudioCardProps) {
    const { toast } = useToast();

    // This would be the URL of your deployed connector or a direct Postgres connection string
    const connectorUrl = "https://lookerstudio.google.com/datasources/create?connectorId=YOUR_CONNECTOR_ID";
    const apiEndpoint = `https://your-api.com/v1/sites/${siteId}/query`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Copied to clipboard" });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Looker Studio Connector</CardTitle>
                <CardDescription>Connect your analytics data to Google Looker Studio for custom reporting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Use our official connector to fetch your data. You will need your API Key and the Site ID below.
                    </p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Input value={siteId} readOnly />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(siteId)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Site ID</p>
                </div>

                <Button className="w-full" variant="secondary" onClick={() => window.open(connectorUrl, '_blank')}>
                    Open Looker Studio
                </Button>
            </CardContent>
        </Card>
    );
}
