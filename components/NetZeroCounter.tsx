"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Live global counter: "X players have reached net-zero". Reads from the
 * global_stats view/table in Supabase; polls every 20s (simpler & robust
 * than realtime). Falls back to a local demo number when offline.
 */
export function NetZeroCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setCount(0);
      return;
    }
    let active = true;
    const fetchCount = async () => {
      try {
        const { count: c } = await sb
          .from("game_saves")
          .select("id", { count: "exact", head: true })
          .not("finished_at", "is", null);
        if (active && typeof c === "number") setCount(c);
      } catch {
        if (active) setCount(0);
      }
    };
    fetchCount();
    const t = setInterval(fetchCount, 20000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

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
        players have reached net-zero
      </span>
    </div>
  );
}
