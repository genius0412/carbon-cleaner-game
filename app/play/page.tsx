"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntroBriefing } from "@/components/game/IntroBriefing";
import { CharacterSelect } from "@/components/game/CharacterSelect";
import { CityNamer } from "@/components/game/CityNamer";
import { Dashboard } from "@/components/game/Dashboard";
import { loadLocal } from "@/lib/saves";
import type { CharacterType } from "@/lib/engine/types";

type Phase = "menu" | "intro" | "character" | "city" | "playing";

export default function PlayPage() {
  const game = useGameStore((s) => s.game);
  const newGame = useGameStore((s) => s.newGame);
  const loadGame = useGameStore((s) => s.loadGame);

  const [phase, setPhase] = useState<Phase>("menu");
  const [character, setCharacter] = useState<CharacterType>("mayor");
  const [hasLocalSave, setHasLocalSave] = useState(false);
  const [asGuest, setAsGuest] = useState(true);

  useEffect(() => {
    setHasLocalSave(!!loadLocal());
  }, []);

  // if a game is live in the store, jump to playing
  useEffect(() => {
    if (game) setPhase("playing");
  }, [game]);

  if (phase === "playing" && game) {
    return (
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden eco-grid px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-leaf/10 blur-[120px]" />

      <div className="z-10 w-full">
        {phase === "menu" && (
          <div className="mx-auto max-w-md text-center">
            <Link href="/" className="text-sm text-mist hover:text-fog">← Home</Link>
            <h1 className="mt-4 font-display text-4xl font-semibold">Carbon Cleaner</h1>
            <p className="mt-2 text-mist">Begin your mission to net-zero.</p>
            <Card className="mt-8 space-y-3">
              {hasLocalSave && (
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
              <label className="flex items-center justify-center gap-2 text-xs text-mist">
                <input
                  type="checkbox"
                  checked={asGuest}
                  onChange={(e) => setAsGuest(e.target.checked)}
                />
                Play as guest (generates a resume code)
              </label>
              <Button className="w-full" onClick={() => setPhase("intro")}>
                ✦ New game
              </Button>
              <div className="flex justify-center gap-4 pt-1 text-xs text-mist">
                <Link href="/login" className="hover:text-fog">Log in</Link>
                <Link href="/signup" className="hover:text-fog">Sign up</Link>
                <Link href="/classroom" className="hover:text-fog">Classroom</Link>
              </div>
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
              newGame(character, name, asGuest);
              setPhase("playing");
            }}
          />
        )}
      </div>
    </main>
  );
}
