"use client";

import { Gauge } from "@/components/ui/Gauge";
import { GAME } from "@/lib/config/gameConstants";
import { effectiveCarbonGain, formatYearMonth } from "@/lib/engine/engine";
import type { GameState } from "@/lib/engine/types";

export function GaugesBar({ game }: { game: GameState }) {
  const effGain = effectiveCarbonGain(game);
  const ppmRange = GAME.failureCarbonPpm - GAME.startingCarbonPpm;
  const ppmFill = (game.carbonPpm - GAME.startingCarbonPpm) / ppmRange;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <Gauge label="Date" value={formatYearMonth(game)} tone="cyan" />
      <Gauge
        label="Carbon Gain / mo"
        value={`${effGain >= 0 ? "+" : ""}${effGain.toFixed(4)} ppm`}
        tone={effGain <= 0 ? "leaf" : effGain < 0.02 ? "amber" : "danger"}
        hint={effGain <= 0 ? "Net-zero reached!" : "Goal: ≤ 0.0000"}
      />
      <Gauge
        label="Current Carbon"
        value={`${game.carbonPpm.toFixed(1)} ppm`}
        fill={ppmFill}
        tone={game.carbonPpm > 540 ? "danger" : game.carbonPpm > 480 ? "amber" : "cyan"}
        hint={`Fails at ${GAME.failureCarbonPpm}`}
      />
      <Gauge
        label="Support"
        value={`${game.support.toFixed(0)}%`}
        fill={game.support / 100}
        tone={game.support < 30 ? "danger" : game.support < 50 ? "amber" : "leaf"}
        hint={game.support < 50 ? "Too low for bills" : undefined}
      />
      <Gauge
        label="Budget"
        value={`$${(game.budget / 1_000_000).toFixed(2)}M`}
        tone={game.budget < 200_000 ? "danger" : "leaf"}
      />
    </div>
  );
}
