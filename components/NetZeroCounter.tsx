"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { listLocalSaves } from "@/lib/saves";

/**
 * Live global counter: "X players have reached net-zero". Reads the
 * public.global_stats view, but never blocks on it: a slow/stalled Supabase
 * call falls back (after a short timeout) to the player's own net-zero count
 * from localStorage, so the number always shows and reflects your own win even
 * when the cloud read lags. Re-checks on focus + every 20s.
 */
export function NetZeroCounter() {
  const [count, setCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    const local = localNetZeroCount();
    const sb = getSupabaseBrowser();

    if (!sb) {
      setCount(local);
      return;
    }

    const cloud = await Promise.race([
      (async (): Promise<number | null> => {
        try {
          const { data } = await sb
            .from("global_stats")
            .select("total_finished")
            .maybeSingle();
          const c = (data as { total_finished?: number } | null)?.total_finished;
          return typeof c === "number" ? c : null;
        } catch {
          return null;
        }
      })(),
      // Never let a stalled query keep us on "…".
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);

    // Show the cloud total when available; otherwise keep the best we have, but
    // never less than the player's own verified local wins.
    setCount((prev) => Math.max(cloud ?? prev ?? 0, local));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    const refresh = () => load();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  return (
    <div className="glass inline-flex items-center gap-3 rounded-full px-5 py-2.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-leaf" />
      </span>
      <span className="text-sm text-fog">
        <span className="font-display font-semibold text-leaf">
          {count === null ? "…" : count.toLocaleString()}
        </span>{" "}
        {count === 1 ? "player has" : "players have"} reached net-zero
      </span>
    </div>
  );
}

/** Count the player's own net-zero (won) games saved locally. */
function localNetZeroCount(): number {
  try {
    return listLocalSaves().filter((e) => e.state?.status === "won").length;
  } catch {
    return 0;
  }
}
