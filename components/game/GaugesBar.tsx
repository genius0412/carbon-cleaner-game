"use client";

import { motion } from "framer-motion";
import { Gauge } from "@/components/ui/Gauge";
import { GAME } from "@/lib/config/gameConstants";
import { effectiveCarbonGain, monthlyNetBudget } from "@/lib/engine/engine";
import type { GameState } from "@/lib/engine/types";

export function GaugesBar({ game }: { game: GameState }) {
  const effGain = effectiveCarbonGain(game);
  const holdLeft = GAME.netZeroHoldMonths - (game.netZeroMonths ?? 0);
  const ppmRange = GAME.failureCarbonPpm - GAME.startingCarbonPpm;
  const ppmFill = (game.carbonPpm - GAME.startingCarbonPpm) / ppmRange;

  const netPerMonth = monthlyNetBudget(game);
  const netLabel = `${netPerMonth >= 0 ? "▲ +" : "▼ −"}$${Math.abs(Math.round(netPerMonth)).toLocaleString()}/mo`;

  const gauges = [
    {
      key: "gain",
      node: (
        <Gauge
          label="Carbon Gain / mo"
          value={`${effGain >= 0 ? "+" : ""}${effGain.toFixed(4)} ppm`}
          tone={effGain <= 0 ? "leaf" : effGain < 0.02 ? "amber" : "danger"}
          hint={
            effGain <= 0
              ? `Net-zero! Hold ${holdLeft} more month${holdLeft === 1 ? "" : "s"}`
              : "Goal: ≤ 0.0000"
          }
        />
      ),
      pulse: effGain.toFixed(4),
    },
    {
      key: "ppm",
      node: (
        <Gauge
          label="Current Carbon"
          value={`${game.carbonPpm.toFixed(2)} ppm`}
          fill={ppmFill}
          tone={game.carbonPpm > 540 ? "danger" : game.carbonPpm > 480 ? "amber" : "cyan"}
          hint={`Fails at ${GAME.failureCarbonPpm}`}
        />
      ),
      pulse: game.carbonPpm.toFixed(1),
    },
    {
      key: "support",
      node: (
        <Gauge
          label="Support"
          value={`${game.support.toFixed(0)}%`}
          fill={game.support / 100}
          tone={game.support < 30 ? "danger" : game.support < 50 ? "amber" : "leaf"}
          hint={game.support < 50 ? "Too low for bills" : undefined}
        />
      ),
      pulse: game.support.toFixed(0),
    },
    {
      key: "budget",
      node: (
        <Gauge
          label="Budget"
          value={`$${(game.budget / 1_000_000).toFixed(2)}M`}
          tone={game.budget < 200_000 ? "danger" : "leaf"}
          hint={netLabel}
          hintTone={netPerMonth >= 0 ? "leaf" : "danger"}
        />
      ),
      pulse: (game.budget / 1_000_000).toFixed(2),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {gauges.map((g) => (
        <motion.div
          key={g.key + g.pulse}
          className="h-full"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.025, 1] }}
          transition={{ duration: 0.4 }}
        >
          {g.node}
        </motion.div>
      ))}
    </div>
  );
}
