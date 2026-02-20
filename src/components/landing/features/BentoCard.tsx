import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { MouseEvent } from "react";

interface BentoCardProps {
  className?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  illustration?: React.ComponentType;
  delay?: number;
  comingSoon?: boolean;
}

export function BentoCard({
  className,
  title,
  description,
  icon: Icon,
  illustration: Illustration,
  delay = 0,
  comingSoon = false,
}: BentoCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-card border border-border/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30",
        comingSoon && "opacity-75 grayscale-[0.2]",
        className
      )}
    >
      {/* Mouse tracking spotlight effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-10"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              hsla(var(--primary), 0.12),
              transparent 80%
            )
          `,
        }}
      />

      {/* Gradient Background Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Coming Soon Badge */}
      {comingSoon && (
        <div className="absolute top-4 right-4 z-20">
          <Badge variant="secondary" className="text-[10px] bg-muted/80 backdrop-blur-sm">
            Coming Soon
          </Badge>
        </div>
      )}

      <div className="relative h-full flex flex-col">
        {/* Content Top */}
        <div className="p-6">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold tracking-tight text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[90%]">
            {description}
          </p>
        </div>

        {/* Illustration Area */}
        <div className="flex-1 relative min-h-[140px] w-full overflow-hidden bg-muted/20 border-t border-border/20 group-hover:bg-muted/30 transition-colors">
          {Illustration && <Illustration />}
        </div>
      </div>
    </motion.div>
  );
}
