"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Asks the player for a display name before the game starts. Used for guests,
 * who have no account name to fall back to. Requires a non-empty name.
 */
export function PlayerNamer({
  initial = "",
  onConfirm,
}: {
  initial?: string;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  const trimmed = name.trim();
  const valid = trimmed.length >= 2;

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="font-display text-4xl font-semibold">What should we call you?</h1>
      <p className="mt-3 text-mist">The name others see when you play.</p>

      <Card className="mt-8 space-y-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid) onConfirm(trimmed);
          }}
          maxLength={40}
          placeholder="Your name"
          className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2.5 text-center text-lg outline-none focus:border-leaf/50"
        />
        <Button className="w-full" disabled={!valid} onClick={() => onConfirm(trimmed)}>
          Continue →
        </Button>
      </Card>
    </div>
  );
}
