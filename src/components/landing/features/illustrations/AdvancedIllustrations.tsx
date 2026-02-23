import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Bot,
  ExternalLink,
  Play,
  Search,
  Shield,
  Tag,
  TrendingDown,
  Share2,
  Twitter,
  MessageSquare,
  LayoutTemplate,
  Command,
  Sparkles,
  GitCompare,
} from "lucide-react";

export const JourneyIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
    <svg viewBox="0 0 200 100" className="w-full h-full stroke-primary/30 fill-none" strokeWidth="2">
      <path d="M20,50 C60,50 60,20 100,20 C140,20 140,50 180,50" />
      <motion.path
        d="M20,50 C60,50 60,20 100,20 C140,20 140,50 180,50"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeDasharray="20 180"
        animate={{ strokeDashoffset: [200, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <circle cx="20" cy="50" r="4" className="fill-primary" />
      <circle cx="100" cy="20" r="4" className="fill-primary" />
      <circle cx="180" cy="50" r="4" className="fill-primary" />
    </svg>
  </div>
);

export const HeatmapIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center p-4 opacity-80 backdrop-blur-sm">
    <div className="relative w-full h-full bg-background border border-border/50 rounded-lg overflow-hidden grid grid-cols-4 grid-rows-3 gap-1 p-1">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [1, 0.4 + (i % 3) * 0.2, 1] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "rounded-[2px]",
            [2, 5, 6, 9].includes(i) ? "bg-destructive/40" :
              [0, 3, 7, 10].includes(i) ? "bg-yellow-500/30" : "bg-primary/10"
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent pointer-events-none" />
    </div>
  </div>
);

export const ABTestIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-4 p-4">
    <motion.div
      animate={{ y: [0, 2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="w-16 h-20 bg-muted/40 rounded border border-border flex flex-col items-center justify-center gap-1 group"
    >
      <div className="w-8 h-8 rounded-full bg-destructive/20 text-[10px] flex items-center justify-center font-bold text-destructive">A</div>
      <div className="w-10 h-1 bg-muted-foreground/20 rounded"></div>
      <div className="w-8 h-1 bg-muted-foreground/20 rounded"></div>
    </motion.div>
    <motion.div
      animate={{ y: [0, -4, 0], scale: [1, 1.05, 1], boxShadow: ["0px 0px 0px rgba(34,197,94,0)", "0px 10px 20px rgba(34,197,94,0.1)", "0px 0px 0px rgba(34,197,94,0)"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      className="w-16 h-20 bg-primary/10 rounded border border-primary/20 flex flex-col items-center justify-center gap-1 shadow-sm relative"
    >
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">WINNER</motion.div>
      <div className="w-8 h-8 rounded-full bg-green-500/20 text-[10px] flex items-center justify-center font-bold text-green-500">B</div>
      <div className="w-10 h-1 bg-primary/30 rounded"></div>
      <div className="w-8 h-1 bg-primary/30 rounded"></div>
    </motion.div>
  </div>
);

export const BotIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative">
      <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <Bot className="w-16 h-16 text-muted-foreground/30" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        className="absolute -right-2 -bottom-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-background z-10"
      >
        <Shield className="w-4 h-4 text-white fill-white" />
      </motion.div>
      <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
    </div>
  </div>
);

export const FormIllustration = () => (
  <div className="absolute inset-x-8 top-16 space-y-2">
    <div className="flex gap-2">
      <div className="w-1/2 h-4 bg-muted rounded border border-border/50"></div>
      <div className="w-1/2 h-4 bg-muted rounded border border-border/50"></div>
    </div>
    <motion.div
      animate={{ borderColor: ["hsl(var(--primary) / 0.3)", "hsl(var(--primary) / 0.8)", "hsl(var(--primary) / 0.3)"] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-full h-4 bg-primary/10 rounded border border-primary/30 ring-2 ring-primary/10 relative overflow-hidden"
    >
      <motion.div animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 left-0 bottom-0 bg-primary/20" />
    </motion.div>
    <div className="w-2/3 h-4 bg-muted rounded border border-border/50 opacity-50"></div>
    <motion.div
      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
      className="absolute right-0 top-6 text-xs font-mono text-primary bg-background px-1 border rounded shadow-sm"
    >
      Typing...
    </motion.div>
  </div>
);

export const ScrollIllustration = () => (
  <div className="absolute inset-x-12 top-12 bottom-4 bg-background border border-border rounded shadow-sm overflow-hidden flex flex-col">
    <div className="h-full w-full bg-muted/20 relative">
      <div className="absolute right-1 top-2 bottom-2 w-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          animate={{ top: ["0%", "60%", "0%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-full h-1/3 bg-primary rounded-full shadow-sm"
        />
      </div>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="p-2 space-y-2 opacity-50 relative"
      >
        <div className="w-3/4 h-2 bg-muted-foreground/20 rounded"></div>
        <div className="w-full h-2 bg-muted-foreground/20 rounded"></div>
        <div className="w-full h-20 bg-muted-foreground/10 rounded"></div>
        <div className="w-5/6 h-2 bg-muted-foreground/20 rounded"></div>
        <div className="w-full h-12 bg-muted-foreground/10 rounded"></div>
      </motion.div>
    </div>
  </div>
);

export const TagIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex gap-1 items-end">
      <motion.div
        animate={{ y: [0, -5, 0], rotate: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-10 h-10 bg-primary/20 border border-primary/40 rounded flex items-center justify-center shadow-sm"
      >
        <span className="text-[10px] font-mono font-bold text-primary">JS</span>
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.2, ease: "easeInOut" }}
        className="w-10 h-12 bg-yellow-500/20 border border-yellow-500/40 rounded flex items-center justify-center z-10 shadow-md backdrop-blur-sm"
      >
        <Tag className="w-5 h-5 text-yellow-600" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, 5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.4, ease: "easeInOut" }}
        className="w-10 h-9 bg-purple-500/20 border border-purple-500/40 rounded flex items-center justify-center shadow-sm"
      >
        <span className="text-[10px] font-mono font-bold text-purple-600">GTM</span>
      </motion.div>
    </div>
  </div>
);

export const OutboundLinkIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.div
      animate={{ x: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="relative group"
    >
      <div className="w-20 h-8 bg-muted rounded border border-border flex items-center justify-center text-xs text-muted-foreground mr-4 shadow-sm">
        Ex. Site
      </div>
      <motion.div animate={{ rotate: [0, 15, 0], scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-2 -right-2">
        <ExternalLink className="w-6 h-6 text-primary drop-shadow-md" />
      </motion.div>
    </motion.div>
  </div>
);

export const SocialShareIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex gap-2 relative">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md z-10">
        <Share2 className="w-5 h-5" />
      </motion.div>
      <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-5 -right-8 bg-card border border-border px-2 py-1 rounded shadow-md text-xs font-bold text-primary z-20">
        +125
      </motion.div>
      <motion.div
        animate={{ y: [0, -5, 0], x: [0, -2, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
        className="absolute top-8 -left-5 w-7 h-7 rounded-full bg-sky-400 flex items-center justify-center text-white text-[10px] shadow-sm"
      >
        <Twitter className="w-3.5 h-3.5 fill-current" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -4, 0], x: [0, 2, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
        className="absolute top-6 -right-6 w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white text-[10px] shadow-sm"
      >
        <span className="font-serif font-bold text-sm">f</span>
      </motion.div>
    </div>
  </div>
);

export const ContentDecayIllustration = () => (
  <div className="absolute inset-x-8 bottom-4 h-24 flex items-end justify-between gap-1 overflow-hidden opacity-80 backdrop-blur-sm">
    {[80, 85, 90, 80, 70, 60, 50, 40].map((h, i) => (
      <motion.div
        key={i}
        animate={{ height: [`${h}%`, `${h > 50 ? h - 10 : h + 10}%`, `${h}%`] }}
        transition={{ duration: 3, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
        className={cn(
          "w-full rounded-t-sm transition-all relative overflow-hidden",
          i > 4 ? "bg-destructive/40" : "bg-green-500/40"
        )}
      >
        <div className={cn("absolute inset-x-0 bottom-0 h-1/2", i > 4 ? "bg-destructive/60" : "bg-green-500/60")} />
      </motion.div>
    ))}
    <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/2 right-1/4">
      <TrendingDown className="w-8 h-8 text-destructive drop-shadow-md" />
    </motion.div>
  </div>
);

export const ReadingDepthIllustration = () => (
  <div className="absolute inset-x-12 top-12 bottom-4 bg-background border border-border rounded shadow-sm overflow-hidden p-2 space-y-2">
    <div className="w-full h-2 bg-muted rounded relative overflow-hidden"><motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-y-0 w-10 bg-white/20 skew-x-12" /></div>
    <div className="w-5/6 h-2 bg-muted rounded"></div>
    <motion.div animate={{ width: ["100%", "95%", "100%"] }} transition={{ duration: 3, repeat: Infinity }} className="h-2 bg-primary/20 rounded"></motion.div>
    <motion.div animate={{ width: ["80%", "85%", "80%"] }} transition={{ duration: 4, repeat: Infinity }} className="h-2 bg-primary/40 rounded"></motion.div>
    <motion.div animate={{ width: ["100%", "90%", "100%"] }} transition={{ duration: 5, repeat: Infinity }} className="h-2 bg-primary/60 rounded shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]"></motion.div>
  </div>
);

export const VideoIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-32 h-20 bg-muted/50 rounded-lg border border-border flex items-center justify-center relative overflow-hidden group shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
      <motion.div
        animate={{ scale: [1, 1.1, 1], boxShadow: ["0px 0px 0px rgba(var(--primary-rgb),0)", "0px 0px 15px rgba(var(--primary-rgb),0.2)", "0px 0px 0px rgba(var(--primary-rgb),0)"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-10 h-10 bg-background rounded-full flex items-center justify-center shadow-md relative z-10"
      >
        <Play className="w-4 h-4 text-primary ml-1" fill="currentColor" />
      </motion.div>
      <motion.div animate={{ width: ["0%", "100%", "0%"] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 left-0 h-1 bg-primary"></motion.div>
    </div>
  </div>
);

export const SiteSearchIllustration = () => (
  <div className="absolute inset-x-8 top-16 h-10 bg-background rounded-full border border-border flex items-center px-4 gap-2 shadow-md">
    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
      <Search className="w-4 h-4 text-primary" />
    </motion.div>
    <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs text-primary font-medium">
      "pricing plan"<span className="animate-pulse">|</span>
    </motion.span>
  </div>
);

export const AnnotationsIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center p-4">
    <div className="w-full h-full relative">
      <svg viewBox="0 0 100 50" className="absolute bottom-4 w-full h-1/2 overflow-visible">
        <path d="M0,40 Q20,30 40,35 T80,20 T100,25" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      </svg>
      <motion.div
        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-background border border-border shadow-lg rounded-md p-2 flex items-center gap-2 z-10"
      >
        <MessageSquare className="w-4 h-4 text-primary" />
        <div className="w-12 h-2 bg-muted rounded"></div>
      </motion.div>
      <div className="absolute top-[45%] left-1/2 w-px h-1/4 bg-border"></div>
      <div className="absolute top-[70%] left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2 mt-0.5 border-2 border-background"></div>
    </div>
  </div>
);

export const EmbedWidgetIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center p-4">
    <motion.div
      whileHover={{ scale: 1.05 }}
      animate={{ y: [0, -4, 0], boxShadow: ["0px 0px 0px rgba(var(--primary-rgb),0)", "0px 10px 20px rgba(var(--primary-rgb),0.1)", "0px 0px 0px rgba(var(--primary-rgb),0)"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex z-10"
    >
      <div className="bg-muted px-3 py-2 border-r border-border flex items-center">
        <LayoutTemplate className="w-4 h-4 text-muted-foreground mr-2" />
        <span className="text-[10px] font-medium text-muted-foreground">visitors</span>
      </div>
      <div className="bg-primary/10 px-4 py-2 flex items-center justify-center">
        <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs font-bold text-primary">1,204</motion.span>
      </div>
    </motion.div>
    <div className="absolute inset-x-8 bottom-4 text-[8px] text-muted-foreground font-mono opacity-50 bg-muted/50 p-2 rounded border border-border truncate">
      &lt;img src="https://api.../embed" /&gt;
    </div>
  </div>
);

export const CliDocIllustration = () => (
  <div className="absolute inset-x-8 top-12 bottom-8 bg-[#0D1117] rounded-lg border border-border shadow-2xl overflow-hidden flex flex-col">
    <div className="h-6 bg-muted/20 border-b border-white/10 flex items-center px-2 gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
    </div>
    <div className="p-3 font-mono text-[10px] text-green-400 space-y-1 relative">
      <div>$ mmmetric init</div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.1 }} className="text-white/70">Connecting...</motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.1 }} className="flex items-center gap-1 mt-1">
        <span className="text-blue-400">$</span>
        <span className="text-white">mmmetric stats</span>
        <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1.5 h-3 bg-white/80 inline-block align-middle"></motion.span>
      </motion.div>
    </div>
  </div>
);

export const AiInsightsIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center p-4">
    <div className="w-full space-y-3">
      <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2 relative">
        <Sparkles className="w-4 h-4 text-yellow-500" />
        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full border border-yellow-500/50"></motion.div>
      </motion.div>
      <div className="bg-card border border-border shadow-sm rounded-lg p-2.5 flex items-start gap-2">
        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
        <div className="space-y-1.5 w-full">
          <div className="w-3/4 h-1.5 bg-muted-foreground/30 rounded"></div>
          <div className="w-1/2 h-1.5 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>
      <div className="bg-card border border-border shadow-sm rounded-lg p-2.5 flex items-start gap-2 opacity-60 translate-x-2">
        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
        <div className="space-y-1.5 w-full">
          <div className="w-5/6 h-1.5 bg-muted-foreground/30 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

export const BenchmarkIllustration = () => (
  <div className="absolute inset-x-8 top-12 bottom-8 flex items-end justify-center gap-4">
    <div className="w-1/3 flex flex-col items-center gap-2 h-full justify-end">
      <motion.div animate={{ height: ["50%", "55%", "50%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-full bg-primary rounded-t-md shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-4 bg-black/10"></div>
      </motion.div>
      <div className="text-[10px] font-medium text-muted-foreground">You</div>
    </div>
    <div className="w-1/3 flex flex-col items-center gap-2 h-full justify-end">
      <div className="w-full h-[70%] bg-muted border border-border border-b-0 rounded-t-md relative overflow-hidden flex items-start justify-center pt-2">
        <div className="w-4 h-0.5 bg-muted-foreground/20 rounded"></div>
        <div className="absolute inset-x-0 bottom-0 h-4 bg-black/5"></div>
      </div>
      <div className="text-[10px] font-medium text-muted-foreground">Industry</div>
    </div>
    <motion.div animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-[35%] left-1/2 -translate-x-1/2 bg-background border border-border rounded-full p-2 shadow-sm z-10">
      <GitCompare className="w-4 h-4 text-muted-foreground" />
    </motion.div>
  </div>
);
