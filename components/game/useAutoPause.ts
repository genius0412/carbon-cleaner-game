"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store";

/**
 * While mounted, registers an open panel so the game clock auto-pauses.
 * Auto-resumes when the panel unmounts.
 */
export function useAutoPause(active: boolean) {
  const openPanel = useGameStore((s) => s.openPanel);
  const closePanel = useGameStore((s) => s.closePanel);
  useEffect(() => {
    if (!active) return;
    openPanel();
    return () => closePanel();
  }, [active, openPanel, closePanel]);
}
