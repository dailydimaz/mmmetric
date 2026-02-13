import { motion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import { Star, Users, Globe, Zap } from "lucide-react";

const stats = [
  { icon: Users, value: 2400, suffix: "+", label: "Happy Users" },
  { icon: Globe, value: 150, suffix: "+", label: "Countries" },
  { icon: Zap, value: 99, suffix: ".9%", label: "Uptime" },
  { icon: Star, value: 4, suffix: ".9", label: "Avg Rating" },
];

export function SocialProofBar() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-16 border-y border-border/40 bg-muted/20"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center group cursor-default"
            >
              <div className="p-3 rounded-xl bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110">
                <stat.icon className="h-5 w-5" />
              </div>
              <AnimatedCounter
                end={stat.value}
                suffix={stat.suffix}
                className="text-3xl font-bold text-foreground"
              />
              <span className="text-sm text-muted-foreground mt-1">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
