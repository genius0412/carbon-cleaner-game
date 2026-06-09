"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DataChip } from "@/components/ui/DataChip";
import { useGameStore } from "@/lib/store";
import { useAutoPause } from "../useAutoPause";
import { BILLS } from "@/lib/engine/content";
import { GAME } from "@/lib/config/gameConstants";

export function BillsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  useAutoPause(open);
  const game = useGameStore((s) => s.game);
  const doBill = useGameStore((s) => s.doBill);
  if (!game) return null;

  const blocked = game.support < GAME.supportBillsBlockedBelow;

  return (
    <Modal open={open} onClose={onClose} title="Bills & Legislation" wide>
      <p className="-mt-2 mb-4 text-sm text-mist">
        Bills cost no budget but carry public-support penalties and require
        support ≥ {GAME.supportBillsBlockedBelow}% to pass.
      </p>
      {blocked && (
        <div className="mb-4 rounded-xl bg-danger/15 p-3 text-sm text-danger">
          Public support is below {GAME.supportBillsBlockedBelow}%, no legislation
          can pass right now. Build goodwill first.
        </div>
      )}
      <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {BILLS.map((b) => {
          const passed = game.passedBills.includes(b.id);
          const needsResearch =
            b.requiresResearch && !game.completedResearch.includes(b.requiresResearch);
          return (
            <div key={b.id} className="glass flex flex-col rounded-xl p-4">
              <h4 className="font-display text-sm font-semibold text-fog">{b.name}</h4>
              <p className="mt-1 flex-1 text-xs text-mist">{b.description}</p>
              {b.dataBlanks.length > 0 && (
                <p className="mt-2 text-[11px] text-mist">
                  Real impact:{" "}
                  {b.dataBlanks.map((id) => (
                    <span key={id} className="mr-1 inline-block">
                      <DataChip id={id} />
                    </span>
                  ))}
                </p>
              )}
              <div className="mt-2 space-y-0.5 text-[11px]">
                <p className="text-leaf">Carbon: {b.carbonDelta.toFixed(4)} ppm/mo</p>
                <p className="text-amber">Support: {b.supportImpact}%</p>
                {b.budgetDelta ? <p className="text-leaf">Budget: +${b.budgetDelta.toLocaleString()}</p> : null}
              </div>
              {passed ? (
                <span className="mt-3 rounded-full bg-leaf/15 py-2 text-center text-xs font-semibold text-leaf">
                  ✓ Passed
                </span>
              ) : (
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={blocked || !!needsResearch}
                  onClick={() => doBill(b.id)}
                >
                  {needsResearch ? "🔒 Research needed" : blocked ? "Support too low" : "Pass bill"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
