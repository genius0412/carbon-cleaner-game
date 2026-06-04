"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/lib/store";
import { useAutoPause } from "../useAutoPause";
import { RESEARCH, infraById } from "@/lib/engine/content";

export function ResearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  useAutoPause(open);
  const game = useGameStore((s) => s.game);
  const doResearch = useGameStore((s) => s.doResearch);
  if (!game) return null;

  return (
    <Modal open={open} onClose={onClose} title="Research Corporations" wide>
      <p className="-mt-2 mb-4 text-sm text-mist">
        Found a corporation to unlock advanced infrastructure. Pay a one-time
        founding cost plus monthly operating costs until it delivers. Completed
        research also boosts your existing related infrastructure.
      </p>
      <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {RESEARCH.map((r) => {
          const done = game.completedResearch.includes(r.id);
          const active = game.activeResearch.find((a) => a.defId === r.id);
          const affordable = game.budget >= r.foundingCost;
          const unlocks = infraById(r.unlocksInfraId);
          return (
            <div key={r.id} className="glass flex flex-col rounded-xl p-4">
              <h4 className="font-display text-sm font-semibold text-fog">{r.name}</h4>
              <p className="mt-1 flex-1 text-xs text-mist">{r.description}</p>
              <p className="mt-2 text-[11px] text-cyan">
                Unlocks: {unlocks?.icon} {unlocks?.name}
              </p>
              <div className="mt-2 space-y-0.5 text-[11px] text-fog/80">
                <p>Founding: ${r.foundingCost.toLocaleString()}</p>
                <p>Monthly: ${r.monthlyCost.toLocaleString()}/mo · {r.timelineMonths} months</p>
              </div>
              {done ? (
                <span className="mt-3 rounded-full bg-leaf/15 py-2 text-center text-xs font-semibold text-leaf">
                  ✓ Completed
                </span>
              ) : active ? (
                <span className="mt-3 rounded-full bg-cyan/15 py-2 text-center text-xs font-semibold text-cyan">
                  ⏳ {active.monthsRemaining} months remaining
                </span>
              ) : (
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={!affordable}
                  onClick={() => doResearch(r.id)}
                >
                  {affordable ? "Found corporation" : "Can't afford"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
