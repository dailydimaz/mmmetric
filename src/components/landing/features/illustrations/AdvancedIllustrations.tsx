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
} from "lucide-react";

export const JourneyIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
    <svg viewBox="0 0 200 100" className="w-full h-full stroke-primary/30 fill-none" strokeWidth="2">
      <path d="M20,50 C60,50 60,20 100,20 C140,20 140,50 180,50" className="animate-draw-path" strokeDasharray="200" strokeDashoffset="0" />
      <circle cx="20" cy="50" r="4" className="fill-primary" />
      <circle cx="100" cy="20" r="4" className="fill-primary" />
      <circle cx="180" cy="50" r="4" className="fill-primary" />
    </svg>
  </div>
);

export const HeatmapIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center p-4 opacity-80">
    <div className="relative w-full h-full bg-background border border-border/50 rounded-lg overflow-hidden grid grid-cols-4 grid-rows-3 gap-1 p-1">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className={cn(
            "rounded-[2px]",
            [2, 5, 6, 9].includes(i) ? "bg-destructive/40" :
              [0, 3, 7, 10].includes(i) ? "bg-yellow-500/30" : "bg-primary/10"
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
    </div>
  </div>
);

export const ABTestIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center gap-4 p-4">
    <div className="w-16 h-20 bg-muted/40 rounded border border-border flex flex-col items-center justify-center gap-1 group">
      <div className="w-8 h-8 rounded-full bg-destructive/20 text-[10px] flex items-center justify-center font-bold text-destructive">A</div>
      <div className="w-10 h-1 bg-muted-foreground/20 rounded"></div>
      <div className="w-8 h-1 bg-muted-foreground/20 rounded"></div>
    </div>
    <div className="w-16 h-20 bg-primary/10 rounded border border-primary/20 flex flex-col items-center justify-center gap-1 shadow-sm relative">
      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">WINNER</div>
      <div className="w-8 h-8 rounded-full bg-green-500/20 text-[10px] flex items-center justify-center font-bold text-green-500">B</div>
      <div className="w-10 h-1 bg-primary/30 rounded"></div>
      <div className="w-8 h-1 bg-primary/30 rounded"></div>
    </div>
  </div>
);

export const BotIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative">
      <Bot className="w-16 h-16 text-muted-foreground/30" />
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        className="absolute -right-2 -bottom-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-background z-10"
      >
        <Shield className="w-4 h-4 text-white fill-white" />
      </motion.div>
      <div className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full animate-ping" />
    </div>
  </div>
);

export const FormIllustration = () => (
  <div className="absolute inset-x-8 top-16 space-y-2">
    <div className="flex gap-2">
      <div className="w-1/2 h-4 bg-muted rounded border border-border/50"></div>
      <div className="w-1/2 h-4 bg-muted rounded border border-border/50"></div>
    </div>
    <div className="w-full h-4 bg-primary/10 rounded border border-primary/30 ring-2 ring-primary/10"></div>
    <div className="w-2/3 h-4 bg-muted rounded border border-border/50 opacity-50"></div>
    <div className="absolute right-0 top-6 text-xs font-mono text-primary bg-background px-1 border rounded shadow-sm">
      Typing...
    </div>
  </div>
);

export const ScrollIllustration = () => (
  <div className="absolute inset-x-12 top-12 bottom-4 bg-background border border-border rounded shadow-sm overflow-hidden flex flex-col">
    <div className="h-full w-full bg-muted/20 relative">
      <div className="absolute right-1 top-2 bottom-2 w-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ top: "0%" }}
          whileInView={{ top: "60%" }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          className="absolute w-full h-1/3 bg-primary rounded-full"
        />
      </div>
      <div className="p-2 space-y-2 opacity-50">
        <div className="w-3/4 h-2 bg-muted-foreground/20 rounded"></div>
        <div className="w-full h-2 bg-muted-foreground/20 rounded"></div>
        <div className="w-full h-20 bg-muted-foreground/10 rounded"></div>
        <div className="w-5/6 h-2 bg-muted-foreground/20 rounded"></div>
      </div>
    </div>
  </div>
);

export const TagIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex gap-1 items-end">
      <div className="w-8 h-10 bg-primary/20 border border-primary/40 rounded flex items-center justify-center">
        <span className="text-[10px] font-mono font-bold text-primary">JS</span>
      </div>
      <div className="w-8 h-12 bg-yellow-500/20 border border-yellow-500/40 rounded flex items-center justify-center z-10">
        <Tag className="w-4 h-4 text-yellow-600" />
      </div>
      <div className="w-8 h-9 bg-purple-500/20 border border-purple-500/40 rounded flex items-center justify-center">
        <span className="text-[10px] font-mono font-bold text-purple-600">GTM</span>
      </div>
    </div>
  </div>
);

export const OutboundLinkIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative group">
      <div className="w-16 h-8 bg-muted rounded border border-border flex items-center justify-center text-xs text-muted-foreground mr-4">
        Ex. Site
      </div>
      <ExternalLink className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-bounce" />
    </div>
  </div>
);

export const SocialShareIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex gap-2 relative">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground"><Share2 className="w-4 h-4" /></div>
      <div className="absolute -top-4 -right-8 bg-card border border-border px-2 py-1 rounded shadow-sm text-xs font-bold">+125</div>
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute top-8 -left-4 w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center text-white text-[10px]"
      >
        <Twitter className="w-3 h-3 fill-current" />
      </motion.div>
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute top-6 -right-6 w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white text-[10px]"
      >
        <span className="font-serif font-bold">f</span>
      </motion.div>
    </div>
  </div>
);

export const ContentDecayIllustration = () => (
  <div className="absolute inset-x-8 bottom-4 h-24 flex items-end justify-between gap-1 overflow-hidden opacity-80">
    {[80, 85, 90, 80, 70, 60, 50, 40].map((h, i) => (
      <div
        key={i}
        className={cn(
          "w-full rounded-t-sm transition-all",
          i > 4 ? "bg-destructive/40" : "bg-green-500/40"
        )}
        style={{ height: `${h}%` }}
      />
    ))}
    <div className="absolute top-1/2 right-1/4 animate-bounce">
      <TrendingDown className="w-6 h-6 text-destructive" />
    </div>
  </div>
);

export const ReadingDepthIllustration = () => (
  <div className="absolute inset-x-12 top-12 bottom-4 bg-background border border-border rounded shadow-sm overflow-hidden p-2 space-y-2">
    <div className="w-full h-2 bg-muted rounded"></div>
    <div className="w-5/6 h-2 bg-muted rounded"></div>
    <div className="w-full h-2 bg-primary/20 rounded"></div>
    <div className="w-4/5 h-2 bg-primary/40 rounded"></div>
    <div className="w-full h-2 bg-primary/60 rounded"></div>
  </div>
);

export const VideoIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-32 h-20 bg-muted/50 rounded-lg border border-border flex items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
      <div className="w-10 h-10 bg-background/80 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
        <Play className="w-4 h-4 text-primary ml-1" fill="currentColor" />
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-primary w-2/3"></div>
    </div>
  </div>
);

export const SiteSearchIllustration = () => (
  <div className="absolute inset-x-8 top-16 h-8 bg-background rounded-full border border-border flex items-center px-3 gap-2 shadow-sm">
    <Search className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs text-primary font-medium animate-pulse">"pricing plan"</span>
  </div>
);
