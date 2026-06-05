"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/store";
import type { Region } from "@/lib/engine/types";
import { GaugesBar } from "./GaugesBar";
import { GameClock } from "./GameClock";
import { TimeControls } from "./TimeControls";
import { GameMap } from "./GameMap";
import { RegionPanel } from "./panels/RegionPanel";
import { ResearchPanel } from "./panels/ResearchPanel";
import { BillsPanel } from "./panels/BillsPanel";
import { TreesPanel } from "./panels/TreesPanel";
import { CivicAction } from "./CivicAction";
import { EndScreen } from "./EndScreen";
import { StoryModal } from "./StoryModal";
import { FeedbackCard } from "@/components/ui/FeedbackCard";
import { Button } from "@/components/ui/Button";

type PanelKey = "research" | "bills" | "trees" | "civic" | null;

export function Dashboard() {
  const game = useGameStore((s) => s.game);
  const meta = useGameStore((s) => s.meta);
  const paused = useGameStore((s) => s.paused);
  const speed = useGameStore((s) => s.speed);
  const openPanels = useGameStore((s) => s.openPanels);
  const advanceClock = useGameStore((s) => s.advanceClock);
  const lastFeedback = useGameStore((s) => s.lastFeedback);
  const clearFeedback = useGameStore((s) => s.clearFeedback);
  const civicRequested = useGameStore((s) => s.civicRequested);
  const clearCivicRequest = useGameStore((s) => s.clearCivicRequest);

  const [region, setRegion] = useState<Region | null>(null);
  const [panel, setPanel] = useState<PanelKey>(null);
  const [showCode, setShowCode] = useState(true);

  // --- smooth game clock loop (requestAnimationFrame) ---
  const advanceRef = useRef(advanceClock);
  advanceRef.current = advanceClock;
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(250, now - last); // clamp after tab-away
      last = now;
      advanceRef.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // open the civic letter desk when a civic story beat is accepted
  useEffect(() => {
    if (civicRequested) {
      setPanel("civic");
      clearCivicRequest();
    }
  }, [civicRequested, clearCivicRequest]);

  if (!game) return null;
  const isStudent = game.mode === "student";

  return (
    <div className="flex min-h-screen flex-col p-3 sm:p-4">
      {/* top bar */}
      <motion.div
        className="mb-3 flex flex-wrap items-center justify-between gap-3"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-leaf shadow-[0_0_12px] shadow-leaf" />
            {game.cityName}
          </Link>
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-mist">
            {game.characterType === "mayor"
              ? "Mayor"
              : game.characterType === "student_older"
                ? "Student 14–18"
                : "Student 9–14"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GameClock />
          <TimeControls />
        </div>
      </motion.div>

      {/* gauges */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GaugesBar game={game} />
      </motion.div>

      {/* guest resume code */}
      <AnimatePresence>
        {meta.guestCode && showCode && (
          <motion.div
            className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber/30 bg-amber/10 px-4 py-2 text-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="text-amber">
              Guest resume code: <strong className="font-mono">{meta.guestCode}</strong> — copy &amp; save it to restore later.
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="amber" onClick={() => navigator.clipboard?.writeText(meta.guestCode!)}>Copy</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCode(false)}>Dismiss</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* main: map + actions */}
      <div className="mt-3 grid flex-1 gap-3 lg:grid-cols-[1fr_300px]">
        <motion.div
          className="min-h-[420px]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GameMap game={game} onRegionClick={(r) => setRegion(r)} />
        </motion.div>

        <motion.aside
          className="flex flex-col gap-2"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-xs uppercase tracking-widest text-mist">Actions</p>
          <Button variant="secondary" onClick={() => setRegion(game.regions[0])}>
            🗺️ Build on the map
          </Button>

          {/* Features unlock through the storyline. Locked ones show greyed so
              the player can see what's coming next. */}
          <ActionButton
            unlocked={game.unlockedFeatures.includes("trees")}
            label="🌳 Tree Planting"
            onClick={() => setPanel("trees")}
          />
          {!isStudent && (
            <>
              <ActionButton
                unlocked={game.unlockedFeatures.includes("research")}
                label="🔬 Research Corporations"
                onClick={() => setPanel("research")}
              />
              <ActionButton
                unlocked={game.unlockedFeatures.includes("bills")}
                label="📜 Bills & Legislation"
                onClick={() => setPanel("bills")}
              />
            </>
          )}

          {/* Civic action is NOT a permanent button — it is summoned by the
              citizenry via story beats. Show a subtle reminder once unlocked. */}
          {game.civic?.boostApplied && (
            <div className="glass rounded-xl border-l-2 border-l-cyan p-3 text-xs text-cyan">
              ✓ You answered the people's call. Your letter is on the record.
            </div>
          )}

          <div className="glass mt-2 rounded-xl p-3 text-xs text-mist">
            <p className="font-semibold text-fog">Status</p>
            <p className="mt-1">{paused || openPanels > 0 ? "⏸ Paused" : `▶ Running ${speed}x`}</p>
            <p className="mt-1">Built: {game.builtInfra.length} / {game.regions.length} regions</p>
            <p>Research done: {game.completedResearch.length}</p>
            <p>Bills passed: {game.passedBills.length}</p>
          </div>

          {/* recent log */}
          <div className="glass mt-1 max-h-48 overflow-y-auto rounded-xl p-3 text-xs">
            <p className="font-semibold text-fog">Recent actions</p>
            {game.log.length === 0 && <p className="mt-1 text-mist">No actions yet.</p>}
            <ul className="mt-1 space-y-1">
              {[...game.log].reverse().slice(0, 12).map((l, i) => (
                <li key={i} className="text-mist">
                  <span className="text-cyan">{l.yearMonth}</span> — {l.label}
                </li>
              ))}
            </ul>
          </div>
        </motion.aside>
      </div>

      {/* panels */}
      <RegionPanel region={region} onClose={() => setRegion(null)} />
      <ResearchPanel open={panel === "research"} onClose={() => setPanel(null)} />
      <BillsPanel open={panel === "bills"} onClose={() => setPanel(null)} />
      <TreesPanel open={panel === "trees"} onClose={() => setPanel(null)} />
      <CivicAction open={panel === "civic"} onClose={() => setPanel(null)} />

      {/* story, feedback + end */}
      <StoryModal />
      <FeedbackCard data={lastFeedback} onDismiss={clearFeedback} />
      {game.status !== "playing" && <EndScreen game={game} />}
    </div>
  );
}

/** Sidebar action that's greyed + locked until the storyline unlocks it. */
function ActionButton({
  unlocked,
  label,
  onClick,
}: {
  unlocked: boolean;
  label: string;
  onClick: () => void;
}) {
  if (unlocked) {
    return (
      <Button variant="secondary" onClick={onClick}>
        {label}
      </Button>
    );
  }
  return (
    <button
      disabled
      title="Unlocks as your story progresses"
      className="cursor-not-allowed rounded-full border border-white/8 px-5 py-2.5 text-sm text-mist/40"
    >
      🔒 {label.replace(/^\S+\s/, "")}
    </button>
  );
}
