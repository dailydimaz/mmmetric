import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CtaSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
            <div className="container relative mx-auto px-4 md:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Ready to ditch Google Analytics?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Join thousands of developers and teams who have switched to a simpler, privacy-first analytics platform that doesn't slow down their site.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="rounded-full h-14 px-8 text-base shadow-lg animate-pulse-glow" asChild>
                            <Link to="/auth?mode=signup">
                                Start for free <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base bg-background/50 backdrop-blur-sm" asChild>
                            <a href="https://github.com/dailydimaz/mmmetric" target="_blank" rel="noopener noreferrer">
                                Self-host open source
                            </a>
                        </Button>
                    </div>
                    <p className="mt-8 text-sm text-muted-foreground">
                        No credit card required. Free plan available forever.
                    </p>
                </div>
            </div>
        </section>
    );
}
