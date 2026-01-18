import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Gauge, ArrowRight, Activity, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Lightweight() {
    return (
        <div className="min-h-screen bg-background font-sans relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Zap className="h-5 w-5 text-primary-foreground" />
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

            <main className="container mx-auto px-4 lg:px-8 py-16 text-center max-w-5xl">
                <div className="mb-20">
                    <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm bg-accent/10 text-accent hover:bg-accent/20 border-accent/20">
                        <Gauge className="h-3.5 w-3.5 mr-2" />
                        Performance & Speed
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Analytics That Doesn't <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-500">Slow You Down</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                        Every kilobyte matters. Keep your site fast, your users happy, and your SEO scores high.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-center justify-center max-w-3xl mx-auto mb-24 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-background rounded-full border border-border flex items-center justify-center z-10 shadow-lg">
                        <span className="font-bold text-sm text-muted-foreground">VS</span>
                    </div>

                    {/* Metric Card */}
                    <Card className="bg-card border-2 border-primary/20 shadow-xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-8">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <Zap className="h-8 w-8" />
                                </div>
                            </div>
                            <div className="text-6xl font-black text-primary mb-2 tracking-tighter">&lt; 2 KB</div>
                            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">Script Size</div>
                            <Badge variant="outline" className="text-xs font-mono">gzipped</Badge>
                        </CardContent>
                    </Card>

                    {/* GA Card */}
                    <Card className="bg-muted/50 border-border border-dashed grayscale hover:grayscale-0 transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex justify-center mb-4">
                                <Activity className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div className="text-6xl font-black text-destructive/80 mb-2 tracking-tighter">45+ KB</div>
                            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">Google Analytics</div>
                            <div className="text-xs text-muted-foreground">Global Site Tag</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 text-left relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity className="w-64 h-64 text-foreground" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-start gap-6">
                            <div className="mt-1 p-3 bg-green-500/10 rounded-xl">
                                <Activity className="h-8 w-8 text-green-500" />
                            </div>
                            <div className="max-w-2xl">
                                <h3 className="text-2xl font-bold mb-4">Why script size matters</h3>
                                <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                                    Heavy analytics scripts block the main thread, increasing "Time to Interactive" (TTI) and "Total Blocking Time" (TBT). This hurts your Core Web Vitals score, which Google uses as a ranking factor.
                                </p>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    mmmetric is built to be invisible. The script loads asynchronously and never blocks your page rendering. You get all the insights with zero performance penalty.
                                </p>

                                <div className="mt-8">
                                    <Button asChild>
                                        <Link to="/docs/installation">
                                            Check Integration Guide <ArrowRight className="h-4 w-4 ml-2" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
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
