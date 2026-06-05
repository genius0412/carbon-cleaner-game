"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";

/**
 * Cinematic advisor briefing. Story beats reveal line-by-line. Civic beats end
 * with a call-to-action that opens the letter desk — this is the ONLY way the
 * Civic Action flow surfaces (it is not a permanent button).
 */
export function StoryModal() {
  const beat = useGameStore((s) => s.activeStory);
  const resolveStory = useGameStore((s) => s.resolveStory);
  const [line, setLine] = useState(0);

  useEffect(() => {
    setLine(0);
  }, [beat?.id]);

  if (!beat) return null;
  const isLast = line >= beat.lines.length - 1;
  const isCivic = beat.kind === "civic";

  return (
    <AnimatePresence>
      <motion.div
        key={beat.id}
        className="fixed inset-0 z-[140] flex items-end justify-center p-4 sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-night/85 backdrop-blur-md" />
        <motion.div
          className={`glass relative z-10 w-full max-w-xl overflow-hidden rounded-3xl p-6 ${
            isCivic ? "border-l-4 border-l-cyan glow-cyan" : "border-l-4 border-l-leaf glow-leaf"
          }`}
          initial={{ y: 40, scale: 0.96, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          {/* speaker */}
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            >
              {beat.avatar}
            </motion.div>
            <div>
              <p className="font-display text-lg font-semibold text-fog">{beat.speaker}</p>
              <p className="text-xs uppercase tracking-wide text-cyan">{beat.role}</p>
            </div>
            <span
              className={`ml-auto rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
                isCivic ? "bg-cyan/15 text-cyan" : "bg-leaf/15 text-leaf"
              }`}
            >
              {isCivic ? "Civic call" : "Briefing"}
            </span>
          </div>

          <h2 className="mt-4 font-display text-2xl font-semibold text-fog">{beat.title}</h2>

          {/* lines revealed progressively */}
          <div className="mt-3 min-h-[7rem] space-y-3">
            <AnimatePresence mode="popLayout">
              {beat.lines.slice(0, line + 1).map((text, i) => (
                <motion.p
                  key={i}
                  className="text-sm leading-relaxed text-fog/90"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: i === line ? 1 : 0.55, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  {text}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>

          {/* progress dots */}
          <div className="mt-4 flex gap-1.5">
            {beat.lines.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= line ? "w-6 bg-leaf" : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            {!isLast ? (
              <>
                <button
                  className="text-xs text-mist hover:text-fog"
                  onClick={() => setLine(beat.lines.length - 1)}
                >
                  Skip
                </button>
                <Button onClick={() => setLine((l) => l + 1)}>Next →</Button>
              </>
            ) : isCivic ? (
              <>
                <button
                  className="text-xs text-mist hover:text-fog"
                  onClick={() => resolveStory(false)}
                >
                  Not now
                </button>
                <Button variant="secondary" onClick={() => resolveStory(true)}>
                  {beat.cta ?? "Take action"}
                </Button>
              </>
            ) : (
              <Button className="ml-auto" onClick={() => resolveStory(false)}>
                {beat.cta ?? "Continue"}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
