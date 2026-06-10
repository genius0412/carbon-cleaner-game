"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGameStore } from "@/lib/store";
import { studentActionStatus } from "@/lib/engine/engine";
import type { StudentActionDef } from "@/lib/engine/types";
import {
  getChallenge,
  scoreToScale,
  WIN_SCORE,
  type Challenge,
} from "@/lib/challenges/studentChallenges";

type Stage = "intro" | "play" | "result";

/**
 * Wraps a student action in a small interactive scene: storyline intro → a
 * hands-on challenge → an outcome. The final score scales the reward, which is
 * applied by the parent via onComplete(scale).
 */
export function ChallengeModal({
  def,
  open,
  onClose,
  onComplete,
}: {
  def: StudentActionDef | null;
  open: boolean;
  onClose: () => void;
  onComplete: (scale: number) => void;
}) {
  // Repeats rotate through the action's challenge variants. The variant is
  // locked when the modal opens, so the count bump that happens mid-modal
  // (when the reward is applied) can't swap the scene under the player.
  const [content, setContent] = useState<
    ReturnType<typeof getChallenge> | undefined
  >(undefined);
  const [stage, setStage] = useState<Stage>("intro");
  const [score, setScore] = useState(0);
  const completed = useRef(false);

  // Pick the variant + reset whenever a new action's challenge opens.
  useEffect(() => {
    if (open && def) {
      const game = useGameStore.getState().game;
      const timesDone = game ? studentActionStatus(game, def.id).count : 0;
      setContent(getChallenge(def.id, timesDone));
      setStage("intro");
      setScore(0);
      completed.current = false;
    }
  }, [open, def?.id, def]);

  if (!def) return null;

  // Defensive fallback: every action should have challenge content, but if one
  // is missing we still let the player perform it (full reward) rather than
  // popping an empty modal that silently does nothing.
  if (!content) {
    return (
      <Modal open={open} onClose={onClose} title={`${def.icon} ${def.name}`} wide>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-fog/90">{def.description}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Maybe later
            </Button>
            <Button
              onClick={() => {
                if (!completed.current) {
                  completed.current = true;
                  onComplete(1);
                }
                onClose();
              }}
            >
              Do it →
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const won = score >= WIN_SCORE;

  const finish = (s: number) => {
    if (completed.current) return; // apply the reward exactly once
    completed.current = true;
    setScore(s);
    onComplete(scoreToScale(s)); // apply the (scaled) effect now
    setStage("result");
  };

  return (
    <Modal open={open} onClose={onClose} title={`${def.icon} ${def.name}`} wide>
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div
            key="intro"
            className="space-y-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm leading-relaxed text-fog/90">{content.intro}</p>
            <Card className="border-l-2 border-l-cyan">
              <p className="text-xs uppercase tracking-wide text-cyan">Your challenge</p>
              <p className="mt-1 text-sm text-fog">{content.task}</p>
            </Card>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Maybe later
              </Button>
              <Button onClick={() => setStage("play")}>Let&apos;s go →</Button>
            </div>
          </motion.div>
        )}

        {stage === "play" && (
          <motion.div
            key="play"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-4 text-sm font-semibold text-cyan">{content.task}</p>
            <ChallengeBody challenge={content.challenge} onDone={finish} />
          </motion.div>
        )}

        {stage === "result" && (
          <motion.div
            key="result"
            className="space-y-4 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="text-5xl"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.05 }}
            >
              {won ? "🎉" : "👍"}
            </motion.div>
            <p className="font-display text-lg font-semibold text-fog">
              {won ? "Nailed it!" : "Good effort!"}
            </p>
            <p className="mx-auto max-w-md text-sm text-mist">
              {won ? content.win : content.partial}
            </p>
            <RewardSummary def={def} scale={scoreToScale(score)} />
            <div className="flex justify-center">
              <Button onClick={onClose}>Done</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function RewardSummary({ def, scale }: { def: StudentActionDef; scale: number }) {
  const bits: string[] = [];
  if (def.carbonDelta < 0) bits.push("🌿 Emissions down");
  if (def.supportDelta > 0)
    bits.push(`👥 +${Math.round(def.supportDelta * scale)}% support`);
  if (def.budgetDelta)
    bits.push(`💰 +$${Math.round(def.budgetDelta * scale).toLocaleString()}`);
  if (bits.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2 text-xs">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="rounded-full bg-leaf/15 px-3 py-1 text-leaf"
          initial={{ opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.2 + i * 0.08 }}
        >
          {b}
        </motion.span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- dispatch */
function ChallengeBody({
  challenge,
  onDone,
}: {
  challenge: Challenge;
  onDone: (score: number) => void;
}) {
  switch (challenge.kind) {
    case "quiz":
      return <QuizChallenge challenge={challenge} onDone={onDone} />;
    case "sort":
      return <SortChallenge challenge={challenge} onDone={onDone} />;
    case "tap":
      return <TapChallenge challenge={challenge} onDone={onDone} />;
    case "order":
      return <OrderChallenge challenge={challenge} onDone={onDone} />;
    case "pick":
      return <PickChallenge challenge={challenge} onDone={onDone} />;
  }
}

/* ------------------------------------------------------------------- quiz */
function QuizChallenge({
  challenge,
  onDone,
}: {
  challenge: Extract<Challenge, { kind: "quiz" }>;
  onDone: (score: number) => void;
}) {
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = challenge.questions[i];

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const isRight = idx === q.answer;
    const nextCorrect = correct + (isRight ? 1 : 0);
    if (isRight) setCorrect(nextCorrect);
    // A wrong answer lingers longer so there's time to read the correct
    // (green-highlighted) option and the explanation.
    setTimeout(() => {
      if (i + 1 < challenge.questions.length) {
        setI(i + 1);
        setPicked(null);
      } else {
        onDone(nextCorrect / challenge.questions.length);
      }
    }, isRight ? 1100 : 2600);
  };

  return (
    <div>
      <p className="mb-1 text-[11px] text-mist">
        Question {i + 1} of {challenge.questions.length}
      </p>
      {/* progress bar */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-cyan"
          animate={{ width: `${(i / challenge.questions.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-3 text-sm font-medium text-fog">{q.q}</p>
          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              const isAnswer = idx === q.answer;
              const isPicked = picked === idx;
              const show = picked !== null;
              const cls = show
                ? isAnswer
                  ? "border-leaf/60 bg-leaf/15 text-fog"
                  : isPicked
                    ? "border-danger/60 bg-danger/15 text-fog"
                    : "border-white/10 text-mist"
                : "border-white/12 text-fog hover:border-leaf/40";
              return (
                <motion.button
                  key={idx}
                  onClick={() => choose(idx)}
                  disabled={show}
                  whileHover={show ? undefined : { scale: 1.015 }}
                  whileTap={show ? undefined : { scale: 0.98 }}
                  animate={show && isPicked ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${cls}`}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence>
            {picked !== null && q.explain && (
              <motion.p
                className="mt-3 text-xs text-cyan"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {q.explain}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------- sort */
function SortChallenge({
  challenge,
  onDone,
}: {
  challenge: Extract<Challenge, { kind: "sort" }>;
  onDone: (score: number) => void;
}) {
  // shuffle items once
  const items = useMemo(() => shuffle(challenge.items), [challenge]);
  const [assign, setAssign] = useState<Record<number, string>>({});
  // After Check, show which items were wrong and where they belonged before
  // moving on, so a mistake actually teaches something.
  const [revealed, setRevealed] = useState(false);
  const allAssigned = items.every((_, idx) => assign[idx]);
  const right = items.filter((it, idx) => assign[idx] === it.bucket).length;
  const bucketLabel = (id: string) =>
    challenge.buckets.find((b) => b.id === id)?.label ?? id;

  return (
    <div className="space-y-3">
      {items.map((it, idx) => {
        const isRight = revealed && assign[idx] === it.bucket;
        const isWrong = revealed && assign[idx] !== it.bucket;
        return (
          <motion.div
            key={idx}
            className={`glass rounded-lg p-2 ${
              isRight ? "border border-leaf/50" : isWrong ? "border border-danger/50" : ""
            }`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-2 text-sm text-fog">
              {isRight ? "✓ " : isWrong ? "✗ " : ""}
              {it.label}
            </p>
            {revealed ? (
              isWrong && (
                <p className="text-xs">
                  <span className="text-danger">You picked {bucketLabel(assign[idx])}.</span>{" "}
                  <span className="text-leaf">It belongs in {bucketLabel(it.bucket)}.</span>
                </p>
              )
            ) : (
              <div className="flex flex-wrap gap-2">
                {challenge.buckets.map((b) => (
                  <motion.button
                    key={b.id}
                    onClick={() => setAssign((a) => ({ ...a, [idx]: b.id }))}
                    whileTap={{ scale: 0.92 }}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      assign[idx] === b.id
                        ? "bg-leaf text-night font-semibold"
                        : "glass text-mist hover:text-fog"
                    }`}
                  >
                    {b.label}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-mist">
          {revealed
            ? `${right} of ${items.length} sorted right`
            : challenge.buckets.map((b) => b.hint && `${b.label}: ${b.hint}`).filter(Boolean).join("  ·  ")}
        </p>
        {revealed ? (
          <Button size="sm" onClick={() => onDone(right / items.length)}>
            Continue
          </Button>
        ) : (
          <Button size="sm" onClick={() => setRevealed(true)} disabled={!allAssigned}>
            Check
          </Button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- tap */
function TapChallenge({
  challenge,
  onDone,
}: {
  challenge: Extract<Challenge, { kind: "tap" }>;
  onDone: (score: number) => void;
}) {
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(challenge.seconds);
  const [started, setStarted] = useState(false);
  const fired = useRef(false);
  // Mirror count in a ref so the completion handler can read the final tally
  // without making the countdown depend on `count` (which would reset the
  // per-second timeout on every tap, freezing the clock when tapping fast).
  const countRef = useRef(0);

  // Countdown: one tick per second while running. Depends only on `started`
  // and `left`, so rapid taps never restart it.
  useEffect(() => {
    if (!started || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [started, left]);

  // When the clock hits zero, score it once from the final tap count.
  useEffect(() => {
    if (started && left <= 0 && !fired.current) {
      fired.current = true;
      onDone(Math.min(1, countRef.current / challenge.goal));
    }
  }, [started, left, challenge.goal, onDone]);

  const tap = () => {
    if (fired.current) return;
    if (!started) setStarted(true);
    countRef.current += 1;
    setCount(countRef.current);
    // Hitting the goal ends the challenge right away; no need to ride out
    // the rest of the clock once a full score is locked in.
    if (countRef.current >= challenge.goal) {
      fired.current = true;
      onDone(1);
    }
  };

  const pct = Math.min(100, (count / challenge.goal) * 100);

  return (
    <div className="space-y-4 text-center">
      <div className="flex items-center justify-between text-sm">
        <span className="text-mist">
          {started ? `⏱ ${left}s left` : "Tap to start the clock"}
        </span>
        <span className="font-semibold text-fog">
          {count} / {challenge.goal} {challenge.unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-leaf"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>
      <motion.button
        onClick={tap}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 600, damping: 20 }}
        className="w-full rounded-2xl bg-leaf/20 py-10 text-lg font-semibold text-leaf transition-colors hover:bg-leaf/30"
      >
        {challenge.tapLabel}
      </motion.button>
      <p className="text-[11px] text-mist">Tap as fast as you can!</p>
    </div>
  );
}

/* ------------------------------------------------------------------ order */
function OrderChallenge({
  challenge,
  onDone,
}: {
  challenge: Extract<Challenge, { kind: "order" }>;
  onDone: (score: number) => void;
}) {
  // start from a shuffled order (guaranteed different from correct)
  const [order, setOrder] = useState<number[]>(() =>
    shuffledIndices(challenge.steps.length),
  );
  // After locking in, show which steps were misplaced and where they belonged.
  const [revealed, setRevealed] = useState(false);
  const right = order.filter((origIdx, pos) => origIdx === pos).length;

  const move = (pos: number, dir: -1 | 1) => {
    const next = [...order];
    const swap = pos + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[pos], next[swap]] = [next[swap], next[pos]];
    setOrder(next);
  };

  return (
    <div className="space-y-2">
      {order.map((origIdx, pos) => {
        const isRight = revealed && origIdx === pos;
        const isWrong = revealed && origIdx !== pos;
        return (
          <motion.div
            key={origIdx}
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={`flex items-center gap-2 glass rounded-lg p-2 ${
              isRight ? "border border-leaf/50" : isWrong ? "border border-danger/50" : ""
            }`}
          >
            <motion.span layout="position" className="w-5 text-center text-xs font-semibold text-cyan">
              {pos + 1}
            </motion.span>
            <motion.span layout="position" className="flex-1 text-sm text-fog">
              {challenge.steps[origIdx]}
              {isWrong && (
                <span className="block text-xs text-leaf">
                  Should be step {origIdx + 1}
                </span>
              )}
            </motion.span>
            {!revealed && (
              <div className="flex flex-col">
                <button
                  onClick={() => move(pos, -1)}
                  disabled={pos === 0}
                  className="px-1 text-mist transition-colors hover:text-fog disabled:opacity-20"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(pos, 1)}
                  disabled={pos === order.length - 1}
                  className="px-1 text-mist transition-colors hover:text-fog disabled:opacity-20"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
            )}
            {revealed && <span className="text-sm">{isRight ? "✓" : "✗"}</span>}
          </motion.div>
        );
      })}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-mist">
          {revealed ? `${right} of ${challenge.steps.length} in the right spot` : " "}
        </p>
        {revealed ? (
          <Button size="sm" onClick={() => onDone(right / challenge.steps.length)}>
            Continue
          </Button>
        ) : (
          <Button size="sm" onClick={() => setRevealed(true)}>
            Lock it in
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- pick */
function PickChallenge({
  challenge,
  onDone,
}: {
  challenge: Extract<Challenge, { kind: "pick" }>;
  onDone: (score: number) => void;
}) {
  const options = useMemo(() => shuffle(challenge.options), [challenge]);
  const [picked, setPicked] = useState<number | null>(null);
  // The strongest option, revealed after picking so a weak pick still teaches
  // what the better call was.
  const bestIdx = useMemo(
    () => options.reduce((m, o, i) => (o.quality > options[m].quality ? i : m), 0),
    [options],
  );

  const show = picked !== null;
  const pickedBest = picked === bestIdx;

  return (
    <div className="space-y-2">
      {options.map((o, idx) => {
        const isPicked = picked === idx;
        const isBest = idx === bestIdx;
        const cls = show
          ? isBest
            ? "border-leaf/60 bg-leaf/15"
            : isPicked
              ? "border-amber/60 bg-amber/10"
              : "border-white/10 opacity-60"
          : "border-white/12 hover:border-leaf/40";
        return (
          <motion.button
            key={idx}
            onClick={() => picked === null && setPicked(idx)}
            disabled={show}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: show && !isPicked && !isBest ? 0.6 : 1,
              y: 0,
              scale: show && isPicked ? [1, 1.03, 1] : 1,
            }}
            transition={{ duration: 0.3, delay: show ? 0 : idx * 0.05 }}
            whileHover={show ? undefined : { scale: 1.015 }}
            whileTap={show ? undefined : { scale: 0.98 }}
            className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${cls}`}
          >
            <p className="text-sm text-fog">
              {show && isBest ? "★ " : ""}
              {o.label}
            </p>
            <AnimatePresence>
              {show && (isPicked || isBest) && (
                <motion.p
                  className="mt-1 text-xs text-mist"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {o.detail}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
      {show && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-mist">
            {pickedBest ? "You made the strongest call." : "★ marks the strongest call."}
          </p>
          <Button size="sm" onClick={() => onDone(options[picked!].quality)}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- helpers */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A shuffle of [0..n) that isn't already fully sorted (so there's a puzzle). */
function shuffledIndices(n: number): number[] {
  let order = shuffle(Array.from({ length: n }, (_, i) => i));
  if (order.every((v, i) => v === i) && n > 1) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}
