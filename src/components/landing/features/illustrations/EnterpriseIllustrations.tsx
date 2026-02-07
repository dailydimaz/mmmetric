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
          <span>{item.val}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${item.val}%` }}
            transition={{ duration: 1, delay: i * 0.2 }}
            className={cn("h-full rounded-full", item.color, "opacity-80")}
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
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2"
      >
        <div className="w-1 h-1/2 bg-primary/50 absolute top-0 left-1/2 -translate-x-1/2 rounded-full origin-bottom" />
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-xl font-bold tabular-nums">2m 45s</span>
        <span className="text-[10px] text-muted-foreground">Avg. Time</span>
      </div>
    </div>
  </div>
);

export const EntryExitIllustration = () => (
  <div className="absolute inset-x-8 top-16 space-y-4">
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-200/50 px-2">Entry</Badge>
      <div className="h-6 flex-1 bg-card border border-border/50 rounded flex items-center px-2 text-[10px] text-muted-foreground shadow-sm">/blog/privacy-guide</div>
    </div>
    <div className="flex justify-center -my-2">
      <div className="w-px h-6 border-l border-dashed border-border"></div>
    </div>
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 px-2">Exit</Badge>
      <div className="h-6 flex-1 bg-card border border-border/50 rounded flex items-center px-2 text-[10px] text-muted-foreground shadow-sm">/pricing</div>
    </div>
  </div>
);

export const ScaleIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
    <div className="flex items-end gap-1">
      <span className="text-4xl font-extrabold tracking-tighter text-foreground">100M</span>
      <span className="text-xl font-bold text-primary mb-1">+</span>
    </div>
    <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Events / Month</div>
    <div className="flex gap-1 h-8 items-end mt-2">
      {[20, 40, 60, 30, 70, 50, 80, 45].map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: [h / 2, h, h / 2] }}
          transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
          className="w-1.5 bg-primary/20 rounded-t-sm"
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
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="absolute top-2 right-2 w-12 h-16 bg-card/90 backdrop-blur border border-primary/20 shadow-lg rounded p-1 flex flex-col gap-1"
      >
        <div className="w-full h-2 bg-primary/20 rounded"></div>
        <div className="w-2/3 h-2 bg-primary/10 rounded"></div>
      </motion.div>
    </div>
  </div>
);

export const SSOIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-2">
    <div className="w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
      <span className="font-bold text-primary">G</span>
    </div>
    <div className="w-10 h-10 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
      <span className="font-bold text-indigo-500 text-[10px]">Okta</span>
    </div>
    <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
      <Check className="w-2 h-2" /> SSO
    </div>
  </div>
);

export const LogAnalyticsIllustration = () => (
  <div className="absolute inset-4 top-12 bg-slate-950 rounded-lg p-2 font-mono text-[8px] text-slate-400 overflow-hidden flex flex-col gap-1 opacity-80">
    <div className="flex gap-1"><span className="text-green-500">GET</span> /api/v1/users <span className="text-primary">200</span></div>
    <div className="flex gap-1"><span className="text-yellow-500">POST</span> /auth/login <span className="text-primary">200</span></div>
    <div className="flex gap-1"><span className="text-destructive">GET</span> /admin <span className="text-destructive">403</span></div>
    <div className="flex gap-1"><span className="text-green-500">GET</span> /dashboard <span className="text-primary">200</span></div>
  </div>
);

export const LookerStudioIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-card border border-border rounded-lg shadow-sm">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><BarChart3 className="w-3 h-3 text-primary" /></div>
      </div>
      <motion.div
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="h-0.5 w-6 bg-primary"
      />
      <div className="p-2 bg-card border border-border rounded-lg shadow-sm">
        <PieChart className="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>
);

export const RollupIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="grid grid-cols-2 gap-2 scale-75">
      <div className="w-12 h-8 bg-muted rounded border border-border shadow-sm"></div>
      <div className="w-12 h-8 bg-muted rounded border border-border shadow-sm"></div>
      <div className="col-span-2 w-full h-10 bg-primary/10 rounded border border-primary/20 shadow-sm flex items-end p-1 gap-0.5">
        <div className="w-1/4 h-2/3 bg-primary/40 rounded-t-[1px]"></div>
        <div className="w-1/4 h-full bg-primary/60 rounded-t-[1px]"></div>
        <div className="w-1/4 h-1/2 bg-primary/40 rounded-t-[1px]"></div>
        <div className="w-1/4 h-3/4 bg-primary/80 rounded-t-[1px]"></div>
      </div>
    </div>
  </div>
);

export const WhiteLabelIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-24 h-16 bg-card border border-border rounded shadow-sm p-2 flex flex-col gap-2">
      <div className="w-8 h-8 rounded bg-primary/20 animate-pulse"></div>
      <div className="w-full h-2 bg-muted rounded"></div>
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary border-2 border-background"></div>
    </div>
  </div>
);

export const LanguagesIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-2">
    <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold border border-primary/20">EN</div>
    <div className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-bold border border-destructive/20">ES</div>
    <div className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold border border-green-500/20">DE</div>
    <div className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded text-xs font-bold border border-purple-500/20">FR</div>
  </div>
);

export const GoalsIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-20 h-20 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-4 border-muted/30"></div>
      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-slow"></div>
      <Target className="w-8 h-8 text-primary" />
    </div>
  </div>
);

export const InsightsIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center p-6">
    <div className="w-full space-y-2">
      <div className="h-2 w-full bg-muted rounded overflow-hidden">
        <div className="h-full w-3/4 bg-primary/50"></div>
      </div>
      <div className="h-2 w-full bg-muted rounded overflow-hidden">
        <div className="h-full w-1/2 bg-secondary/50"></div>
      </div>
      <div className="h-2 w-full bg-muted rounded overflow-hidden">
        <div className="h-full w-5/6 bg-green-500/50"></div>
      </div>
    </div>
  </div>
);

export const RevenueIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-5xl font-bold text-green-500/20">$</span>
    <TrendingDown className="w-8 h-8 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-180" />
  </div>
);

export const AttributionIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-1">
    <div className="w-2 h-12 bg-muted rounded-full"></div>
    <div className="w-2 h-12 bg-muted rounded-full"></div>
    <div className="w-2 h-12 bg-primary rounded-full"></div>
  </div>
);

export const DeviceIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-50">
    <Smartphone className="w-8 h-8" />
    <div className="w-12 h-8 border border-foreground rounded" />
  </div>
);

export const SocialIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <svg className="w-16 h-16 text-primary/20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  </div>
);

export const ApiIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs opacity-60">
    {'{ "data": [...] }'}
  </div>
);

export const EmailIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <Mail className="w-12 h-12 text-primary/20" />
    <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-destructive rounded-full border-2 border-background"></div>
  </div>
);

export const CrossDomainIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-4">
    <Globe className="w-8 h-8 text-primary/40" />
    <Link2 className="w-4 h-4 text-muted-foreground" />
    <Globe className="w-8 h-8 text-secondary/40" />
  </div>
);

export const DrilldownIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <Activity className="w-10 h-10 text-primary/20" />
  </div>
);

export const FileDownloadIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.div
      animate={{ y: [0, 5, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="p-3 bg-primary/10 rounded-full text-primary"
    >
      <FileDown className="w-6 h-6" />
    </motion.div>
  </div>
);

export const AlertIllustration = () => (
  <div className="absolute inset-x-8 top-16 h-10 bg-background rounded-lg border border-border shadow-sm flex items-center px-3 gap-2">
    <AlertTriangle className="h-4 w-4 text-orange-500" />
    <div className="h-3 w-2/3 bg-muted rounded-full"></div>
  </div>
);

export const PixelIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-32 h-20 bg-card border border-border shadow-lg rounded-md p-2 space-y-2 relative">
      <div className="w-full h-2 bg-muted rounded"></div>
      <div className="w-2/3 h-2 bg-muted rounded"></div>
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse ring-4 ring-primary/20"></div>
    </div>
  </div>
);

export const WebVitalsIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-4">
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 font-bold text-xs border border-green-500/30">98</div>
      <span className="text-[10px] text-muted-foreground font-mono">LCP</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 font-bold text-xs border border-green-500/30">0.01</div>
      <span className="text-[10px] text-muted-foreground font-mono">CLS</span>
    </div>
  </div>
);

export const ErrorTrackingIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-48 h-24 bg-destructive/5 rounded-lg border border-destructive/20 font-mono text-[10px] p-3 text-destructive/80 overflow-hidden">
      {">"} Uncaught TypeError<br />
      &nbsp;&nbsp;at render (app.js:2)<br />
      &nbsp;&nbsp;at hydrate (dom.js:45)
    </div>
  </div>
);

export const MobileSDKIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-70">
    <Smartphone className="w-12 h-12 text-primary" />
    <div className="font-mono text-xs flex flex-col gap-1">
      <span className="bg-primary/10 text-primary px-1 rounded">React Native</span>
      <span className="bg-cyan-500/10 text-cyan-600 px-1 rounded">Flutter</span>
      <span className="bg-orange-500/10 text-orange-600 px-1 rounded">Swift</span>
    </div>
  </div>
);
