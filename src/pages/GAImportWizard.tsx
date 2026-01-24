import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, ChevronRight, Download, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function GAImportWizard() {
    const { siteId } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

    const handleConnect = async () => {
        setLoading(true);
        // Simulate OAuth delay
        setTimeout(() => {
            setLoading(false);
            setStep(2);
            // Mock properties
            setProperties([
                { id: "12345", name: "My Website (UA-12345-1)" },
                { id: "67890", name: "My Website GA4 (3456789)" },
            ]);
            toast.success("Connected to Google Account");
        }, 1500);
    };

    const handleImport = async () => {
        if (!selectedProperty || !siteId) return;
        setLoading(true);

        // Create integration record
        const { error } = await supabase.from("integrations").upsert({
            site_id: siteId,
            provider: "google_analytics",
            metadata: { property_id: selectedProperty, last_import: new Date().toISOString() }
        }, { onConflict: "site_id,provider" });

        if (error) {
            toast.error("Failed to save integration");
            setLoading(false);
            return;
        }

        // Simulate import process
        setTimeout(() => {
            setLoading(false);
            setStep(3);
            toast.success("Import started successfully");
        }, 2000);
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
                <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                <div className="flex items-center justify-between mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium border ${step >= s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-input"}`}>
                                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && <div className={`w-24 h-[2px] mx-2 ${step > s ? "bg-primary" : "bg-input"}`} />}
                        </div>
                    ))}
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                    {step === 1 && (
                        <>
                            <CardHeader>
                                <CardTitle>Connect Google Analytics</CardTitle>
                                <CardDescription>Authorize access to your Google Analytics properties to begin the import.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                    <p className="text-sm">We only request read-only access to your analytics data. Your data remains private and secure.</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleConnect} disabled={loading} className="w-full">
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Connect with Google
                                </Button>
                            </CardFooter>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <CardHeader>
                                <CardTitle>Select Property</CardTitle>
                                <CardDescription>Choose the Google Analytics property you want to import data from.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    {properties.map((p) => (
                                        <div
                                            key={p.id}
                                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedProperty === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                                            onClick={() => setSelectedProperty(p.id)}
                                        >
                                            <p className="font-medium">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">ID: {p.id}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={handleImport} disabled={!selectedProperty || loading}>
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Start Import
                                </Button>
                            </CardFooter>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <CardHeader className="text-center">
                                <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                </div>
                                <CardTitle>Import in Progress</CardTitle>
                                <CardDescription>Your data is being imported in the background. This may take a while depending on the data volume.</CardDescription>
                            </CardHeader>
                            <CardFooter className="justify-center">
                                <Button onClick={() => navigate(`/dashboard/sites/${siteId}`)}>
                                    Return to Dashboard
                                </Button>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
