"use client";

import { useGameStore } from "@/lib/store";
import { MONTH_NAMES } from "@/lib/config/gameConstants";

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * A clearly-flowing date + time readout. The in-month progress (monthProgress
 * 0..1) drives a live day counter and HH:MM clock so the player can *see* time
 * passing, plus a thin progress bar for the current month.
 */
export function GameClock() {
  const game = useGameStore((s) => s.game);
  const progress = useGameStore((s) => s.monthProgress);
  const paused = useGameStore((s) => s.paused);
  const openPanels = useGameStore((s) => s.openPanels);
  const activeStory = useGameStore((s) => s.activeStory);
  if (!game) return null;

  const frozen = paused || openPanels > 0 || !!activeStory;
  const daysInMonth = DAYS_IN_MONTH[game.month - 1];
  const elapsedHours = progress * daysInMonth * 24;
  const day = Math.min(daysInMonth, Math.floor(elapsedHours / 24) + 1);
  const hour = Math.floor(elapsedHours % 24);
  const minute = Math.floor((elapsedHours * 60) % 60);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="glass relative overflow-hidden rounded-xl px-4 py-2.5">
      {/* sweeping shimmer when running */}
      {!frozen && (
        <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[clockshimmer_3s_linear_infinite] bg-gradient-to-r from-transparent via-leaf/10 to-transparent" />
      )}
      <div className="relative flex items-center gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-mist">Date</p>
          <p className="font-display text-lg font-semibold leading-none text-fog">
            {MONTH_NAMES[game.month - 1].slice(0, 3)} {day},{" "}
            <span className="text-leaf">{game.year}</span>
          </p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-mist">
            {frozen ? "Paused" : "Time"}
          </p>
          <p
            className={`font-display text-lg font-semibold leading-none tabular-nums ${
              frozen ? "text-mist" : "text-cyan"
            }`}
          >
            {pad(hour)}:{pad(minute)}
            <span className={`ml-1 inline-block ${frozen ? "" : "animate-pulse"} text-cyan`}>
              {frozen ? "" : "•"}
            </span>
          </p>
        </div>
      </div>
      {/* month progress */}
      <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-leaf to-cyan transition-[width] duration-150 ease-linear"
          style={{ width: `${progress * 100}%`, boxShadow: "0 0 8px var(--color-leaf)" }}
        />
      </div>
    </div>
  );
}
