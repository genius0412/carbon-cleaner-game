"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGameStore } from "@/lib/store";
import { formatYearMonth, effectiveCarbonGain } from "@/lib/engine/engine";
import type { GameState } from "@/lib/engine/types";

export function EndScreen({ game }: { game: GameState }) {
  const meta = useGameStore((s) => s.meta);
  const reset = useGameStore((s) => s.reset);
  const won = game.status === "won";

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-night/90 p-4 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* celebratory rising particles on a win */}
      {won &&
        [...Array(14)].map((_, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute text-xl"
            style={{ left: `${(i * 7 + 5) % 100}%`, bottom: -30 }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -700, opacity: [0, 1, 0] }}
            transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.25 }}
          >
            {["🌱", "🍃", "✨", "🌿"][i % 4]}
          </motion.span>
        ))}
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
      <Card glow={won ? "leaf" : "none"} className="max-w-lg text-center">
        <motion.div
          className="text-5xl"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 240 }}
        >
          {won ? "🌍✨" : "⏳"}
        </motion.div>
        <h2 className="mt-4 font-display text-3xl font-semibold">
          {won ? "Net-Zero Achieved!" : "Time Ran Out"}
        </h2>
        <p className="mt-2 text-mist">
          {won
            ? `${game.cityName} reached carbon net-zero in ${formatYearMonth(game)}. You led your county to a livable future.`
            : `${game.cityName} didn't reach net-zero in time. The fight continues, try again with what you've learned.`}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <Stat label="Final carbon gain" value={`${effectiveCarbonGain(game).toFixed(4)} ppm/mo`} />
          <Stat label="Carbon level" value={`${game.carbonPpm.toFixed(1)} ppm`} />
          <Stat label="Support" value={`${game.support.toFixed(0)}%`} />
          <Stat label="Reached" value={formatYearMonth(game)} />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link href={`/report/${meta.id ?? meta.localId ?? "local"}`}>
            <Button className="w-full">📄 View final report</Button>
          </Link>
          <Button variant="ghost" onClick={reset}>Play again</Button>
        </div>
      </Card>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-lg p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-mist">{label}</p>
      <p className="font-display font-semibold text-fog">{value}</p>
    </div>
  );
}
