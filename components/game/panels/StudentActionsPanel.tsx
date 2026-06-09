"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGameStore } from "@/lib/store";
import { useAutoPause } from "../useAutoPause";
import { ChallengeModal } from "../challenges/ChallengeModal";
import { STUDENT_ACTIONS } from "@/lib/engine/studentActions";
import { studentActionStatus } from "@/lib/engine/engine";
import type {
  GameState,
  StudentActionCategory,
  StudentActionDef,
} from "@/lib/engine/types";

const CATEGORY_LABELS: Record<StudentActionCategory, string> = {
  awareness: "Awareness & Advocacy",
  school: "At School",
  lifestyle: "Everyday Habits",
  community: "In the Community",
  fundraising: "Fundraising",
};

const CATEGORY_ORDER: StudentActionCategory[] = [
  "awareness",
  "school",
  "lifestyle",
  "community",
  "fundraising",
];

export function StudentActionsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useAutoPause(open);
  const game = useGameStore((s) => s.game);
  const doStudentAction = useGameStore((s) => s.doStudentAction);
  const [active, setActive] = useState<StudentActionDef | null>(null);
  if (!game) return null;

  return (
    <Modal open={open} onClose={onClose} title="Take Action" wide>
      <p className="-mt-2 mb-4 text-sm text-mist">
        You don't need a city budget to make a difference. Organize, advocate,
        and change habits — every action builds public support and chips away at
        emissions. Repeat your favourites (they get a little less effective each
        time) and run fundraisers to bankroll trees and local builds.
      </p>

      <div className="space-y-5">
        {CATEGORY_ORDER.map((cat, ci) => {
          const actions = STUDENT_ACTIONS.filter((a) => a.category === cat);
          if (actions.length === 0) return null;
          return (
            <motion.section
              key={cat}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: ci * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="mb-2 font-display text-sm font-semibold text-cyan">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {actions.map((a, ai) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: ci * 0.06 + ai * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <ActionCard def={a} game={game} onDo={() => setActive(a)} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      <ChallengeModal
        def={active}
        open={active !== null}
        onClose={() => setActive(null)}
        onComplete={(scale) => {
          if (active) doStudentAction(active.id, scale);
        }}
      />
    </Modal>
  );
}

function ActionCard({
  def,
  game,
  onDo,
}: {
  def: StudentActionDef;
  game: GameState;
  onDo: () => void;
}) {
  const status = studentActionStatus(game, def.id);
  const tooPoor = def.cost > 0 && game.budget < def.cost;
  const disabled = !status.available || tooPoor;

  const buttonLabel = status.locked
    ? "🔒 Locked"
    : status.doneOnce
      ? "✓ Done"
      : status.cooldownLeft > 0
        ? `Available in ${status.cooldownLeft} mo`
        : tooPoor
          ? "Need funds"
          : status.count > 0
            ? "Do again"
            : "Do it";

  return (
    <Card
      className={`flex h-full flex-col gap-2 transition-transform duration-200 hover:-translate-y-0.5 ${
        status.locked ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-xl leading-none">{def.icon}</span>
        <div className="min-w-0">
          <p className="font-semibold text-fog">{def.name}</p>
          <p className="mt-0.5 text-xs text-mist">{def.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {def.synergyBoost ? (
          <Chip className="text-leaf">⚡ boosts every other action</Chip>
        ) : null}
        {def.carbonDelta < 0 && (
          <Chip className="text-leaf">🌿 cuts emissions</Chip>
        )}
        {def.supportDelta > 0 && (
          <Chip className="text-cyan">👥 +{def.supportDelta}% support</Chip>
        )}
        {def.budgetDelta ? (
          <Chip className="text-amber">
            💰 +${def.budgetDelta.toLocaleString()}
          </Chip>
        ) : null}
        {def.cost > 0 && (
          <Chip className="text-mist">cost ${def.cost.toLocaleString()}</Chip>
        )}
        {def.repeatable ? (
          <Chip className="text-mist/70">repeatable</Chip>
        ) : (
          <Chip className="text-mist/70">one-time</Chip>
        )}
        {/* Active synergy from a foundational action already taken. */}
        {!status.locked && status.synergyBonus > 0 && (
          <Chip className="text-leaf">⚡ +{Math.round(status.synergyBonus * 100)}% boosted</Chip>
        )}
      </div>

      {/* Prerequisite hint when this action is still locked. */}
      {status.locked && (
        <p className="text-[11px] text-amber">
          🔒 Requires: {status.missingRequirements.join(", ")}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-mist">
          {status.count > 0 ? `Done ${status.count}×` : " "}
        </span>
        <Button size="sm" onClick={onDo} disabled={disabled}>
          {buttonLabel}
        </Button>
      </div>
    </Card>
  );
}

function Chip({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`rounded-full bg-white/5 px-2 py-0.5 ${className}`}>
      {children}
    </span>
  );
}
