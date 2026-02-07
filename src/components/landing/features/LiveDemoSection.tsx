import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiveDemoSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            See it in action
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Experience the dashboard exactly as your users will see it.
          </p>
        </div>

        <div className="relative rounded-xl overflow-hidden border shadow-2xl bg-card max-w-5xl mx-auto aspect-video">
          {/* Fake Browser Toolbar */}
          <div className="h-10 bg-muted border-b flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 ml-4 bg-background h-6 rounded text-xs flex items-center px-3 text-muted-foreground">
              mmmetric.lovable.app/dashboard
            </div>
          </div>

          {/* Iframe Placeholder */}
          <div className="w-full h-full bg-muted/10 flex items-center justify-center relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10" />

            <div className="text-center z-10 p-8">
              <Button size="lg" className="rounded-full h-12 px-8 text-base shadow-lg animate-pulse-glow" asChild>
                <a href="/live">
                  View Live Demo <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                (Click to create a free account and explore)
              </p>
            </div>

            {/* Background elements to look like dashboard */}
            <div className="absolute inset-0 opacity-20 pointer-events-none p-8 grid grid-cols-4 gap-4 blur-sm">
              <div className="col-span-4 h-32 bg-foreground/20 rounded-xl" />
              <div className="col-span-1 h-32 bg-foreground/20 rounded-xl" />
              <div className="col-span-1 h-32 bg-foreground/20 rounded-xl" />
              <div className="col-span-2 h-32 bg-foreground/20 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
