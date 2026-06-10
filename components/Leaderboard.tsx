"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { listLocalSaves } from "@/lib/saves";
import { MONTH_NAMES } from "@/lib/config/gameConstants";
import { roleLabel } from "@/lib/roles";
import type { CharacterType, GameState } from "@/lib/engine/types";

/**
 * The displayed in-game date, with the one-time 2026 baseline shift applied to
 * any save that predates it. Mirrors the +1-year migration in the store/saves
 * layer so finished leaderboard rows (which may never be re-saved) don't show a
 * stale year like "January 2025" when the game starts in 2026.
 */
function shiftedReached(rawYear: number, month: number, migrated: boolean): { reached: string; sortKey: number } {
  const year = migrated ? rawYear : rawYear + 1;
  const reached = month >= 1 && month <= 12 ? `${MONTH_NAMES[month - 1]} ${year}` : "";
  return { reached, sortKey: year * 12 + month };
}

/**
 * Public "Hall of net-zero": the players who reached net-zero, ranked by how
 * soon (in-game) they got there. Shows up to the top 10; if fewer people have
 * finished, it simply shows everyone. Falls back to the viewer's own local wins
 * when there's no backend configured (dev/offline).
 */
interface Row {
  name: string;
  county: string;
  role: CharacterType;
  reached: string; // e.g. "March 2031"
  sortKey: number; // year * 12 + month (lower = reached sooner)
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const sb = getSupabaseBrowser();
      if (!sb) {
        if (active) setRows(localRows());
        return;
      }
      try {
        const { data } = await sb
          .from("game_saves")
          .select(
            "city_name, character_type, year_month, status:state->>status, player:state->>playerName, gyear:state->>year, gmonth:state->>month, migrated:state->>yearMigrated",
          )
          .not("finished_at", "is", null)
          .limit(500);

        const winners = (data ?? [])
          .filter((r: Record<string, unknown>) => r.status === "won")
          .map((r: Record<string, unknown>) => {
            const rawYear = Number(r.gyear) || 0;
            const month = Number(r.gmonth) || 0;
            const migrated = r.migrated === "true" || r.migrated === true;
            const { reached, sortKey } = shiftedReached(rawYear, month, migrated);
            return {
              name: (r.player as string)?.trim() || "Anonymous",
              county: (r.city_name as string) || "Unknown county",
              role: r.character_type as CharacterType,
              // Prefer the recomputed (shifted) date; fall back to the stored
              // string only if we couldn't derive year/month from the save.
              reached: reached || (r.year_month as string) || "",
              sortKey,
            };
          })
          .sort((a, b) => a.sortKey - b.sortKey)
          .slice(0, 10);

        if (active) setRows(winners);
      } catch {
        if (active) setRows(localRows());
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="z-10 mx-auto w-full max-w-3xl px-6 pb-16">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold sm:text-3xl">
        🏆 Hall of net-zero
      </h2>
      <p className="mx-auto mb-8 max-w-xl text-center text-sm text-mist">
        The change-makers who reached net-zero, ranked by how soon they got there.
      </p>

      {rows === null ? (
        <p className="text-center text-sm text-mist">Loading the leaderboard…</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm text-mist">
          No one has reached net-zero yet. Be the first to make the board!
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-leaf/15">
          {/* header (hidden on the smallest screens) */}
          <div className="hidden grid-cols-[2.5rem_1fr_1fr_8rem_7rem] gap-3 bg-white/5 px-4 py-2.5 text-[11px] uppercase tracking-wide text-mist sm:grid">
            <span>#</span>
            <span>Player</span>
            <span>County</span>
            <span>Role</span>
            <span className="text-right">Net-zero</span>
          </div>
          <ul>
            {rows.map((r, i) => (
              <li
                key={i}
                className="grid grid-cols-1 gap-1 border-t border-white/5 px-4 py-3 text-sm first:border-t-0 sm:grid-cols-[2.5rem_1fr_1fr_8rem_7rem] sm:items-center sm:gap-3"
              >
                <span className="font-display font-semibold text-leaf">
                  {MEDALS[i] ?? `#${i + 1}`}
                </span>
                <span className="font-semibold text-fog">{r.name}</span>
                <span className="text-mist">{r.county}</span>
                <span className="text-cyan">{roleLabel(r.role)}</span>
                <span className="text-fog/90 sm:text-right">{r.reached}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Dev/offline fallback: the viewer's own local net-zero wins. */
function localRows(): Row[] {
  try {
    return listLocalSaves()
      .filter((e) => e.state?.status === "won")
      .map((e) => {
        const s = e.state as GameState;
        const { reached, sortKey } = shiftedReached(s.year, s.month, Boolean(s.yearMigrated));
        return {
          name: s.playerName?.trim() || "You",
          county: s.cityName || "Unknown county",
          role: s.characterType,
          reached,
          sortKey,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(0, 10);
  } catch {
    return [];
  }
}
