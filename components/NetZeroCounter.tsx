"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { listLocalSaves } from "@/lib/saves";

/**
 * Live global counter: "X players have reached net-zero". This is a UNIVERSAL
 * number — it reflects the public.global_stats view (the same for everyone),
 * never the viewer's own games. A slow/stalled Supabase call keeps the last
 * known cloud value rather than personalizing it. The local count is only used
 * as a last resort when there's no backend configured at all (dev/offline),
 * where no shared value exists. Re-checks on focus + every 20s.
 */
export function NetZeroCounter() {
  const [count, setCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    const sb = getSupabaseBrowser();

    // No backend at all (dev/offline) → no shared value exists; fall back to the
    // player's own local wins just so the widget isn't stuck on "…".
    if (!sb) {
      setCount(localNetZeroCount());
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

    // Universal value only: show the cloud total when available; otherwise keep
    // the last known cloud value. Never mix in the viewer's own win count.
    setCount((prev) => cloud ?? prev);
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
