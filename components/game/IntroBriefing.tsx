"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

/**
 * Cinematic, multi-scene opening that sets up the storyline before role select.
 * Each scene fades/slides in; the last scene hands off via onContinue.
 */

interface Scene {
  tag: string;
  art: string;
  title: string;
  body: string[];
  accent: "leaf" | "cyan" | "amber";
}

const SCENES: Scene[] = [
  {
    tag: "The year is 2025",
    art: "🌆",
    title: "Verdana County",
    accent: "cyan",
    body: [
      "One hundred thousand people. Mountains in the north, farmland in the valley, a working harbor on the coast.",
      "For a century it ran on coal smoke and gasoline — and it never had to think about the cost. Until now.",
    ],
  },
  {
    tag: "The problem",
    art: "🌡️",
    title: "The air is changing",
    accent: "amber",
    body: [
      "Carbon dioxide is piling up in the sky and trapping heat. Worldwide it has climbed past 430 parts per million and keeps rising.",
      "Here in Verdana, the count sits at 430 ppm and gains a little more every single month. Cross 600 and the harvests fail, the coast floods, and there is no coming back.",
    ],
  },
  {
    tag: "The mandate",
    art: "🎯",
    title: "Your mission, until 2100",
    accent: "leaf",
    body: [
      "Bend the curve. Get the county's monthly carbon gain down to zero — net-zero — before the century ends.",
      "Build clean infrastructure across the map, fund breakthrough research, pass bold laws, and plant living carbon sinks. Every region is a choice.",
    ],
  },
  {
    tag: "The catch",
    art: "🤝",
    title: "You can't do it alone",
    accent: "cyan",
    body: [
      "Every decision spends two currencies: money, and the public's trust. Push too hard and support collapses — and a county that won't follow you can't be saved.",
      "Your advisors and your citizens will speak up along the way. Listen to them. The people are not a gauge to manage; they're how you win.",
    ],
  },
];

const accentText = { leaf: "text-leaf", cyan: "text-cyan", amber: "text-amber" } as const;

export function IntroBriefing({ onContinue }: { onContinue: () => void }) {
  const [i, setI] = useState(0);
  const scene = SCENES[i];
  const isLast = i === SCENES.length - 1;

  return (
    <div className="mx-auto max-w-2xl">
      {/* scene counter */}
      <div className="mb-5 flex justify-center gap-2">
        {SCENES.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === i ? "w-8 bg-leaf" : idx < i ? "w-3 bg-leaf/50" : "w-3 bg-white/15"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="glass overflow-hidden rounded-3xl p-8 text-center"
        >
          <motion.div
            className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5 text-6xl"
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 16 }}
          >
            {scene.art}
          </motion.div>

          <p className={`text-xs font-medium uppercase tracking-[0.25em] ${accentText[scene.accent]}`}>
            {scene.tag}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{scene.title}</h1>

          <div className="mx-auto mt-5 max-w-lg space-y-4">
            {scene.body.map((p, idx) => (
              <motion.p
                key={idx}
                className="text-fog/90 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.15 }}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <button
          className="text-sm text-mist transition-colors hover:text-fog disabled:opacity-0"
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0}
        >
          ← Back
        </button>
        {isLast ? (
          <Button size="lg" onClick={onContinue}>
            Choose your role →
          </Button>
        ) : (
          <div className="flex items-center gap-4">
            <button className="text-sm text-mist hover:text-fog" onClick={onContinue}>
              Skip intro
            </button>
            <Button size="lg" onClick={() => setI((v) => v + 1)}>
              Continue →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
