"use client";

import { Button } from "@/components/ui/Button";
import { GAME } from "@/lib/config/gameConstants";
import { useGameStore } from "@/lib/store";

export function TimeControls() {
  const paused = useGameStore((s) => s.paused);
  const speed = useGameStore((s) => s.speed);
  const openPanels = useGameStore((s) => s.openPanels);
  const togglePause = useGameStore((s) => s.togglePause);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const skipMonth = useGameStore((s) => s.skipMonth);
  const skipYear = useGameStore((s) => s.skipYear);

  const autoPaused = openPanels > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={paused ? "primary" : "ghost"}
        onClick={togglePause}
        disabled={autoPaused}
      >
        {paused ? "▶ Play" : "⏸ Pause"}
      </Button>

      <div className="flex overflow-hidden rounded-full border border-white/12">
        {GAME.speedOptions.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-3 py-1.5 text-xs transition-colors ${
              speed === s ? "bg-leaf text-night font-semibold" : "text-mist hover:bg-white/5"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <Button size="sm" variant="secondary" onClick={skipMonth}>
        ⏩ Skip Month
      </Button>

      <Button size="sm" variant="secondary" onClick={skipYear}>
        ⏭ Skip Year
      </Button>

      {autoPaused && (
        <span className="rounded-full bg-amber/15 px-3 py-1 text-xs text-amber">
          ⏸ Auto-paused (panel open)
        </span>
      )}
    </div>
  );
}
