"use client";

import { useEffect, useState } from "react";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowser } from "@/lib/supabase/client";

interface Row {
  city_name: string;
  carbon_gain: number;
  finished_at: string | null;
}

/**
 * Classroom join-by-code + live scoreboard. Ranks finishers first (by finish
 * time, earliest = best) above everyone still playing (ranked by lowest carbon
 * gain/month). Polls every 10s.
 */
export default function ClassroomPage() {
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!joined) return;
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMsg("Supabase isn't configured — the live scoreboard needs it.");
      return;
    }
    let active = true;
    const fetchRows = async () => {
      try {
        // classroom -> members -> game_saves
        const { data: cls } = await sb
          .from("classrooms")
          .select("id")
          .eq("join_code", joined)
          .maybeSingle();
        if (!cls) {
          if (active) setMsg("No classroom found with that code.");
          return;
        }
        const { data } = await sb
          .from("classroom_members")
          .select("city_name, game_saves(carbon_gain, finished_at, city_name)")
          .eq("classroom_id", cls.id);
        const mapped: Row[] = (data ?? []).map((m: any) => ({
          city_name: m.city_name ?? m.game_saves?.city_name ?? "Unknown",
          carbon_gain: m.game_saves?.carbon_gain ?? 999,
          finished_at: m.game_saves?.finished_at ?? null,
        }));
        if (active) {
          setRows(rankRows(mapped));
          setMsg(null);
        }
      } catch {
        if (active) setMsg("Could not load the scoreboard.");
      }
    };
    fetchRows();
    const t = setInterval(fetchRows, 10000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [joined]);

  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <section className="z-10 mx-auto w-full max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">Classroom</h1>
        <p className="mt-3 text-mist">
          Join your class with a code to see a live scoreboard. Rankings put
          finishers first (earliest finish wins), then everyone still playing by
          lowest carbon gain per month.
        </p>

        <Card className="mt-6">
          <div className="flex flex-wrap gap-2">
            <input
              className="flex-1 rounded-lg border border-white/12 bg-night/60 px-3 py-2 font-mono text-sm outline-none focus:border-leaf/50"
              placeholder="Class code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <Button onClick={() => setJoined(code.trim())} disabled={!code}>
              Join
            </Button>
          </div>
        </Card>

        {msg && <p className="mt-4 text-sm text-amber">{msg}</p>}

        {joined && (
          <div className="mt-6">
            <h2 className="font-display text-xl font-semibold text-leaf">
              Scoreboard · {joined}
            </h2>
            <div className="mt-3 space-y-2">
              {rows.length === 0 && !msg && (
                <p className="text-sm text-mist">Waiting for players…</p>
              )}
              {rows.map((r, i) => (
                <div
                  key={i}
                  className="glass flex items-center justify-between rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-semibold text-mist">#{i + 1}</span>
                    <span className="font-semibold text-fog">{r.city_name}</span>
                    {r.finished_at && (
                      <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] text-leaf">
                        ✓ net-zero
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-cyan">
                    {r.carbon_gain.toFixed(4)} ppm/mo
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function rankRows(rows: Row[]): Row[] {
  const finishers = rows
    .filter((r) => r.finished_at)
    .sort((a, b) => (a.finished_at! < b.finished_at! ? -1 : 1));
  const playing = rows
    .filter((r) => !r.finished_at)
    .sort((a, b) => a.carbon_gain - b.carbon_gain);
  return [...finishers, ...playing];
}
