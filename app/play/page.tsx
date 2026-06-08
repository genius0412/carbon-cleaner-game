"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";
import { LeafLogo } from "@/components/ui/LeafLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntroBriefing } from "@/components/game/IntroBriefing";
import { CharacterSelect } from "@/components/game/CharacterSelect";
import { CityNamer } from "@/components/game/CityNamer";
import { CityReveal } from "@/components/game/CityReveal";
import { Dashboard } from "@/components/game/Dashboard";
import {
  listLocalSaves,
  listSavesForUser,
  deleteLocalSave,
  deleteCloudSave,
  type SaveEntry,
} from "@/lib/saves";
import { formatYearMonth } from "@/lib/engine/engine";
import { joinClassByCode, normalizeClassCode } from "@/lib/classroom";
import { useAuth } from "@/lib/auth";
import type { CharacterType } from "@/lib/engine/types";

type Phase = "menu" | "joinclass" | "intro" | "character" | "city" | "launch" | "playing";

const CHAR_LABEL: Record<CharacterType, string> = {
  mayor: "Mayor",
  student_older: "Student 14–18",
  student_younger: "Student 9–14",
};

/** Where login/signup should return to, preserving the class code if present. */
function classCodeNext(code: string): string {
  const c = normalizeClassCode(code);
  return c ? `/play?class=${encodeURIComponent(c)}` : "/play";
}

export default function PlayPage() {
  const game = useGameStore((s) => s.game);
  const newGame = useGameStore((s) => s.newGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const save = useGameStore((s) => s.save);
  const { user, loading: authLoading, signOut } = useAuth();

  const [phase, setPhase] = useState<Phase>("menu");
  const [character, setCharacter] = useState<CharacterType>("mayor");
  const [asGuest, setAsGuest] = useState(true);
  const [saves, setSaves] = useState<SaveEntry[]>([]);
  // Class the new game should auto-join after it's created (from the join step
  // or a teacher's invite link).
  const [classCode, setClassCode] = useState("");
  const [pendingClassCode, setPendingClassCode] = useState<string | null>(null);

  // Teacher invite link: /play?class=CODE → jump straight to the join step with
  // the code pre-filled so students don't have to type anything.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("class");
    if (c && !game) {
      setClassCode(normalizeClassCode(c));
      setPhase("joinclass");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After a new game is created, link it to the chosen class (best-effort, in
  // the background so it never blocks the launch). The result is surfaced in
  // the game via the feedback card.
  const autoJoinClass = useCallback(
    async (code: string, cityName: string) => {
      await save();
      const { meta: m, game: g, setFeedback } = useGameStore.getState();
      const saveId = m.id;
      if (!saveId) {
        setFeedback({
          title: "Class not joined yet",
          message:
            "Couldn't link your game to the class — open “Join a class” from the game menu to try again.",
          ok: false,
        });
        return;
      }
      const res = await joinClassByCode(code, saveId, cityName, g?.createdAt);
      setFeedback({ title: res.ok ? "Joined class" : "Class", message: res.message, ok: res.ok });
    },
    [save],
  );

  // Refresh the list of saved games. Always include local saves, and merge in
  // cloud saves when logged in (deduped) so games show whether or not you're
  // signed in / Supabase is configured.
  const refreshSaves = useCallback(async () => {
    // Local saves are mirrored copies that may belong to a signed-in account.
    // Only surface ones the *current* viewer owns: when logged out (guest),
    // that's guest saves only (no userId); when logged in, that's your own
    // saves plus guest saves — never another account's leftovers.
    const local = listLocalSaves().filter((e) =>
      user ? !e.meta.userId || e.meta.userId === user.id : !e.meta.userId,
    );
    const cloud = user ? await listSavesForUser(user.id) : [];
    const seen = new Set<string>();
    const merged: SaveEntry[] = [];
    for (const e of [...cloud, ...local]) {
      const id = e.meta.id ?? e.meta.localId ?? e.key;
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(e);
    }
    merged.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setSaves(merged);
  }, [user]);

  useEffect(() => {
    // Logged in → default to saving under the account; logged out → guest mode.
    setAsGuest(!user);
    refreshSaves();
  }, [user, refreshSaves]);

  // Reload the list whenever we land back on the menu (e.g. after "Play again").
  useEffect(() => {
    if (phase === "menu") refreshSaves();
  }, [phase, refreshSaves]);

  // After "Play again" the store clears the game; return to the menu instead of
  // rendering a blank screen (there is no "playing" view without a game).
  useEffect(() => {
    if (!game && phase === "playing") setPhase("menu");
  }, [game, phase]);

  const handleDelete = async (entry: SaveEntry) => {
    if (entry.meta.id) await deleteCloudSave(entry.meta.id);
    deleteLocalSave(entry.key);
    refreshSaves();
  };

  if (phase === "playing" && game) {
    return (
      <ToastProvider>
        <Dashboard onExit={() => setPhase("menu")} />
      </ToastProvider>
    );
  }

  if (phase === "launch" && game) {
    return <CityReveal cityName={game.cityName} onDone={() => setPhase("playing")} />;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden eco-grid px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-leaf/10 blur-[120px]" />

      {/* initial={false} => first paint renders fully visible (no SSR opacity:0
          blank-screen risk); later phase changes still animate. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={phase}
          className="z-10 w-full"
          initial={{ opacity: 0, scale: 0.92, filter: "blur(12px)", y: 20 }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, scale: 1.06, filter: "blur(12px)", y: -20 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
        {phase === "menu" && (
          <div className="mx-auto max-w-md text-center">
            <Link href="/" className="text-sm text-mist hover:text-fog">← Home</Link>
            <h1 className="mt-4 flex items-center justify-center gap-2 font-display text-4xl font-semibold">
              <LeafLogo className="h-9 w-9 text-leaf drop-shadow-[0_0_10px_rgba(61,220,132,0.5)]" />
              Carbon Cleaner
            </h1>
            <p className="mt-2 text-mist">Begin your mission to net-zero.</p>
            {/* logged-in banner */}
            {user && (
              <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-leaf/30 bg-leaf/10 px-4 py-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-leaf shadow-[0_0_8px] shadow-leaf" />
                <span className="text-fog">
                  Logged in as{" "}
                  <strong className="text-leaf">{user.username ?? user.email}</strong>
                </span>
              </div>
            )}

            <Card className="mt-4 space-y-3">
              {/* a game already in memory (e.g. navigated here mid-play) */}
              {game && game.status === "playing" && (
                <Button variant="secondary" className="w-full" onClick={() => setPhase("playing")}>
                  ⏎ Resume current game ({game.cityName})
                </Button>
              )}

              {/* saved games: continue, view report, or delete */}
              {saves.length > 0 && (
                <div className="space-y-2 text-left">
                  <p className="text-xs uppercase tracking-widest text-mist">Your games</p>
                  {saves.map((s) => {
                    const st = s.state;
                    const statusLabel =
                      st.status === "won"
                        ? "Net-zero 🌍"
                        : st.status === "lost"
                          ? "Time ran out"
                          : "In progress";
                    const reportHref = `/report/${s.meta.id ?? s.meta.localId ?? "local"}`;
                    return (
                      <div key={s.key} className="glass rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display font-semibold text-fog">{st.cityName}</p>
                            <p className="text-[11px] text-mist">
                              {CHAR_LABEL[st.characterType]} · {statusLabel}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(s)}
                            aria-label="Delete game"
                            title="Delete game"
                            className="rounded-full p-1.5 text-mist hover:bg-danger/15 hover:text-danger"
                          >
                            🗑
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-mist">
                          {formatYearMonth(st)} · {st.carbonPpm.toFixed(0)} ppm · support{" "}
                          {st.support.toFixed(0)}%
                        </p>
                        <div className="mt-2 flex gap-2">
                          {st.status === "playing" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                loadGame(s.state, s.meta);
                                setPhase("playing");
                              }}
                            >
                              ⏎ Continue
                            </Button>
                          ) : null}
                          <Link href={reportHref}>
                            <Button size="sm" variant="ghost">📄 Report</Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* guest option only when logged out */}
              {!user && (
                <label className="flex items-center justify-center gap-2 text-xs text-mist">
                  <input
                    type="checkbox"
                    checked={asGuest}
                    onChange={(e) => setAsGuest(e.target.checked)}
                  />
                  Play as guest (generates a resume code)
                </label>
              )}

              <Button
                className="w-full"
                onClick={() => {
                  setClassCode("");
                  setPendingClassCode(null);
                  setPhase("joinclass");
                }}
              >
                ✦ New game
              </Button>

              {user ? (
                <div className="flex justify-center gap-4 pt-1 text-xs text-mist">
                  <button onClick={signOut} className="hover:text-fog">Log out</button>
                  <Link href="/classroom" className="hover:text-fog">Classroom</Link>
                </div>
              ) : (
                <div className="flex justify-center gap-4 pt-1 text-xs text-mist">
                  {authLoading ? (
                    <span>Checking session…</span>
                  ) : (
                    <>
                      <Link href="/login" className="hover:text-fog">Log in</Link>
                      <Link href="/signup" className="hover:text-fog">Sign up</Link>
                      <Link href="/classroom" className="hover:text-fog">Classroom</Link>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {phase === "joinclass" && (
          <div className="mx-auto max-w-md text-center">
            <h1 className="flex items-center justify-center gap-2 font-display text-3xl font-semibold">
              <LeafLogo className="h-8 w-8 text-leaf drop-shadow-[0_0_10px_rgba(61,220,132,0.5)]" />
              Join a class?
            </h1>
            <p className="mt-3 text-sm text-mist">
              If your teacher gave you a class code, enter it now to put your city
              on the class scoreboard. No code? No problem — you can join a class
              at any time from the game menu.
            </p>
            <Card className="mt-5 space-y-3">
              <input
                autoFocus
                className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-center font-mono text-lg uppercase tracking-widest outline-none focus:border-leaf/50"
                placeholder="CLASS CODE"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && classCode.trim()) {
                    setPendingClassCode(normalizeClassCode(classCode));
                    setPhase("intro");
                  }
                }}
              />
              <Button
                className="w-full"
                disabled={!classCode.trim()}
                onClick={() => {
                  setPendingClassCode(normalizeClassCode(classCode));
                  setPhase("intro");
                }}
              >
                Join class &amp; continue →
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setPendingClassCode(null);
                  setPhase("intro");
                }}
              >
                Don&apos;t join a class
              </Button>
            </Card>

            {/* Let students sign in so their game saves to their account. The
                class code is preserved via ?next= so they return right here. */}
            {!user && (
              <p className="mt-4 text-xs text-mist">
                Want your game saved to your account?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(classCodeNext(classCode))}`}
                  className="text-leaf hover:underline"
                >
                  Log in
                </Link>{" "}
                or{" "}
                <Link
                  href={`/signup?next=${encodeURIComponent(classCodeNext(classCode))}`}
                  className="text-leaf hover:underline"
                >
                  sign up
                </Link>
                . You&apos;ll come right back to this class.
              </p>
            )}
            {user && (
              <p className="mt-4 text-xs text-mist">
                Signed in as{" "}
                <strong className="text-leaf">{user.username ?? user.email}</strong>
              </p>
            )}

            <button
              onClick={() => setPhase("menu")}
              className="mt-4 text-xs text-mist hover:text-fog"
            >
              ← Back
            </button>
          </div>
        )}

        {phase === "intro" && <IntroBriefing onContinue={() => setPhase("character")} />}

        {phase === "character" && (
          <CharacterSelect
            onSelect={(t) => {
              setCharacter(t);
              setPhase("city");
            }}
          />
        )}

        {phase === "city" && (
          <CityNamer
            onConfirm={(name) => {
              newGame(character, name, { asGuest, userId: user?.id ?? null });
              setPhase("launch");
              // Link the fresh game to the chosen class in the background.
              if (pendingClassCode) {
                autoJoinClass(pendingClassCode, name);
                setPendingClassCode(null);
              }
            }}
          />
        )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
