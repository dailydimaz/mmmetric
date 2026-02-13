import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, CloudSun } from "lucide-react";

function getGreeting(): { text: string; icon: typeof Sun; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { text: "Burning the midnight oil", icon: Moon, emoji: "🌙" };
  if (hour < 12) return { text: "Good morning", icon: Sun, emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon", icon: CloudSun, emoji: "🌤️" };
  if (hour < 21) return { text: "Good evening", icon: Moon, emoji: "🌆" };
  return { text: "Working late", icon: Moon, emoji: "🌙" };
}

const funFacts = [
  "Your analytics are looking sharp today!",
  "Ready to uncover some insights?",
  "Let's see what your visitors are up to.",
  "Privacy-first analytics, always. 🔒",
  "Your data, your rules.",
  "Time to make data-driven decisions!",
];

export function GreetingBanner() {
  const greeting = getGreeting();
  const [fact] = useState(() => funFacts[Math.floor(Math.random() * funFacts.length)]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 text-sm text-muted-foreground"
    >
      <span className="text-lg">{greeting.emoji}</span>
      <span className="font-medium text-foreground">{greeting.text}</span>
      <span className="text-border">·</span>
      <span className="italic">{fact}</span>
    </motion.div>
  );
}
