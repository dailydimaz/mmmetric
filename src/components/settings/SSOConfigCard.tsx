import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";

interface SSOConfigCardProps {
    siteId: string;
}

export function SSOConfigCard({ siteId }: SSOConfigCardProps) {
    return (
        <Card className="opacity-75">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    SSO / SAML
                    <Badge variant="secondary">Enterprise</Badge>
                </CardTitle>
                <CardDescription>Configure Single Sign-On for your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center space-y-4">
                    <ShieldAlert className="h-10 w-10 text-muted-foreground" />
                    <div className="space-y-1">
                        <h3 className="font-medium">Enterprise Only</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            SSO via Google Workspace, Okta, and Azure AD is available on the Enterprise plan.
                        </p>
                    </div>
                    <Button variant="outline">Contact Sales to Upgrade</Button>
                </div>
            </CardContent>
        </Card>
    );
}
