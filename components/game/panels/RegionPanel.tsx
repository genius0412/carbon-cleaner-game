"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DataChip } from "@/components/ui/DataChip";
import { useGameStore } from "@/lib/store";
import { useAutoPause } from "../useAutoPause";
import {
  availableInfrastructure,
  effectiveInfraDelta,
  infraLevel,
  upgradeCost,
} from "@/lib/engine/engine";
import { infraById } from "@/lib/engine/content";
import { gainCut } from "../impact";
import { TERRAIN_LABELS } from "@/lib/engine/regions";
import { GAME } from "@/lib/config/gameConstants";
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
  const doReplace = useGameStore((s) => s.doReplace);
  const doUpgrade = useGameStore((s) => s.doUpgrade);

  if (!region || !game) return null;

  const builtDef = region.builtInfraId ? infraById(region.builtInfraId) : null;
  const options = availableInfrastructure(game);
  const hasBuilt = !!region.builtInfraId;
  const currentLevel = infraLevel(game, region.id);

  return (
    <Modal open={!!region} onClose={onClose} title={region.name} wide>
      <p className="-mt-2 mb-4 text-sm text-mist">
        Terrain: <span className="text-cyan">{TERRAIN_LABELS[region.terrain]}</span>
        {builtDef ? (
          <>
            {" "}· Currently built:{" "}
            <span className="text-leaf">{builtDef.icon} {builtDef.name}</span>. Pick
            another to replace it.
          </>
        ) : (
          <> · One infrastructure per region.</>
        )}
      </p>

      <div className="grid max-h-[55vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {options.map((def) => {
          const isBuilt = region.builtInfraId === def.id;
          const locked = def.requiresResearch && !game.completedResearch.includes(def.requiresResearch);
          const affordable = game.budget >= def.cost;
          const favored = def.favoredTerrain.includes(region.terrain);
          const eff = effectiveInfraDelta(def, region, game.completedResearch, isBuilt ? currentLevel : 1);

          // Upgrade economics for the facility already built here.
          const atMaxLevel = currentLevel >= GAME.upgrade.maxLevel;
          const upCost = upgradeCost(def, currentLevel);
          const canAffordUpgrade = game.budget >= upCost;

          const label = isBuilt
            ? "✓ Exists"
            : locked
              ? "🔒 Research needed"
              : !affordable
                ? "Can't afford"
                : hasBuilt
                  ? "Replace"
                  : "Build here";

          return (
            <div
              key={def.id}
              className={`glass flex flex-col rounded-xl p-4 ${isBuilt ? "border-l-4 border-l-leaf" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{def.icon}</span>
                {isBuilt ? (
                  <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] text-leaf">
                    built · Lvl {currentLevel}/{GAME.upgrade.maxLevel}
                  </span>
                ) : favored ? (
                  <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] text-leaf">
                    terrain bonus
                  </span>
                ) : null}
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
                <p className="text-leaf">
                  🌿 Cuts carbon gain by {gainCut(eff)}
                  {isBuilt && currentLevel > 1 && (
                    <span className="text-cyan"> · {currentLevel}× upgraded</span>
                  )}
                </p>
                <p className={def.supportDelta >= 0 ? "text-leaf" : "text-amber"}>
                  Support: {def.supportDelta >= 0 ? "+" : ""}{def.supportDelta}%
                </p>
              </div>
              {isBuilt ? (
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-3"
                  disabled={atMaxLevel || !canAffordUpgrade}
                  onClick={() => doUpgrade(region.id)}
                  title={`Upgrade deepens carbon capture to ${currentLevel + 1}×`}
                >
                  {atMaxLevel
                    ? "✓ Max level"
                    : !canAffordUpgrade
                      ? `Upgrade (need $${upCost.toLocaleString()})`
                      : `⬆ Upgrade to Lvl ${currentLevel + 1} ($${upCost.toLocaleString()})`}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={hasBuilt ? "secondary" : "primary"}
                  className="mt-3"
                  disabled={!!locked || !affordable}
                  onClick={() => (hasBuilt ? doReplace(region.id, def.id) : doBuild(region.id, def.id))}
                >
                  {label}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
