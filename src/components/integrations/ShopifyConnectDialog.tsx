import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, ExternalLink, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShopifyConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  onConnected: () => void;
}

export function ShopifyConnectDialog({ open, onOpenChange, siteId, onConnected }: ShopifyConnectDialogProps) {
  const [shopDomain, setShopDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);

    if (!shopDomain.trim()) {
      setError("Please enter your Shopify store domain");
      return;
    }
    if (!accessToken.trim()) {
      setError("Please enter your Admin API access token");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be signed in");
        return;
      }

      const response = await supabase.functions.invoke("shopify-connect", {
        body: { siteId, shopDomain: shopDomain.trim(), accessToken: accessToken.trim() },
      });

      if (response.error) {
        setError(response.error.message || "Failed to connect");
        return;
      }

      const data = response.data;
      if (!data.success) {
        setError(data.error || "Connection failed");
        return;
      }

      toast.success(`Connected to ${data.shopName}!`);
      setShopDomain("");
      setAccessToken("");
      onOpenChange(false);
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Connect Shopify Store</DialogTitle>
          <DialogDescription>
            Enter your Shopify store details to start tracking revenue and orders automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert className="border-primary/20 bg-primary/5">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your API key is encrypted with AES-256-GCM before storage and never exposed to the browser. Only server-side functions can decrypt it.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="shop-domain">Store Domain</Label>
            <Input
              id="shop-domain"
              placeholder="yourstore.myshopify.com"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Your Shopify store's .myshopify.com domain
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-token">Admin API Access Token</Label>
            <div className="relative">
              <Input
                id="access-token"
                type={showToken ? "text" : "password"}
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a custom app in{" "}
              <a
                href="https://admin.shopify.com/settings/apps/development"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Shopify Admin → Apps → Develop apps
                <ExternalLink className="h-3 w-3" />
              </a>
              {" "}with <code className="text-xs bg-muted px-1 rounded">read_orders</code> scope.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Store
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
