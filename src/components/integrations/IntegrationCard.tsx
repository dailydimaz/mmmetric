import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ExternalLink, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IntegrationCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    isConnected: boolean;
    onConnect: () => void;
    onDisconnect?: () => void;
    onConfigure?: () => void;
    isLoading?: boolean;
}

export function IntegrationCard({
    title,
    description,
    icon,
    isConnected,
    onConnect,
    onDisconnect,
    onConfigure,
    isLoading,
}: IntegrationCardProps) {
    return (
        <Card className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-white/5 hover:border-white/10 transition-all duration-300">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
                    {isConnected && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Connected
                        </Badge>
                    )}
                </div>
                <CardTitle className="mt-4">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {/* Placeholder for future status details */}
            </CardContent>
            <CardFooter className="gap-2">
                {isConnected ? (
                    <>
                        <Button variant="outline" className="w-full" onClick={onConfigure}>
                            Settings
                        </Button>
                        {onDisconnect && (
                            <Button variant="destructive" className="w-full" onClick={onDisconnect} disabled={isLoading}>
                                Disconnect
                            </Button>
                        )}
                    </>
                ) : (
                    <Button className="w-full" onClick={onConnect} disabled={isLoading}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Connect
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
