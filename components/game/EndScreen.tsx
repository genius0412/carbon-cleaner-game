"use client";

import Link from "next/link";
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-night/90 p-4 backdrop-blur">
      <Card glow={won ? "leaf" : "none"} className="max-w-lg text-center">
        <div className="text-5xl">{won ? "🌍✨" : "⏳"}</div>
        <h2 className="mt-4 font-display text-3xl font-semibold">
          {won ? "Net-Zero Achieved!" : "Time Ran Out"}
        </h2>
        <p className="mt-2 text-mist">
          {won
            ? `${game.cityName} reached carbon net-zero in ${formatYearMonth(game)}. You led your county to a livable future.`
            : `${game.cityName} didn't reach net-zero in time. The fight continues — try again with what you've learned.`}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <Stat label="Final carbon gain" value={`${effectiveCarbonGain(game).toFixed(4)} ppm/mo`} />
          <Stat label="Carbon level" value={`${game.carbonPpm.toFixed(1)} ppm`} />
          <Stat label="Support" value={`${game.support.toFixed(0)}%`} />
          <Stat label="Reached" value={formatYearMonth(game)} />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {meta.id ? (
            <Link href={`/report/${meta.id}`}>
              <Button className="w-full">📄 View final report</Button>
            </Link>
          ) : (
            <Link href="/report/local">
              <Button className="w-full">📄 View final report</Button>
            </Link>
          )}
          <Button variant="ghost" onClick={reset}>Play again</Button>
        </div>
      </Card>
    </div>
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
