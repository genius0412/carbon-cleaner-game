"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  fetchClassScoreboard,
  normalizeClassCode,
  type ScoreboardRow,
} from "@/lib/classroom";

/**
 * Look up a class by code and show its live scoreboard, polling every 10s.
 * Self-contained (no outer card/title) so it can be dropped into the classroom
 * page or a modal in the game. Finishers rank first by finish time, then
 * everyone still playing ranks by lowest carbon gain per month.
 *
 * With `fixed`, the code is locked to `initialCode` and the lookup runs
 * immediately with no input field, used in-game where the scoreboard is tied
 * to a specific class the player already belongs to. Pass `myId` (the player's
 * game save id) to highlight which row is theirs.
 */
export function Scoreboard({
  initialCode = "",
  fixed = false,
  myId = null,
}: {
  initialCode?: string;
  fixed?: boolean;
  myId?: string | null;
}) {
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [joined, setJoined] = useState<string | null>(
    fixed ? initialCode.trim().toUpperCase() || null : null,
  );
  const [className, setClassName] = useState<string | null>(null);
  const [rows, setRows] = useState<ScoreboardRow[]>([]);
  const [found, setFound] = useState<boolean | null>(null); // null = not checked yet
  const [msg, setMsg] = useState<string | null>(null);

  const view = () => {
    // reset any previous (possibly valid) result before checking the new code
    setRows([]);
    setFound(null);
    setMsg(null);
    setClassName(null);
    setJoined(normalizeClassCode(code));
  };

  useEffect(() => {
    if (!joined) return;
    let active = true;
    const fetchRows = async () => {
      const board = await fetchClassScoreboard(joined);
      if (!active) return;
      if (!board) {
        setFound(false);
        setRows([]);
        setMsg("No classroom found with that code.");
        return;
      }
      setClassName(board.className);
      setFound(true);
      setRows(board.rows);
      setMsg(null);
    };
    fetchRows();
    const t = setInterval(fetchRows, 10000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [joined]);

  const myRank = rows.findIndex((r) => myId && r.game_save_id === myId);

  return (
    <div>
      {!fixed && (
        <div className="flex flex-wrap gap-2">
          <input
            className="flex-1 rounded-lg border border-white/12 bg-night/60 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-leaf/50"
            placeholder="Class code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && code && view()}
          />
          <Button onClick={view} disabled={!code}>
            View
          </Button>
        </div>
      )}

      {msg && <p className="mt-4 text-sm text-amber">{msg}</p>}

      {/* only render the class block once the code is confirmed valid */}
      {joined && found === true && (
        <div className={fixed ? "" : "mt-5"}>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-cyan">
              {className || "Class"}
            </h3>
            <span className="rounded-full bg-white/8 px-2 py-0.5 font-mono text-[11px] tracking-widest text-mist">
              {joined}
            </span>
          </div>
          {myRank >= 0 && (
            <p className="mt-1 text-sm text-leaf">
              You&apos;re <strong>#{myRank + 1}</strong> of {rows.length}.
            </p>
          )}
          <div className="mt-3 space-y-2">
            {rows.length === 0 && (
              <p className="text-sm text-mist">Waiting for players to join…</p>
            )}
            {rows.map((r, i) => {
              const mine = !!myId && r.game_save_id === myId;
              return (
                <div
                  key={r.game_save_id ?? i}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                    mine
                      ? "border border-leaf/60 bg-leaf/10 shadow-[0_0_0_1px_rgba(61,220,132,0.25)]"
                      : "glass"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-display text-lg font-semibold ${
                        mine ? "text-leaf" : "text-mist"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-fog">{r.city_name}</span>
                        {mine && (
                          <span className="rounded-full bg-leaf/20 px-2 py-0.5 text-[10px] font-semibold text-leaf">
                            You
                          </span>
                        )}
                        {r.status === "won" ? (
                          <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] text-leaf">
                            ✓ net-zero
                          </span>
                        ) : r.finished_at ? (
                          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-mist">
                            game over
                          </span>
                        ) : null}
                      </div>
                      {r.player_name && (
                        <span className="text-xs text-mist">{r.player_name}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-cyan">{r.carbon_gain.toFixed(4)} ppm/mo</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
