import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Monitor, Smartphone, Tablet, Globe, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SessionManagement() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  // Parse user agent to get device info
  const parseUserAgent = (ua: string) => {
    let browser = "Unknown Browser";
    let os = "Unknown OS";
    let deviceType = "desktop";

    // Detect browser
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edg")) browser = "Edge";

    // Detect OS
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    // Detect device type
    if (ua.includes("Mobile") || ua.includes("Android") && !ua.includes("Tablet")) {
      deviceType = "mobile";
    } else if (ua.includes("Tablet") || ua.includes("iPad")) {
      deviceType = "tablet";
    }

    return { browser, os, deviceType };
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been signed out from all devices",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setSigningOut(false);
    }
  };

  // Current session info
  const currentUA = navigator.userAgent;
  const { browser, os, deviceType } = parseUserAgent(currentUA);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active sessions across devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {getDeviceIcon(deviceType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{browser} on {os}</p>
                <Badge variant="default" className="bg-green-500 text-xs">
                  Current
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Last active: Just now
              </p>
            </div>
          </div>
        </div>

        {/* Session info */}
        <div className="space-y-2 p-4 border rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Session started</span>
            <span>
              {session?.access_token 
                ? new Date(session.expires_at! * 1000 - 3600000).toLocaleString()
                : "Unknown"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Session expires</span>
            <span>
              {session?.expires_at 
                ? new Date(session.expires_at * 1000).toLocaleString()
                : "Unknown"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Authentication level</span>
            <span>Standard</span>
          </div>
        </div>

        {/* Sign out all */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out All Devices
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out all devices?</AlertDialogTitle>
              <AlertDialogDescription>
                This will sign you out from all devices including this one.
                You will need to sign in again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOutAll}
                disabled={signingOut}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {signingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  "Sign Out All"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
