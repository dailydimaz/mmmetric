import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Check,
  Globe,
  Search,
  Shield,
} from "lucide-react";

export const RealtimeIllustration = () => (
  <div className="absolute inset-x-4 bottom-4 top-16 bg-background/50 rounded-lg border border-border/50 overflow-hidden flex flex-col p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs font-medium">Live Users</span>
      </div>
      <div className="ml-auto font-mono text-lg font-bold">142</div>
    </div>
    <div className="flex-1 flex items-end justify-between gap-1">
      {[40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 25].map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="w-full bg-primary/20 rounded-t-sm relative group"
        >
          <div className="absolute inset-x-0 bottom-0 bg-primary/40 h-full rounded-t-sm group-hover:bg-primary/60 transition-colors" style={{ height: '40%' }}></div>
        </motion.div>
      ))}
    </div>
  </div>
);

export const EventsIllustration = () => (
  <div className="absolute inset-4 top-16 bg-slate-950 rounded-lg border border-border/50 p-4 font-mono text-xs text-slate-300 shadow-md">
    <div className="flex gap-1.5 mb-3">
      <div className="w-2.5 h-2.5 rounded-full bg-destructive/50"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
    </div>
    <div className="space-y-1">
      <p><span className="text-purple-400">await</span> <span className="text-blue-400">metric</span>.<span className="text-yellow-300">track</span>(<span className="text-green-300">'signup'</span>, {'{'}</p>
      <p className="pl-4"><span className="text-sky-300">plan</span>: <span className="text-green-300">'pro'</span>,</p>
      <p className="pl-4"><span className="text-sky-300">source</span>: <span className="text-green-300">'landing'</span></p>
      <p>{'})'}</p>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="absolute bottom-4 right-4 bg-green-500/10 text-green-500 px-2 py-1 rounded text-[10px] flex items-center gap-1"
    >
      <Check className="h-3 w-3" /> Sent
    </motion.div>
  </div>
);

export const FunnelIllustration = () => (
  <div className="absolute inset-x-8 top-20 bottom-8 flex flex-col justify-center gap-2">
    {[100, 75, 40].map((w, i) => (
      <div key={i} className="flex items-center gap-3">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${w}%` }}
          transition={{ duration: 0.8, delay: i * 0.2, ease: "easeOut" }}
          className={cn(
            "h-8 rounded-r-md flex items-center px-3 text-xs font-medium text-white shadow-sm",
            i === 0 ? "bg-primary" : i === 1 ? "bg-primary/70" : "bg-primary/40"
          )}
        >
          {i === 0 && "Page View"}
          {i === 1 && "Add to Cart"}
          {i === 2 && "Purchase"}
        </motion.div>
        <span className="text-xs text-muted-foreground">{i === 0 ? "100%" : i === 1 ? "75%" : "40%"}</span>
      </div>
    ))}
  </div>
);

export const CohortIllustration = () => (
  <div className="absolute inset-x-4 bottom-4 bg-background rounded-md border border-border p-2 shadow-sm grid grid-cols-5 gap-1">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: i * 0.02 }}
        className={cn(
          "aspect-square rounded-[2px]",
          i < 5 ? "bg-primary/80" :
            i < 9 ? "bg-primary/60" :
              i < 12 ? "bg-primary/40" :
                i < 14 ? "bg-primary/20" : "bg-muted"
        )}
      />
    ))}
  </div>
);

export const GeoIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
    <Globe className="w-48 h-48 text-primary" strokeWidth={0.5} />
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bg-primary rounded-full w-2 h-2 top-1/3 left-1/3" />
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} className="absolute bg-primary rounded-full w-2 h-2 top-1/2 right-1/3" />
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="absolute bg-primary rounded-full w-2 h-2 bottom-1/3 left-1/2" />
  </div>
);

export const CommandIllustration = () => (
  <div className="absolute inset-x-8 top-16 h-10 bg-background rounded-lg border border-border shadow-lg flex items-center px-3 gap-2">
    <Search className="h-4 w-4 text-muted-foreground" />
    <div className="h-3 w-20 bg-muted rounded-full"></div>
    <div className="ml-auto flex gap-1">
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  </div>
);

export const PrivacyIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative">
      <Shield className="w-24 h-24 text-green-500/20" fill="currentColor" />
      <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-green-500" strokeWidth={3} />
    </div>
  </div>
);

export const ScriptSizeIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-500">1KB</span>
  </div>
);

export const TeamIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex -space-x-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shadow-sm">
          U{i}
        </div>
      ))}
      <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
        +
      </div>
    </div>
  </div>
);

export const ProjectsIllustration = () => (
  <div className="absolute inset-x-8 top-16 space-y-2 opacity-60">
    <div className="h-8 bg-background rounded border border-border/60 shadow-sm w-full"></div>
    <div className="h-8 bg-background rounded border border-border/60 shadow-sm w-[90%] mx-auto"></div>
    <div className="h-8 bg-background rounded border border-border/60 shadow-sm w-[80%] mx-auto"></div>
  </div>
);

export const ExportIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-2">
    <div className="h-10 w-16 bg-primary/20 rounded flex items-center justify-center text-[10px] font-mono text-primary">.csv</div>
    <div className="h-10 w-16 bg-secondary/20 rounded flex items-center justify-center text-[10px] font-mono text-secondary">.json</div>
  </div>
);
