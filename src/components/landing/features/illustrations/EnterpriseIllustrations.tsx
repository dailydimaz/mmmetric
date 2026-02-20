import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  FileDown,
  Globe,
  Link2,
  Mail,
  PieChart,
  Smartphone,
  Target,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const BreakdownIllustration = () => (
  <div className="absolute inset-4 top-12 flex flex-col gap-3">
    {[
      { label: "Chrome", val: 65, color: "bg-primary" },
      { label: "Safari", val: 25, color: "bg-sky-500" },
      { label: "Firefox", val: 10, color: "bg-orange-500" },
    ].map((item, i) => (
      <div key={i} className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          <span>{item.label}</span>
          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 3, repeat: Infinity, delay: i }}>{item.val}%</motion.span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
          <motion.div
            animate={{ width: [`${item.val}%`, `${item.val - 5}%`, `${item.val}%`] }}
            transition={{ duration: 4, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            className={cn("h-full rounded-full absolute left-0 top-0", item.color, "opacity-80 shadow-[0_0_8px_currentColor]")}
          />
        </div>
      </div>
    ))}
  </div>
);

export const TimeIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 rounded-full border-4 border-muted/50" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2"
      >
        <div className="w-1 h-1/2 bg-primary absolute top-0 left-1/2 -translate-x-1/2 rounded-full origin-bottom shadow-[0_0_10px_hsl(var(--primary))]" />
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center flex-col bg-background/50 rounded-full backdrop-blur-[2px]">
        <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-xl font-bold tabular-nums text-primary">2m 45s</motion.span>
        <span className="text-[10px] text-muted-foreground">Avg. Time</span>
      </div>
    </div>
  </div>
);

export const EntryExitIllustration = () => (
  <div className="absolute inset-x-8 top-16 space-y-4">
    <motion.div animate={{ x: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-3">
      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-200/50 px-2 shadow-sm">Entry</Badge>
      <div className="h-6 flex-1 bg-card border border-border/50 rounded flex items-center px-2 text-[10px] text-muted-foreground shadow-sm relative overflow-hidden">
        <motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-y-0 w-8 bg-green-500/10 skew-x-12" />
        /blog/privacy-guide
      </div>
    </motion.div>
    <div className="flex justify-center -my-2 opacity-50">
      <div className="w-px h-6 border-l border-dashed border-border text-primary animate-pulse"></div>
    </div>
    <motion.div animate={{ x: [5, -5, 5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="flex items-center gap-3">
      <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 px-2 shadow-sm">Exit</Badge>
      <div className="h-6 flex-1 bg-card border border-border/50 rounded flex items-center px-2 text-[10px] text-muted-foreground shadow-sm relative overflow-hidden">
        <motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }} className="absolute inset-y-0 w-8 bg-destructive/10 skew-x-12" />
        /pricing
      </div>
    </motion.div>
  </div>
);

export const ScaleIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
    <div className="flex items-end gap-1">
      <motion.span animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(10deg)", "hue-rotate(0deg)"] }} transition={{ duration: 4, repeat: Infinity }} className="text-4xl font-extrabold tracking-tighter text-foreground drop-shadow-sm">100M</motion.span>
      <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-xl font-bold text-primary mb-1 drop-shadow-md">+</motion.span>
    </div>
    <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Events / Month</div>
    <div className="flex gap-1 h-8 items-end mt-2 opacity-80">
      {[20, 40, 60, 30, 70, 50, 80, 45].map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: [h / 2, h, h / 2] }}
          transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
          className="w-1.5 bg-primary/40 rounded-t-sm shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]"
        />
      ))}
    </div>
  </div>
);

export const PageOverlayIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-32 h-24 bg-background border border-border rounded shadow-sm relative overflow-hidden">
      <div className="w-full h-full bg-muted/20"></div>
      <motion.div
        animate={{ y: [0, -5, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-2 right-2 w-12 h-16 bg-card/90 backdrop-blur border border-primary/40 shadow-lg rounded p-1 flex flex-col gap-1 z-10"
      >
        <div className="w-full h-2 bg-primary/30 rounded"></div>
        <div className="w-2/3 h-2 bg-primary/20 rounded"></div>
        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -left-1 -top-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_hsl(var(--primary))]" />
      </motion.div>
    </div>
  </div>
);

export const SSOIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-3">
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
      <span className="font-bold text-primary">G</span>
    </motion.div>
    <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: "easeInOut" }} className="w-10 h-10 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-sm">
      <span className="font-bold text-indigo-500 text-[10px]">Okta</span>
    </motion.div>
    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
      <Check className="w-2 h-2" /> SSO
    </motion.div>
  </div>
);

export const LogAnalyticsIllustration = () => (
  <div className="absolute inset-4 top-12 bg-slate-950 rounded-lg p-2 font-mono text-[8px] text-slate-400 overflow-hidden flex flex-col gap-1 opacity-90 shadow-inner">
    <motion.div animate={{ y: [0, -20] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="space-y-1">
      <div className="flex gap-1"><span className="text-green-500">GET</span> /api/v1/users <span className="text-primary">200</span></div>
      <div className="flex gap-1"><span className="text-yellow-500">POST</span> /auth/login <span className="text-primary">200</span></div>
      <div className="flex gap-1"><span className="text-destructive">GET</span> /admin <span className="text-destructive">403</span></div>
      <div className="flex gap-1 bg-primary/20 p-0.5 rounded"><span className="text-green-500">GET</span> /dashboard <span className="text-primary">200</span></div>
      <div className="flex gap-1"><span className="text-green-500">GET</span> /api/v1/stats <span className="text-primary">200</span></div>
    </motion.div>
  </div>
);

export const LookerStudioIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex items-center gap-2">
      <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="p-2 bg-card border border-border rounded-lg shadow-sm">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><BarChart3 className="w-3 h-3 text-primary" /></div>
      </motion.div>
      <div className="relative h-0.5 w-8 bg-muted overflow-hidden rounded-full">
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 w-3 bg-primary"
        />
      </div>
      <motion.div animate={{ y: [0, 3, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: "easeInOut" }} className="p-2 bg-card border border-border rounded-lg shadow-sm">
        <PieChart className="w-6 h-6 text-primary" />
      </motion.div>
    </div>
  </div>
);

export const RollupIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="grid grid-cols-2 gap-2 scale-75">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="w-12 h-8 bg-primary/10 rounded border border-primary/20 shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary" /></motion.div>
      <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} className="w-12 h-8 bg-secondary/10 rounded border border-secondary/20 shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-secondary" /></motion.div>
      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} className="col-span-2 w-full h-10 bg-primary/20 rounded border border-primary/30 shadow-md flex items-end p-1 gap-0.5 mt-2">
        <div className="w-1/4 h-2/3 bg-primary/50 rounded-t-[1px]"></div>
        <div className="w-1/4 h-full bg-primary/70 rounded-t-[1px]"></div>
        <div className="w-1/4 h-1/2 bg-primary/50 rounded-t-[1px]"></div>
        <div className="w-1/4 h-3/4 bg-primary/90 rounded-t-[1px]"></div>
      </motion.div>
    </div>
  </div>
);

export const WhiteLabelIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative w-24 h-16 bg-card border border-border rounded shadow-md p-2 flex flex-col gap-2">
      <motion.div animate={{ backgroundColor: ["hsl(var(--primary)/0.2)", "hsl(var(--primary)/0.5)", "hsl(var(--primary)/0.2)"] }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 rounded shrink-0 shadow-sm"></motion.div>
      <div className="w-full h-2 bg-muted rounded"></div>
      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-secondary border-2 border-background flex items-center justify-center shadow-sm">
        <Check className="w-3 h-3 text-secondary-foreground" />
      </div>
    </motion.div>
  </div>
);

export const LanguagesIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-2">
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold border border-primary/20 shadow-sm">EN</motion.div>
    <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: "easeInOut" }} className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-bold border border-destructive/20 shadow-sm">ES</motion.div>
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6, ease: "easeInOut" }} className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold border border-green-500/20 shadow-sm">DE</motion.div>
    <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.9, ease: "easeInOut" }} className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded text-xs font-bold border border-purple-500/20 shadow-sm">FR</motion.div>
  </div>
);

export const GoalsIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-20 h-20 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-4 border-muted/30"></div>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent shadow-[0_0_8px_hsl(var(--primary))]"></motion.div>
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
        <Target className="w-8 h-8 text-primary" />
      </motion.div>
    </div>
  </div>
);

export const InsightsIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center p-6">
    <div className="w-full space-y-2">
      <div className="h-2 w-full bg-muted rounded overflow-hidden">
        <motion.div animate={{ width: ["75%", "80%", "75%"] }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-primary/50"></motion.div>
      </div>
      <div className="h-2 w-full bg-muted rounded overflow-hidden">
        <motion.div animate={{ width: ["50%", "45%", "50%"] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} className="h-full bg-secondary/50"></motion.div>
      </div>
      <div className="h-2 w-full bg-muted rounded overflow-hidden">
        <motion.div animate={{ width: ["85%", "90%", "85%"] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="h-full bg-green-500/50"></motion.div>
      </div>
    </div>
  </div>
);

export const RevenueIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.span animate={{ scale: [1, 1.1, 1], filter: ["hue-rotate(0deg)", "hue-rotate(15deg)", "hue-rotate(0deg)"] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl font-bold text-green-500/30 drop-shadow-sm">$</motion.span>
    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <TrendingDown className="w-8 h-8 text-green-500 rotate-180 drop-shadow-md" />
    </motion.div>
  </div>
);

export const AttributionIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-2">
    <motion.div animate={{ height: [24, 32, 24] }} transition={{ duration: 2, repeat: Infinity }} className="w-3 bg-muted rounded-full"></motion.div>
    <motion.div animate={{ height: [32, 40, 32] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} className="w-3 bg-muted rounded-full"></motion.div>
    <motion.div animate={{ height: [48, 56, 48] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} className="w-3 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]"></motion.div>
  </div>
);

export const DeviceIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-80">
    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <Smartphone className="w-10 h-10 text-primary drop-shadow-sm" />
    </motion.div>
    <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}>
      <div className="w-14 h-10 border-2 border-primary/50 bg-primary/10 rounded shadow-sm relative"><div className="absolute bottom-0 inset-x-0 h-1 bg-primary/30" /></div>
    </motion.div>
  </div>
);

export const SocialIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.div animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <svg className="w-16 h-16 text-primary drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    </motion.div>
  </div>
);

export const ApiIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs opacity-80 backdrop-blur-sm">
    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 3, repeat: Infinity }}>
      <span className="text-muted-foreground">{'{'}</span><span className="text-secondary">"data"</span><span className="text-muted-foreground">: [</span><span className="animate-pulse text-primary">...</span><span className="text-muted-foreground">]{'}'}</span>
    </motion.div>
  </div>
);

export const EmailIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="relative">
      <Mail className="w-12 h-12 text-primary drop-shadow-md" />
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background shadow-sm flex items-center justify-center text-[8px] text-white font-bold">1</motion.div>
    </motion.div>
  </div>
);

export const CrossDomainIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-4">
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
      <Globe className="w-8 h-8 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)] rounded-full" />
    </motion.div>
    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
      <Link2 className="w-5 h-5 text-muted-foreground" />
    </motion.div>
    <motion.div animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
      <Globe className="w-8 h-8 text-secondary shadow-[0_0_10px_hsl(var(--secondary)/0.2)] rounded-full" />
    </motion.div>
  </div>
);

export const DrilldownIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.div animate={{ scale: [1, 1.2, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
      <Activity className="w-12 h-12 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
    </motion.div>
  </div>
);

export const FileDownloadIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="p-3 bg-primary/10 rounded-full text-primary shadow-sm border border-primary/20 backdrop-blur-sm"
    >
      <FileDown className="w-8 h-8 drop-shadow-sm" />
    </motion.div>
  </div>
);

export const AlertIllustration = () => (
  <div className="absolute inset-x-8 top-16 h-10 bg-background rounded-lg border border-border shadow-md flex items-center px-3 gap-2">
    <motion.div animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}>
      <AlertTriangle className="h-5 w-5 text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]" />
    </motion.div>
    <div className="h-3 w-2/3 bg-muted rounded-full relative overflow-hidden">
      <motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-y-0 w-8 bg-orange-500/20 skew-x-12" />
    </div>
  </div>
);

export const PixelIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-32 h-20 bg-card border border-border shadow-lg rounded-md p-2 space-y-2 relative">
      <div className="w-full h-2 bg-muted rounded"></div>
      <div className="w-2/3 h-2 bg-muted rounded"></div>
      <div className="absolute bottom-3 right-3 w-2 h-2 bg-primary rounded-full ring-4 ring-primary/30 relative">
        <motion.div animate={{ scale: [1, 3], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-primary rounded-full" />
      </div>
    </div>
  </div>
);

export const WebVitalsIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-4">
    <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-sm border-2 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">98</div>
      <span className="text-[10px] text-muted-foreground font-mono">LCP</span>
    </motion.div>
    <motion.div animate={{ y: [0, 3, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: "easeInOut" }} className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-sm border-2 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">0.01</div>
      <span className="text-[10px] text-muted-foreground font-mono">CLS</span>
    </motion.div>
  </div>
);

export const ErrorTrackingIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.div animate={{ x: [-2, 2, -2] }} transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }} className="w-56 h-28 bg-destructive/10 rounded-lg border border-destructive/30 font-mono text-[10px] p-3 text-destructive overflow-hidden shadow-sm backdrop-blur-sm">
      <span className="font-bold">{">"} Uncaught TypeError</span><br />
      <span className="opacity-80">&nbsp;&nbsp;at render (app.js:2)</span><br />
      <span className="opacity-80">&nbsp;&nbsp;at hydrate (dom.js:45)</span>
      <motion.div animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2 h-3 bg-destructive mt-1 inline-block" />
    </motion.div>
  </div>
);

export const MobileSDKIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-90">
    <motion.div animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <Smartphone className="w-14 h-14 text-primary drop-shadow-md" />
    </motion.div>
    <div className="font-mono text-xs flex flex-col gap-1.5">
      <motion.span animate={{ x: [0, 2, 0] }} transition={{ duration: 3, repeat: Infinity }} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded shadow-sm">React Native</motion.span>
      <motion.span animate={{ x: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} className="bg-cyan-500/10 text-cyan-600 px-1.5 py-0.5 rounded shadow-sm">Flutter</motion.span>
      <motion.span animate={{ x: [0, 2, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded shadow-sm">Swift</motion.span>
    </div>
  </div>
);
