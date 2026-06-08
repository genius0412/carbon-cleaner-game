"use client";

import { useEffect, useRef, useState } from "react";
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
import { StudentActionsPanel } from "./panels/StudentActionsPanel";
import { CivicAction } from "./CivicAction";
import { JoinClassModal } from "./JoinClassModal";
import { OnboardingTour } from "./OnboardingTour";
import { EndScreen } from "./EndScreen";
import { StoryModal } from "./StoryModal";
import { Scoreboard } from "./Scoreboard";
import { useAutoPause } from "./useAutoPause";
import { FeedbackCard } from "@/components/ui/FeedbackCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LeafLogo } from "@/components/ui/LeafLogo";
import { listClassesForSave, fetchClassScoreboard, type SaveClass } from "@/lib/classroom";

type PanelKey = "research" | "bills" | "trees" | "civic" | "student" | null;

export function Dashboard({ onExit }: { onExit?: () => void }) {
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
  const save = useGameStore((s) => s.save);
  const setPaused = useGameStore((s) => s.setPaused);

  const [region, setRegion] = useState<Region | null>(null);
  const [panel, setPanel] = useState<PanelKey>(null);
  const [showCode, setShowCode] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [membershipKey, setMembershipKey] = useState(0);
  // Live scoreboard modal: null = closed; a string (possibly empty) = open,
  // pre-filling that class code. Pause the clock while it's open.
  const [scoreboardCode, setScoreboardCode] = useState<string | null>(null);
  useAutoPause(scoreboardCode !== null);
  const [showTour, setShowTour] = useState(false);

  // First-time players get the guided tour (clock frozen so they can read).
  // Returning players skip straight to playing with time flowing.
  useEffect(() => {
    const done = typeof window !== "undefined" && localStorage.getItem("cc-tour-done");
    if (done) {
      setPaused(false);
      return;
    }
    setShowTour(true);
    setPaused(true);
  }, [setPaused]);

  const finishTour = () => {
    try {
      localStorage.setItem("cc-tour-done", "1");
    } catch {
      /* ignore */
    }
    setShowTour(false);
    setPaused(false); // time starts flowing once the tour ends
  };

  const replayTour = () => {
    setPaused(true);
    setShowTour(true);
  };

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
      <OnboardingTour open={showTour} cityName={game.cityName} onClose={finishTour} />

      {/* top bar */}
      <motion.div
        className="mb-3 flex flex-wrap items-center justify-between gap-3"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              await save(); // flush the latest state before leaving
              onExit?.();
            }}
            className="flex items-center gap-2 rounded-full border border-white/12 px-3 py-1.5 text-sm font-semibold text-fog/90 hover:bg-white/5"
            title="Save & exit to the menu"
          >
            ⏏ Exit
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <LeafLogo className="h-5 w-5 text-leaf drop-shadow-[0_0_8px_rgba(61,220,132,0.45)]" />
            {game.cityName}
          </span>
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-mist">
            {game.characterType === "mayor"
              ? "Mayor"
              : game.characterType === "student_older"
                ? "Student 14–18"
                : "Student 9–14"}
          </span>
          <button
            onClick={replayTour}
            title="Replay the tour"
            aria-label="Replay the tour"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/12 text-xs text-mist transition-colors hover:bg-white/5 hover:text-fog"
          >
            ?
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveStatus />
          <span data-tour="clock">
            <GameClock />
          </span>
          <span data-tour="controls">
            <TimeControls />
          </span>
        </div>
      </motion.div>

      {/* gauges */}
      <motion.div
        data-tour="gauges"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
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
          data-tour="map"
          className="min-h-[420px]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GameMap game={game} onRegionClick={(r) => setRegion(r)} />
        </motion.div>

        <motion.aside
          data-tour="actions"
          className="flex flex-col gap-2"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-xs uppercase tracking-widest text-mist">Actions</p>
          <Button variant="secondary" onClick={() => setRegion(game.regions[0])}>
            🗺️ Build on the map
          </Button>

          {/* Grassroots actions are always available to students — no budget or
              storyline gate. This is the heart of what a student can do. */}
          {isStudent && (
            <Button variant="secondary" onClick={() => setPanel("student")}>
              ✊ Take Action
            </Button>
          )}

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

          {/* Show which class(es) this game is in, or a join button if none. */}
          <ClassMembership
            refreshKey={membershipKey}
            onJoin={() => setJoinOpen(true)}
            onScoreboard={(code) => setScoreboardCode(code)}
          />

          <div className="glass mt-2 rounded-xl p-3 text-xs text-mist">
            <p className="font-semibold text-fog">Status</p>
            <p className="mt-1">{paused || openPanels > 0 ? "⏸ Paused" : `▶ Running ${speed}x`}</p>
            <p className="mt-1">Built: {game.builtInfra.length} / {game.regions.length} regions</p>
            {/* Research & bills are mayor-only features — hide them for students. */}
            {!isStudent && (
              <>
                <p>Research done: {game.completedResearch.length}</p>
                <p>Bills passed: {game.passedBills.length}</p>
              </>
            )}
            {isStudent && <p>Actions taken: {game.studentActions.length}</p>}
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
      <StudentActionsPanel open={panel === "student"} onClose={() => setPanel(null)} />
      <CivicAction open={panel === "civic"} onClose={() => setPanel(null)} />
      <JoinClassModal
        open={joinOpen}
        onClose={() => {
          setJoinOpen(false);
          setMembershipKey((k) => k + 1); // re-check membership after joining
        }}
      />
      <Modal
        open={scoreboardCode !== null}
        onClose={() => setScoreboardCode(null)}
        title="🏆 Live scoreboard"
        wide
      >
        <p className="mb-3 text-sm text-mist">
          Watch the live standings for your class. Finishers rank first by finish
          time, then everyone still playing ranks by lowest carbon gain.
        </p>
        <Scoreboard initialCode={scoreboardCode ?? ""} fixed myId={meta.id ?? null} />
      </Modal>

      {/* story, feedback + end */}
      <StoryModal />
      <FeedbackCard data={lastFeedback} onDismiss={clearFeedback} />
      {game.status !== "playing" && <EndScreen game={game} />}
    </div>
  );
}

/** Manual save button + live "last saved" indicator. */
function SaveStatus() {
  const save = useGameStore((s) => s.save);
  const saving = useGameStore((s) => s.saving);
  const lastSavedAt = useGameStore((s) => s.lastSavedAt);

  // Re-render every 15s so the relative time stays fresh.
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const label = saving
    ? "Saving…"
    : lastSavedAt
      ? `Saved ${relativeTime(lastSavedAt)}`
      : "Not saved yet";

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[11px] text-mist sm:inline" aria-live="polite">
        {saving ? "💾 " : "✓ "}
        {label}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => save()}
        disabled={saving}
        title="Save now"
      >
        {saving ? "Saving…" : "💾 Save"}
      </Button>
    </div>
  );
}

/** Compact relative time: "just now", "2m ago", "1h ago". */
function relativeTime(ts: number): string {
  const secs = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

/** Shows the class(es) this game is in, or a join button when it's in none. */
function ClassMembership({
  refreshKey,
  onJoin,
  onScoreboard,
}: {
  refreshKey: number;
  onJoin: () => void;
  /** Open the live scoreboard for a specific class code. */
  onScoreboard: (code: string) => void;
}) {
  const meta = useGameStore((s) => s.meta);
  const [classes, setClasses] = useState<SaveClass[] | null>(null);

  useEffect(() => {
    let active = true;
    const saveId = meta.id;
    if (!saveId) {
      setClasses([]); // no cloud save yet → can't be in a class
      return;
    }
    setClasses(null);
    listClassesForSave(saveId).then((cs) => {
      if (active) setClasses(cs);
    });
    return () => {
      active = false;
    };
  }, [meta.id, refreshKey]);

  if (classes === null) {
    return <p className="px-1 text-[11px] text-mist">Checking class…</p>;
  }

  if (classes.length === 0) {
    return (
      <Button variant="ghost" onClick={onJoin}>
        🏫 Join a class
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {classes.map((c) => (
        <ClassCard
          key={c.id}
          cls={c}
          myId={meta.id ?? null}
          refreshKey={refreshKey}
          onScoreboard={onScoreboard}
        />
      ))}
    </div>
  );
}

/** One class the game belongs to: name, live size + the player's current place. */
function ClassCard({
  cls,
  myId,
  refreshKey,
  onScoreboard,
}: {
  cls: SaveClass;
  myId: string | null;
  refreshKey: number;
  onScoreboard: (code: string) => void;
}) {
  const [count, setCount] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const board = await fetchClassScoreboard(cls.join_code);
      if (!active || !board) return;
      setCount(board.rows.length);
      const idx = board.rows.findIndex((r) => myId && r.game_save_id === myId);
      setRank(idx >= 0 ? idx + 1 : null);
    };
    load();
    const t = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [cls.join_code, myId, refreshKey]);

  return (
    <div className="glass rounded-xl p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold text-fog">
          🏫 {cls.name || "Untitled Class"}
        </span>
        <span className="shrink-0 font-mono tracking-widest text-cyan">{cls.join_code}</span>
      </div>
      <p className="mt-1 text-mist">
        {count === null ? (
          "Loading standings…"
        ) : (
          <>
            {rank !== null ? (
              <>
                <span className="font-semibold text-leaf">#{rank}</span> of{" "}
              </>
            ) : null}
            {count} {count === 1 ? "player" : "players"}
          </>
        )}
      </p>
      <button
        onClick={() => onScoreboard(cls.join_code)}
        className="mt-1.5 text-mist transition-colors hover:text-fog"
      >
        🏆 Live scoreboard
      </button>
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
