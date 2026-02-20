import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Check,
  Globe,
  Search,
  Shield,
} from "lucide-react";

export const RealtimeIllustration = () => (
  <div className="absolute inset-x-4 bottom-4 top-16 bg-background/50 rounded-lg border border-border/50 overflow-hidden flex flex-col p-4 shadow-sm backdrop-blur-sm">
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs font-medium">Live Users</span>
      </div>
      <motion.div
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="ml-auto font-mono text-lg font-bold"
      >
        142
      </motion.div>
    </div>
    <div className="flex-1 flex items-end justify-between gap-1">
      {[40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 25].map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: [`${h}%`, `${h > 50 ? h - 15 : h + 15}%`, `${h}%`] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
          className="w-full bg-primary/20 rounded-t-sm relative group overflow-hidden"
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-primary/40 rounded-t-sm group-hover:bg-primary/60 transition-colors"
            animate={{ height: ['40%', '70%', '40%'] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        </motion.div>
      ))}
    </div>
  </div>
);

export const EventsIllustration = () => (
  <div className="absolute inset-4 top-16 bg-slate-950 rounded-lg border border-border/50 p-4 font-mono text-xs text-slate-300 shadow-md flex flex-col overflow-hidden">
    <div className="flex gap-1.5 mb-3">
      <div className="w-2.5 h-2.5 rounded-full bg-destructive/50"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
    </div>
    <motion.div
      className="space-y-1 relative"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <p><span className="text-purple-400">await</span> <span className="text-blue-400">metric</span>.<span className="text-yellow-300">track</span>(<span className="text-green-300">'signup'</span>, {'{'}</p>
      <p className="pl-4"><span className="text-sky-300">plan</span>: <span className="text-green-300">'pro'</span>,</p>
      <p className="pl-4"><span className="text-sky-300">source</span>: <span className="text-green-300">'landing'</span></p>
      <p>{'})'}</p>
    </motion.div>
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-4 right-4 bg-green-500/10 text-green-500 px-2 py-1 rounded text-[10px] flex items-center gap-1 border border-green-500/20"
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
          animate={{ width: [`${w}%`, `${w - 5}%`, `${w}%`] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          className={cn(
            "h-8 rounded-r-md flex items-center px-3 text-xs font-medium text-white shadow-sm relative overflow-hidden",
            i === 0 ? "bg-primary" : i === 1 ? "bg-primary/70" : "bg-primary/40"
          )}
        >
          <motion.div
            animate={{ left: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5, ease: "easeIn" }}
            className="absolute top-0 bottom-0 w-[30px] bg-white/20 skew-x-12"
          />
          <span className="relative z-10 w-full truncate">
            {i === 0 && "Page View"}
            {i === 1 && "Add to Cart"}
            {i === 2 && "Purchase"}
          </span>
        </motion.div>
        <span className="text-xs text-muted-foreground w-8 shrink-0">{i === 0 ? "100%" : i === 1 ? "75%" : "40%"}</span>
      </div>
    ))}
  </div>
);

export const CohortIllustration = () => (
  <div className="absolute inset-x-4 bottom-4 bg-background/60 backdrop-blur-md rounded-md border border-border p-2 shadow-sm grid grid-cols-5 gap-1">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [1, 0.4, 1], scale: [1, 0.9, 1] }}
        transition={{ duration: 3, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
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
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
    >
      <Globe className="w-48 h-48 text-primary/30" strokeWidth={0.5} />
    </motion.div>
    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bg-primary rounded-full w-2.5 h-2.5 shadow-lg shadow-primary/50 top-1/3 left-1/3" />
    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} className="absolute bg-primary rounded-full w-2 h-2 shadow-lg shadow-primary/50 top-1/2 right-1/3" />
    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute bg-primary rounded-full w-3 h-3 shadow-lg shadow-primary/50 bottom-1/3 left-1/2" />
  </div>
);

export const CommandIllustration = () => (
  <motion.div
    animate={{ y: [0, -5, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="absolute inset-x-8 top-16 h-10 bg-background rounded-lg border border-border shadow-lg flex items-center px-3 gap-2"
  >
    <Search className="h-4 w-4 text-primary" />
    <motion.div
      animate={{ width: ["20%", "40%", "20%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="h-3 bg-muted rounded-full"
    />
    <div className="ml-auto flex gap-1">
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  </motion.div>
);

export const PrivacyIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Shield className="w-24 h-24 text-green-500" fill="currentColor" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <Check className="w-8 h-8 text-white drop-shadow-md" strokeWidth={4} />
      </motion.div>
    </div>
  </div>
);

export const ScriptSizeIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <motion.span
      animate={{
        scale: [1, 1.05, 1],
        filter: ["hue-rotate(0deg)", "hue-rotate(15deg)", "hue-rotate(0deg)"]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 drop-shadow-sm"
    >
      1KB
    </motion.span>
  </div>
);

export const TeamIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex -space-x-3">
      {[1, 2, 3].map((u, i) => (
        <motion.div
          key={u}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shadow-sm relative z-10"
        >
          U{u}
        </motion.div>
      ))}
      <motion.div
        animate={{ scale: [1, 1.1, 1], backgroundColor: ["hsl(var(--primary))", "hsl(var(--primary) / 0.8)", "hsl(var(--primary))"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm relative z-20"
      >
        +
      </motion.div>
    </div>
  </div>
);

export const ProjectsIllustration = () => (
  <div className="absolute inset-x-8 top-16 space-y-2 opacity-80">
    <motion.div
      animate={{ x: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="h-8 bg-background rounded border border-border/60 shadow-sm w-full relative overflow-hidden"
    >
      <motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 3, repeat: Infinity, delay: 0, ease: "linear" }} className="absolute top-0 bottom-0 w-8 bg-primary/5 skew-x-12" />
    </motion.div>
    <motion.div
      animate={{ x: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
      className="h-8 bg-background rounded border border-border/60 shadow-sm w-[90%] mx-auto relative overflow-hidden"
    >
      <motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: "linear" }} className="absolute top-0 bottom-0 w-8 bg-primary/5 skew-x-12" />
    </motion.div>
    <motion.div
      animate={{ x: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1, ease: "easeInOut" }}
      className="h-8 bg-background rounded border border-border/60 shadow-sm w-[80%] mx-auto relative overflow-hidden"
    >
      <motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 3, repeat: Infinity, delay: 1, ease: "linear" }} className="absolute top-0 bottom-0 w-8 bg-primary/5 skew-x-12" />
    </motion.div>
  </div>
);

export const ExportIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-3">
    <motion.div
      animate={{ y: [0, -5, 0], scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="h-12 w-20 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-primary shadow-sm"
    >
      .CSV
    </motion.div>
    <motion.div
      animate={{ y: [0, 5, 0], scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
      className="h-12 w-20 bg-secondary/10 border border-secondary/20 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-secondary shadow-sm"
    >
      .JSON
    </motion.div>
  </div>
);
