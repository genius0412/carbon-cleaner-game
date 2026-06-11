"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { listLocalSaves } from "@/lib/saves";

type Stats = {
  finished: number | null;
  players: number | null;
  games: number | null;
};

const EMPTY: Stats = { finished: null, players: null, games: null };

/**
 * Live global counters for the Home page: net-zero wins, players signed up, and
 * games started. These are UNIVERSAL numbers, they reflect the
 * public.global_stats view (the same for everyone), never the viewer's own
 * games. A slow/stalled Supabase call keeps the last known cloud values rather
 * than personalizing them. The local counts are only used as a last resort when
 * there's no backend configured at all (dev/offline), where no shared value
 * exists. Re-checks on focus + every 20s.
 */
export function NetZeroCounter() {
  const [stats, setStats] = useState<Stats>(EMPTY);

  const load = useCallback(async () => {
    const sb = getSupabaseBrowser();

    // No backend at all (dev/offline) → no shared value exists; fall back to the
    // player's own local games just so the widget isn't stuck on "…".
    if (!sb) {
      setStats(localStats());
      return;
    }

    const cloud = await Promise.race([
      (async (): Promise<Stats | null> => {
        try {
          const { data } = await sb
            .from("global_stats")
            .select("total_finished, total_players, total_games")
            .maybeSingle();
          const row = data as {
            total_finished?: number;
            total_players?: number;
            total_games?: number;
          } | null;
          if (!row) return null;
          const num = (v: unknown) => (typeof v === "number" ? v : null);
          return {
            finished: num(row.total_finished),
            players: num(row.total_players),
            games: num(row.total_games),
          };
        } catch {
          return null;
        }
      })(),
      // Never let a stalled query keep us on "…".
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);

    // Universal values only: show the cloud row when available; otherwise keep
    // the last known cloud values. Never mix in the viewer's own counts.
    setStats((prev) => cloud ?? prev);
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
    <div className="flex flex-wrap items-center justify-center gap-3">
      <StatPill
        live
        accent="text-leaf"
        value={stats.finished}
        label={(n) =>
          `${n === 1 ? "county has" : "counties have"} reached net-zero`
        }
      />
      <StatPill
        accent="text-cyan"
        value={stats.players}
        label={(n) => `${n === 1 ? "player" : "players"} signed up`}
      />
      <StatPill
        accent="text-fog"
        value={stats.games}
        label={(n) => `${n === 1 ? "game" : "games"} created`}
      />
    </div>
  );
}

function StatPill({
  value,
  label,
  accent,
  live = false,
}: {
  value: number | null;
  label: (n: number) => string;
  accent: string;
  live?: boolean;
}) {
  return (
    <div className="glass inline-flex items-center gap-3 rounded-full px-5 py-2.5">
      {live && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-leaf" />
        </span>
      )}
      <span className="text-sm text-fog">
        <ScrambleNumber
          value={value}
          className={`font-display font-semibold tabular-nums ${accent}`}
        />{" "}
        {label(value ?? 0)}
      </span>
    </div>
  );
}

// The scramble is intentionally padded so it always runs a touch longer than
// the real fetch: it holds for at least MIN_MS, and even on a slow load keeps
// flickering BUFFER_MS past the moment the value lands, so the reveal always
// reads as a deliberate "lock in" rather than a flash.
const MIN_MS = 1200;
const BUFFER_MS = 450;

/**
 * Shows the real number once it loads, but never before the scramble has had
 * its full run. While it's still null (loading) it flickers random digits so
 * the slot reads as "counting up" rather than a dead "…". Honors
 * prefers-reduced-motion by holding a steady placeholder instead.
 */
function ScrambleNumber({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  const [display, setDisplay] = useState("000");
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (startRef.current === null) startRef.current = Date.now();

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value === null ? "000" : value.toLocaleString());
      return;
    }

    const scramble = () =>
      setDisplay(String(Math.floor(Math.random() * 900) + 100));
    scramble();
    const interval = setInterval(scramble, 70);

    let reveal: ReturnType<typeof setTimeout> | undefined;
    if (value !== null) {
      // Reveal after whichever is later: finishing the minimum run, or a short
      // buffer past the moment the data arrived. Either way it outlasts loading.
      const elapsed = Date.now() - (startRef.current ?? Date.now());
      const wait = Math.max(MIN_MS - elapsed, BUFFER_MS);
      reveal = setTimeout(() => {
        clearInterval(interval);
        setDisplay(value.toLocaleString());
      }, wait);
    }

    return () => {
      clearInterval(interval);
      if (reveal) clearTimeout(reveal);
    };
  }, [value]);

  return <span className={className}>{display}</span>;
}

/** Last-resort offline counts from the player's own locally saved games. */
function localStats(): Stats {
  try {
    const saves = listLocalSaves();
    return {
      finished: saves.filter((e) => e.state?.status === "won").length,
      players: null,
      games: saves.length,
    };
  } catch {
    return EMPTY;
  }
}
