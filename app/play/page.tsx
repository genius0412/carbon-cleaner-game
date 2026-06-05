"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntroBriefing } from "@/components/game/IntroBriefing";
import { CharacterSelect } from "@/components/game/CharacterSelect";
import { CityNamer } from "@/components/game/CityNamer";
import { CityReveal } from "@/components/game/CityReveal";
import { Dashboard } from "@/components/game/Dashboard";
import { loadLocal, restoreLatestForUser } from "@/lib/saves";
import { useAuth } from "@/lib/auth";
import type { CharacterType, GameState } from "@/lib/engine/types";
import type { SaveMeta } from "@/lib/saves";

type Phase = "menu" | "intro" | "character" | "city" | "launch" | "playing";

export default function PlayPage() {
  const game = useGameStore((s) => s.game);
  const newGame = useGameStore((s) => s.newGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const { user, loading: authLoading, signOut } = useAuth();

  const [phase, setPhase] = useState<Phase>("menu");
  const [character, setCharacter] = useState<CharacterType>("mayor");
  const [hasLocalSave, setHasLocalSave] = useState(false);
  const [asGuest, setAsGuest] = useState(true);
  const [cloudSave, setCloudSave] = useState<{ state: GameState; meta: SaveMeta } | null>(null);

  useEffect(() => {
    setHasLocalSave(!!loadLocal());
  }, []);

  // When logged in, default to saving under the account and look for a cloud save.
  useEffect(() => {
    if (user) {
      setAsGuest(false);
      restoreLatestForUser(user.id).then(setCloudSave);
    } else {
      setCloudSave(null);
    }
  }, [user]);

  // resuming an existing game from the menu jumps straight in (the onboarding
  // flow drives its own transition through the cinematic launch).
  useEffect(() => {
    if (game && phase === "menu") setPhase("playing");
  }, [game, phase]);

  if (phase === "playing" && game) {
    return (
      <ToastProvider>
        <Dashboard />
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
            <h1 className="mt-4 font-display text-4xl font-semibold">Carbon Cleaner</h1>
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
              {/* continue cloud save (logged in) */}
              {user && cloudSave && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => loadGame(cloudSave.state, cloudSave.meta)}
                >
                  ☁ Continue your saved game ({cloudSave.state.cityName})
                </Button>
              )}
              {/* continue local save (guest / offline) */}
              {!user && hasLocalSave && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    const saved = loadLocal();
                    if (saved) loadGame(saved.state, saved.meta);
                  }}
                >
                  ⏎ Continue saved game
                </Button>
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

              <Button className="w-full" onClick={() => setPhase("intro")}>
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
            }}
          />
        )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
