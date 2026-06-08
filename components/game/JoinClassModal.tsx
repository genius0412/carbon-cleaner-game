"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/lib/store";
import { useAutoPause } from "./useAutoPause";
import { joinClassByCode } from "@/lib/classroom";

/**
 * In-game "join a class" dialog so players never have to leave the game. Saves
 * the game to the cloud first (joining links the cloud save id), then joins.
 */
export function JoinClassModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useAutoPause(open);
  const game = useGameStore((s) => s.game);
  const save = useGameStore((s) => s.save);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  if (!game) return null;

  const join = async () => {
    setBusy(true);
    setMsg(null);
    setOk(false);

    // Ensure the game has a cloud id to link.
    await save();
    const saveId = useGameStore.getState().meta.id;
    if (!saveId) {
      setBusy(false);
      setMsg("Couldn't save your game to the cloud yet. Try again in a moment.");
      return;
    }

    const result = await joinClassByCode(code, saveId, game.cityName, game.createdAt);
    setBusy(false);
    setOk(result.ok);
    setMsg(result.message);
  };

  return (
    <Modal open={open} onClose={onClose} title="🏫 Join a class">
      <p className="-mt-2 mb-4 text-sm text-mist">
        Got a class code from your teacher? Enter it to put{" "}
        <strong className="text-fog">{game.cityName}</strong> on the class scoreboard.
        You can do this any time.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          className="flex-1 rounded-lg border border-white/12 bg-night/60 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-leaf/50"
          placeholder="Class code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && code.trim() && join()}
        />
        <Button onClick={join} disabled={busy || !code.trim()}>
          {busy ? "Joining…" : "Join class"}
        </Button>
      </div>
      {msg && (
        <p className={`mt-3 text-sm ${ok ? "text-leaf" : "text-amber"}`}>{msg}</p>
      )}
    </Modal>
  );
}
