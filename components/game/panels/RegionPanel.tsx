"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DataChip } from "@/components/ui/DataChip";
import { useGameStore } from "@/lib/store";
import { useAutoPause } from "../useAutoPause";
import { availableInfrastructure, effectiveInfraDelta } from "@/lib/engine/engine";
import { infraById } from "@/lib/engine/content";
import { TERRAIN_LABELS } from "@/lib/engine/regions";
import type { Region } from "@/lib/engine/types";

export function RegionPanel({
  region,
  onClose,
}: {
  region: Region | null;
  onClose: () => void;
}) {
  useAutoPause(!!region);
  const game = useGameStore((s) => s.game);
  const doBuild = useGameStore((s) => s.doBuild);

  if (!region || !game) return null;

  const builtDef = region.builtInfraId ? infraById(region.builtInfraId) : null;
  const options = availableInfrastructure(game);

  return (
    <Modal open={!!region} onClose={onClose} title={region.name} wide>
      <p className="-mt-2 mb-4 text-sm text-mist">
        Terrain: <span className="text-cyan">{TERRAIN_LABELS[region.terrain]}</span>{" "}
        · One infrastructure per region.
      </p>

      {builtDef ? (
        <div className="glass rounded-xl border-l-4 border-l-leaf p-4">
          <p className="text-3xl">{builtDef.icon}</p>
          <h3 className="mt-2 font-display text-lg font-semibold text-leaf">
            {builtDef.name}
          </h3>
          <p className="mt-1 text-sm text-mist">{builtDef.description}</p>
          <p className="mt-2 text-xs text-fog/80">
            Effective output here:{" "}
            <span className="text-leaf">
              {effectiveInfraDelta(builtDef, region, game.completedResearch).toFixed(5)} ppm/mo
            </span>
          </p>
        </div>
      ) : (
        <div className="grid max-h-[55vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {options.map((def) => {
            const locked = def.requiresResearch && !game.completedResearch.includes(def.requiresResearch);
            const affordable = game.budget >= def.cost;
            const favored = def.favoredTerrain.includes(region.terrain);
            const eff = effectiveInfraDelta(def, region, game.completedResearch);
            return (
              <div key={def.id} className="glass flex flex-col rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{def.icon}</span>
                  {favored && (
                    <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] text-leaf">
                      terrain bonus
                    </span>
                  )}
                </div>
                <h4 className="mt-2 font-display text-sm font-semibold text-fog">{def.name}</h4>
                <p className="mt-1 flex-1 text-xs text-mist">{def.description}</p>
                {def.dataBlanks.length > 0 && (
                  <p className="mt-2 text-[11px] text-mist">
                    Real impact:{" "}
                    {def.dataBlanks.map((id) => (
                      <span key={id} className="mr-1 inline-block">
                        <DataChip id={id} />
                      </span>
                    ))}
                  </p>
                )}
                <div className="mt-2 space-y-0.5 text-[11px]">
                  <p className="text-fog/80">Cost: ${def.cost.toLocaleString()}</p>
                  <p className="text-leaf">Carbon: {eff.toFixed(5)} ppm/mo</p>
                  <p className={def.supportDelta >= 0 ? "text-leaf" : "text-amber"}>
                    Support: {def.supportDelta >= 0 ? "+" : ""}{def.supportDelta}%
                  </p>
                </div>
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={!!locked || !affordable}
                  onClick={() => doBuild(region.id, def.id)}
                >
                  {locked ? "🔒 Research needed" : !affordable ? "Can't afford" : "Build here"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
