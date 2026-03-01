import { useState } from "react";
import { ArrowRight, BarChart3, Globe, Activity, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function LiveDemoSection() {
  const [activeTab, setActiveTab] = useState("traffic");

  const tabs = [
    { id: "traffic", label: "Traffic", icon: BarChart3 },
    { id: "geo", label: "Geography", icon: Globe },
    { id: "realtime", label: "Realtime", icon: Activity },
    { id: "events", label: "Events", icon: MousePointerClick },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            See it in action
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience the dashboard exactly as your users will see it without signing up.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mb-6 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                className={`rounded-full ${activeTab === tab.id ? "shadow-md" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div className="relative rounded-xl overflow-hidden border shadow-2xl bg-card max-w-5xl mx-auto aspect-video">
          {/* Fake Browser Toolbar */}
          <div className="h-10 bg-muted border-b flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 ml-4 bg-background h-6 rounded text-xs flex items-center px-3 text-muted-foreground truncate">
              mmmetric.lovable.app/demo/{activeTab}
            </div>
          </div>

          {/* Interactive Demo Content */}
          <div className="w-full h-[calc(100%-2.5rem)] bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 pointer-events-none" />

            <div className="p-6 h-full flex flex-col">
              <AnimatePresence mode="wait">
                {activeTab === "traffic" && (
                  <motion.div
                    key="traffic"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h3 className="text-2xl font-bold">45,231</h3>
                        <p className="text-sm text-muted-foreground">Total Visitors (Last 30 Days)</p>
                      </div>
                      <div className="text-sm font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">
                        +12.5%
                      </div>
                    </div>
                    {/* Mock Chart Area */}
                    <div className="flex-1 flex items-end gap-2 mt-4 px-2">
                      {[40, 55, 30, 70, 45, 80, 60, 90, 65, 85, 50, 75, 55, 95].map((height, i) => (
                        <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group hover:bg-primary/40 transition-colors" style={{ height: `${height}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                            {height * 123}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "geo" && (
                  <motion.div
                    key="geo"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex gap-6"
                  >
                    <div className="flex-1 border rounded-lg p-4 flex flex-col justify-center items-center bg-muted/20 relative overflow-hidden">
                      <Globe className="w-32 h-32 text-primary/20 absolute -right-10 -bottom-10" />
                      {/* Mock Map Blocks */}
                      <div className="w-full max-w-sm grid grid-cols-6 gap-2 opacity-60">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div key={i} className={`h-8 rounded-sm ${Math.random() > 0.5 ? 'bg-primary/40' : Math.random() > 0.3 ? 'bg-primary/20' : 'bg-transparent'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="w-1/3 flex flex-col gap-3">
                      <h3 className="font-semibold text-sm mb-2 text-muted-foreground">Top Countries</h3>
                      {[
                        { name: "United States", value: "45%", flag: "🇺🇸" },
                        { name: "United Kingdom", value: "15%", flag: "🇬🇧" },
                        { name: "Germany", value: "10%", flag: "🇩🇪" },
                        { name: "India", value: "8%", flag: "🇮🇳" },
                        { name: "Canada", value: "5%", flag: "🇨🇦" }
                      ].map((country, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50 transition-colors">
                          <span className="flex items-center gap-2">{country.flag} {country.name}</span>
                          <span className="font-mono">{country.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "realtime" && (
                  <motion.div
                    key="realtime"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex items-center justify-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                      <Activity className="w-96 h-96 text-primary" />
                    </div>
                    <div className="text-center z-10 bg-background/80 p-12 rounded-2xl backdrop-blur-sm border shadow-xl">
                      <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 mb-4 animate-pulse" />
                      <h3 className="text-7xl font-bold tracking-tighter text-primary">142</h3>
                      <p className="text-xl text-muted-foreground mt-2">Current Active Visitors</p>

                      <div className="mt-8 pt-6 border-t font-mono text-sm text-left w-full space-y-2 opacity-80">
                        <div className="flex gap-4">
                          <span className="text-muted-foreground">/pricing</span>
                          <span className="flex-1 border-b border-dashed border-muted-foreground/30 relative top-[-6px]"></span>
                          <span className="text-primary font-bold">48</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-muted-foreground">/docs/api</span>
                          <span className="flex-1 border-b border-dashed border-muted-foreground/30 relative top-[-6px]"></span>
                          <span className="text-primary font-bold">32</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-muted-foreground">/blog/release-v2</span>
                          <span className="flex-1 border-b border-dashed border-muted-foreground/30 relative top-[-6px]"></span>
                          <span className="text-primary font-bold">25</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "events" && (
                  <motion.div
                    key="events"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">Event Stream</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live updates
                      </div>
                    </div>
                    <div className="flex-1 border rounded-lg bg-card overflow-hidden flex flex-col">
                      <div className="grid grid-cols-4 px-4 py-3 border-b text-xs font-semibold text-muted-foreground bg-muted/30">
                        <div className="col-span-1">Time</div>
                        <div className="col-span-1">Event Name</div>
                        <div className="col-span-2">Properties</div>
                      </div>
                      <div className="flex-1 p-2 space-y-1 overflow-hidden font-mono text-xs">
                        {[
                          { time: "Just now", event: "signup", props: '{"plan": "pro", "source": "github"}' },
                          { time: "2m ago", event: "button_click", props: '{"id": "hero_cta", "path": "/"}' },
                          { time: "5m ago", event: "page_view", props: '{"path": "/pricing", "ref": "google"}' },
                          { time: "12m ago", event: "payment_success", props: '{"amount": 1900, "currency": "USD"}' },
                          { time: "18m ago", event: "download_pdf", props: '{"name": "whitepaper_v3.pdf"}' },
                          { time: "24m ago", event: "form_submit", props: '{"id": "contact_sales"}' },
                        ].map((log, i) => (
                          <div key={i} className="grid grid-cols-4 px-2 py-2.5 rounded hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                            <div className="col-span-1 text-muted-foreground">{log.time}</div>
                            <div className="col-span-1 text-primary">{log.event}</div>
                            <div className="col-span-2 text-muted-foreground truncate">{log.props}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center hidden md:block">
          <Button variant="link" className="text-muted-foreground" asChild>
            <a href="/live">Need more data? Try the full live demo <ArrowRight className="ml-1 w-4 h-4" /></a>
          </Button>
        </div>
      </div>
    </section>
  );
}
