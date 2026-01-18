import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Check, Lock, Cookie, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-background font-sans relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Shield className="h-5 w-5 text-primary-foreground" />
                            </div>
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

            <main className="container mx-auto px-4 lg:px-8 py-16 max-w-5xl">
                <div className="text-center mb-16 relative">
                    <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                        <Lock className="h-3.5 w-3.5 mr-2" />
                        Privacy Focused
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Why Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-success to-emerald-600">Matters</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                        We believe you can get useful insights without invasive tracking.
                        Respect your users, and they will respect you back.
                    </p>
                </div>

                <div className="grid gap-12 mb-20">
                    <div className="prose prose-lg dark:prose-invert max-w-none text-center">
                        <h3 className="text-2xl font-bold mb-4">The Problem with Traditional Analytics</h3>
                        <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Traditional analytics tools (like Google Analytics) track individual users across the web to build profiles for advertising. To do this, they set invasive cookies on visitors' devices. This requires you to show annoying "Cookie Consent" banners, leading to "Compliance Fatigue" and a poor user experience.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                                    <Cookie className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>No Cookies</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                We don't use cookies to track visitors. This means you don't need those annoying cookie banners.
                            </CardContent>
                        </Card>

                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-secondary/50 transition-all hover:shadow-lg">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                                    <EyeOff className="h-6 w-6 text-secondary" />
                                </div>
                                <CardTitle>No Personal Data</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                IP addresses are anonymized (hashed) immediately. We can't identify individuals even if we wanted to.
                            </CardContent>
                        </Card>

                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-accent/50 transition-all hover:shadow-lg">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                                    <Check className="h-6 w-6 text-accent" />
                                </div>
                                <CardTitle>GDPR Compliant</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                Fully compliant with GDPR, CCPA, and PECR. Your data never leaves our secure servers (or yours, if self-hosted).
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                    <div className="relative z-10 max-w-xl">
                        <h3 className="text-2xl font-bold mb-4">Do I need a cookie banner?</h3>
                        <p className="text-muted-foreground text-lg mb-6">
                            <strong>No.</strong> Because mmmetric doesn't collect personal data or use tracking cookies, you strictly do not need to display a cookie consent banner for our analytics.
                        </p>
                        <Button asChild size="lg" className="rounded-full">
                            <Link to="/auth">
                                Start Tracking Privacy-First <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                    <div className="relative z-10 bg-background/50 backdrop-blur rounded-2xl p-6 border border-border/50 shadow-sm max-w-xs text-center transform rotate-3">
                        <div className="text-4xl font-bold text-success mb-2">15%</div>
                        <div className="text-sm font-medium text-muted-foreground">Higher Conversion Rate <br />without Cookie Banners</div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-border py-8 mt-16 bg-muted/20">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} mmmetric Analytics.
                </div>
            </footer>
        </div>
    );
}
