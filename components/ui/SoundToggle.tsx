"use client";

import { useEffect, useState } from "react";
import { isMuted, toggleMuted, subscribeMuted } from "@/lib/sound";

/** Small mute/unmute toggle for game audio. */
export function SoundToggle() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
    return subscribeMuted(setMutedState);
  }, []);

  return (
    <button
      onClick={toggleMuted}
      title={muted ? "Unmute sound" : "Mute sound"}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      className="glass flex h-9 w-9 items-center justify-center rounded-xl text-base transition-colors hover:bg-white/10"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
