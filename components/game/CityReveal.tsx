"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Cinematic full-screen reveal played the moment a city is founded, before the
 * dashboard appears. Expanding light rings, rising particles, and a big name
 * slam-in. Calls onDone when the sequence finishes.
 */
export function CityReveal({
  cityName,
  onDone,
}: {
  cityName: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden bg-night"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* expanding rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-leaf/40"
          initial={{ width: 0, height: 0, opacity: 0.7 }}
          animate={{ width: 1400, height: 1400, opacity: 0 }}
          transition={{ duration: 2.4, delay: 0.3 + i * 0.35, ease: "easeOut" }}
        />
      ))}

      {/* central pulse of light */}
      <motion.div
        className="absolute h-72 w-72 rounded-full bg-leaf/30 blur-[90px]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.4, 1.6], opacity: [0, 0.9, 0.4] }}
        transition={{ duration: 2.2, ease: "easeOut" }}
      />

      {/* rising particles */}
      {[...Array(24)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-lg"
          style={{ left: `${(i * 4.3 + 4) % 100}%`, bottom: -40 }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -900, opacity: [0, 1, 0] }}
          transition={{ duration: 2.6 + (i % 5) * 0.3, delay: 0.4 + (i % 7) * 0.1, ease: "easeOut" }}
        >
          {["🌱", "🍃", "✨", "🌿", "💚"][i % 5]}
        </motion.span>
      ))}

      {/* tagline + name */}
      <div className="relative z-10 text-center">
        <motion.p
          className="text-xs font-medium uppercase tracking-[0.4em] text-cyan"
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          animate={{ opacity: 1, letterSpacing: "0.4em" }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          A new chapter begins
        </motion.p>

        <motion.h1
          className="mt-4 font-display text-6xl font-bold sm:text-8xl"
          initial={{ scale: 2.6, opacity: 0, filter: "blur(20px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.7, type: "spring", stiffness: 140, damping: 16 }}
        >
          <span className="bg-gradient-to-r from-leaf via-cyan to-leaf bg-clip-text text-transparent">
            {cityName}
          </span>
        </motion.h1>

        <motion.p
          className="mt-5 text-lg text-mist"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.7 }}
        >
          The future of your county is in your hands.
        </motion.p>

        {/* loading sweep */}
        <motion.div
          className="mx-auto mt-8 h-0.5 overflow-hidden rounded-full bg-white/10"
          initial={{ width: 0 }}
          animate={{ width: 220 }}
          transition={{ delay: 1.9, duration: 0.4 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-leaf to-cyan"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ delay: 2.0, duration: 1.1, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
