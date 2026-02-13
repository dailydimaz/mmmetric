import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

export function KonamiEasterEgg() {
  const [triggered, setTriggered] = useState(false);
  const [, setSeq] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      setSeq(prev => {
        const next = [...prev, e.key].slice(-KONAMI.length);
        if (next.join(",") === KONAMI.join(",")) {
          setTriggered(true);
          setTimeout(() => setTriggered(false), 4000);
        }
        return next;
      });
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <AnimatePresence>
      {triggered && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="text-8xl"
          >
            🎉
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute mt-32 text-2xl font-bold text-foreground bg-background/90 backdrop-blur-sm px-6 py-3 rounded-xl border border-border shadow-lg"
          >
            You found the secret! 🕹️
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
