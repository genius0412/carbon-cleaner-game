"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DataChip } from "@/components/ui/DataChip";
import { useGameStore } from "@/lib/store";
import { useAutoPause } from "../useAutoPause";
import { TREES } from "@/lib/engine/content";
import { treesDelta } from "@/lib/engine/engine";
import { gainCut } from "../impact";
import { GAME } from "@/lib/config/gameConstants";

export function TreesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  useAutoPause(open);
  const game = useGameStore((s) => s.game);
  const doTrees = useGameStore((s) => s.doTrees);
  const [batches, setBatches] = useState(1);
  if (!game) return null;

  return (
    <Modal open={open} onClose={onClose} title="Tree Planting" wide>
      <p className="-mt-2 mb-4 text-sm text-mist">
        Plant trees in batches of {GAME.treesPerBatch}. Pricier species pull
        down more carbon. In the real world a single tree captures about{" "}
        <DataChip id={25} /> a year.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-mist">Batches ({GAME.treesPerBatch} trees each):</span>
        {[1, 2, 5, 10, 25, 100].map((n) => (
          <button
            key={n}
            onClick={() => setBatches(n)}
            className={`rounded-full px-3 py-1 text-sm ${
              batches === n ? "bg-leaf text-night font-semibold" : "glass text-mist"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TREES.map((t) => {
          const cost = t.costPerBatch * batches;
          const affordable = game.budget >= cost;
          const planted = game.trees.find((x) => x.defId === t.id);
          return (
            <div key={t.id} className="glass flex flex-col rounded-xl p-4">
              <div className="text-2xl">🌲</div>
              <h4 className="mt-2 font-display text-sm font-semibold text-fog">{t.name}</h4>
              <p className="mt-1 text-[11px] text-mist">
                {t.co2PerYearPerTree} kg CO₂ a year per tree
              </p>
              <p className="mt-2 text-[11px] text-fog/80">
                ${t.costPerBatch.toLocaleString()} / batch
              </p>
              <p className="text-[11px] text-leaf">
                {batches} × = ${cost.toLocaleString()} ({batches * GAME.treesPerBatch} trees)
              </p>
              <p className="text-[11px] text-leaf">
                🌿 This planting cuts carbon gain by {gainCut(treesDelta(t, batches))}
              </p>
              {planted && (
                <p className="mt-1 text-[11px] text-cyan">
                  Planted: {planted.batches * GAME.treesPerBatch}
                </p>
              )}
              <Button
                size="sm"
                className="mt-3"
                disabled={!affordable}
                onClick={() => doTrees(t.id, batches)}
              >
                {affordable ? "Plant" : "Can't afford"}
              </Button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
