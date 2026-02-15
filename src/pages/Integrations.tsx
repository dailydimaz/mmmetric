import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { ShopifyConnectDialog } from "@/components/integrations/ShopifyConnectDialog";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BarChart3, Search, ShoppingBag } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { isBillingEnabled } from "@/lib/billing";

export default function Integrations() {
    const { siteId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [shopifyDialogOpen, setShopifyDialogOpen] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const isCloud = isBillingEnabled();

    const { data: integrations } = useQuery({
        queryKey: ["integrations", siteId],
        queryFn: async () => {
            if (!siteId) return [];
            const { data, error } = await supabase
                .from("integrations")
                .select("id, site_id, provider, expires_at, metadata, is_active, last_sync_at, created_at, updated_at")
                .eq("site_id", siteId);

            if (error) throw error;
            return data;
        },
        enabled: !!siteId,
    });

    const isConnected = (provider: string) => {
        return integrations?.some((i) => i.provider === provider && i.is_active) ?? false;
    };

    const getIntegrationMeta = (provider: string) => {
        return integrations?.find((i) => i.provider === provider);
    };

    const handleConnect = (provider: string) => {
        if (provider === "google_analytics") {
            navigate(`/dashboard/sites/${siteId}/integrations/ga-import`);
        } else if (provider === "shopify") {
            setShopifyDialogOpen(true);
        } else if (provider === "google_search_console") {
            navigate(`/dashboard/sites/${siteId}/gsc`);
        }
    };

    const handleDisconnectShopify = async () => {
        if (!siteId) return;
        setDisconnecting(true);
        try {
            const response = await supabase.functions.invoke("shopify-connect", {
                body: { siteId, action: "disconnect" },
            });
            if (response.error) throw response.error;
            toast.success("Shopify disconnected");
            queryClient.invalidateQueries({ queryKey: ["integrations", siteId] });
        } catch {
            toast.error("Failed to disconnect Shopify");
        } finally {
            setDisconnecting(false);
        }
    };

    const handleSyncShopify = async () => {
        if (!siteId) return;
        toast.info("Syncing Shopify orders...");
        try {
            const response = await supabase.functions.invoke("shopify-sync", {
                body: { siteId },
            });
            if (response.error) throw response.error;
            const data = response.data;
            if (data?.results?.[0]?.ordersImported !== undefined) {
                toast.success(`Synced ${data.results[0].ordersImported} orders`);
            } else {
                toast.success("Sync complete");
            }
            queryClient.invalidateQueries({ queryKey: ["integrations", siteId] });
        } catch {
            toast.error("Sync failed");
        }
    };

    const shopifyMeta = getIntegrationMeta("shopify");
    const shopifyConnected = isConnected("shopify");

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Integrations
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Connect your favorite tools to supercharge your analytics.
                    </p>
                </div>

                {/* Active Integrations */}
                {isCloud && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Available Integrations</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <IntegrationCard
                                title="Shopify"
                                description="Connect your Shopify store to track revenue, orders, and attribution automatically."
                                icon={<ShoppingBag className="w-6 h-6 text-green-500" />}
                                isConnected={shopifyConnected}
                                onConnect={() => handleConnect("shopify")}
                                onDisconnect={handleDisconnectShopify}
                                onConfigure={handleSyncShopify}
                                isLoading={disconnecting}
                            />
                        </div>
                        {shopifyConnected && shopifyMeta && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Connected to <strong>{(shopifyMeta.metadata as any)?.shop_name}</strong>
                                {shopifyMeta.last_sync_at && (
                                    <> · Last synced {new Date(shopifyMeta.last_sync_at).toLocaleString()}</>
                                )}
                            </p>
                        )}
                    </div>
                )}

                {/* Coming Soon Section */}
                <div className="mt-4">
                    <h2 className="text-lg font-semibold text-muted-foreground mb-4">Coming Soon</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {!isCloud && (
                            <div className="relative">
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                                    <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Cloud Only</span>
                                </div>
                                <IntegrationCard
                                    title="Shopify"
                                    description="Connect your Shopify store to track revenue, orders, and attribution automatically."
                                    icon={<ShoppingBag className="w-6 h-6 text-green-500 opacity-50" />}
                                    isConnected={false}
                                    onConnect={() => {}}
                                />
                            </div>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Coming Soon</span>
                            </div>
                            <IntegrationCard
                                title="Google Analytics Import"
                                description="Import your historical data from Universal Analytics or GA4 to maintain your data history."
                                icon={<BarChart3 className="w-6 h-6 text-orange-500 opacity-50" />}
                                isConnected={false}
                                onConnect={() => {}}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Coming Soon</span>
                            </div>
                            <IntegrationCard
                                title="Google Search Console"
                                description="Monitor your organic search presence, keywords, and click-through rates."
                                icon={<Search className="w-6 h-6 text-blue-500 opacity-50" />}
                                isConnected={false}
                                onConnect={() => {}}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {siteId && (
                <ShopifyConnectDialog
                    open={shopifyDialogOpen}
                    onOpenChange={setShopifyDialogOpen}
                    siteId={siteId}
                    onConnected={() => {
                        queryClient.invalidateQueries({ queryKey: ["integrations", siteId] });
                    }}
                />
            )}
        </DashboardLayout>
    );
}
