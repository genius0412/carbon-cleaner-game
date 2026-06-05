"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGameStore } from "@/lib/store";

interface Row {
  city_name: string;
  carbon_gain: number;
  finished_at: string | null;
}

interface TeacherClass {
  id: string;
  join_code: string;
  name: string | null;
  member_count?: number;
}

/** Short, readable class code (no ambiguous characters). */
function makeClassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function ClassroomPage() {
  const { user } = useAuth();

  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <section className="z-10 mx-auto w-full max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">Classroom</h1>
        <p className="mt-3 text-mist">
          Teachers create a class code; students join with their game; everyone
          watches a live scoreboard. Finishers rank first by finish time, then
          everyone still playing ranks by lowest carbon gain per month.
        </p>

        <TeacherSection user={user} />
        <JoinWithGameSection />
        <ScoreboardSection />
      </section>
      <SiteFooter />
    </main>
  );
}

/* ---------------- Teachers: create & manage class codes ---------------- */
function TeacherSection({ user }: { user: { id: string; username: string | null } | null }) {
  const [name, setName] = useState("");
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (!sb || !user) return;
    const { data } = await sb
      .from("classrooms")
      .select("id, join_code, name")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });
    setClasses((data as TeacherClass[]) ?? []);
  }, [user]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const createClass = async () => {
    const sb = getSupabaseBrowser();
    if (!sb || !user) return;
    setBusy(true);
    setMsg(null);

    // generate a code, retrying on the rare collision (join_code is unique)
    let created: TeacherClass | null = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const code = makeClassCode();
      const { data, error } = await sb
        .from("classrooms")
        .insert({ join_code: code, name: name.trim() || "Untitled Class", teacher_id: user.id })
        .select("id, join_code, name")
        .single();
      if (!error && data) {
        created = data as TeacherClass;
      } else if (error && !/duplicate|unique/i.test(error.message)) {
        setMsg(error.message);
        break;
      }
    }
    setBusy(false);
    if (created) {
      setJustCreated(created.join_code);
      setName("");
      loadClasses();
    } else if (!msg) {
      setMsg("Couldn't create a class code. Please try again.");
    }
  };

  if (!user) {
    return (
      <Card className="mt-8">
        <h2 className="font-display text-xl font-semibold text-leaf">For teachers</h2>
        <p className="mt-2 text-sm text-mist">
          <Link href="/login" className="text-leaf hover:underline">Log in</Link> or{" "}
          <Link href="/signup" className="text-leaf hover:underline">create an account</Link>{" "}
          to make a class code your students can join.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <h2 className="font-display text-xl font-semibold text-leaf">For teachers</h2>
      <p className="mt-1 text-sm text-mist">
        Create a code and share it with your students. Signed in as{" "}
        <strong className="text-fog">{user.username ?? "teacher"}</strong>.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="flex-1 rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
          placeholder="Class name (e.g. Period 3 — World History)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createClass()}
        />
        <Button onClick={createClass} disabled={busy}>
          {busy ? "Creating…" : "Create class code"}
        </Button>
      </div>

      {justCreated && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-mist">New class code</p>
            <p className="font-display text-2xl font-bold tracking-widest text-leaf">
              {justCreated}
            </p>
          </div>
          <Button size="sm" variant="amber" onClick={() => navigator.clipboard?.writeText(justCreated)}>
            Copy
          </Button>
        </div>
      )}

      {msg && <p className="mt-3 text-sm text-amber">{msg}</p>}

      {classes.length > 0 && (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-widest text-mist">Your classes</p>
          <ul className="mt-2 space-y-2">
            {classes.map((c) => (
              <li key={c.id} className="glass flex items-center justify-between rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-fog">{c.name}</p>
                  <p className="font-mono text-xs tracking-widest text-cyan">{c.join_code}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(c.join_code)}>
                  Copy code
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ---------------- Players: add current game to a class ---------------- */
function JoinWithGameSection() {
  const game = useGameStore((s) => s.game);
  const meta = useGameStore((s) => s.meta);
  const save = useGameStore((s) => s.save);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!game) return null; // only relevant if a game is in progress

  const join = async () => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMsg("Joining a class requires Supabase to be configured.");
      return;
    }
    setBusy(true);
    setMsg(null);

    // make sure the game is saved to the cloud so it has an id to link
    await save();
    const saveId = useGameStore.getState().meta.id;
    if (!saveId) {
      setBusy(false);
      setMsg("Couldn't save your game to the cloud. Try again in a moment.");
      return;
    }

    const { data: cls } = await sb
      .from("classrooms")
      .select("id")
      .eq("join_code", code.trim().toUpperCase())
      .maybeSingle();
    if (!cls) {
      setBusy(false);
      setMsg("No class found with that code.");
      return;
    }

    const { error } = await sb
      .from("classroom_members")
      .upsert(
        { classroom_id: cls.id, game_save_id: saveId, city_name: game.cityName },
        { onConflict: "classroom_id,game_save_id" },
      );
    setBusy(false);
    setMsg(error ? error.message : `Joined! ${game.cityName} is now on the scoreboard.`);
  };

  return (
    <Card className="mt-6">
      <h2 className="font-display text-xl font-semibold text-cyan">Add your game to a class</h2>
      <p className="mt-1 text-sm text-mist">
        Playing as <strong className="text-fog">{game.cityName}</strong>? Enter your
        teacher's code to put it on the class scoreboard.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="flex-1 rounded-lg border border-white/12 bg-night/60 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-leaf/50"
          placeholder="Class code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button variant="secondary" onClick={join} disabled={busy || !code}>
          {busy ? "Joining…" : "Join class"}
        </Button>
      </div>
      {msg && <p className="mt-3 text-sm text-amber">{msg}</p>}
    </Card>
  );
}

/* ---------------- Everyone: live scoreboard by code ---------------- */
function ScoreboardSection() {
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [found, setFound] = useState<boolean | null>(null); // null = not checked yet
  const [msg, setMsg] = useState<string | null>(null);

  const view = () => {
    // reset any previous (possibly valid) result before checking the new code
    setRows([]);
    setFound(null);
    setMsg(null);
    setJoined(code.trim().toUpperCase());
  };

  useEffect(() => {
    if (!joined) return;
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMsg("Supabase isn't configured — the live scoreboard needs it.");
      setFound(false);
      return;
    }
    let active = true;
    const fetchRows = async () => {
      try {
        const { data: cls } = await sb
          .from("classrooms")
          .select("id")
          .eq("join_code", joined)
          .maybeSingle();
        if (!cls) {
          if (active) {
            setFound(false);
            setRows([]);
            setMsg("No classroom found with that code.");
          }
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
          setFound(true);
          setRows(rankRows(mapped));
          setMsg(null);
        }
      } catch {
        if (active) {
          setFound(false);
          setMsg("Could not load the scoreboard.");
        }
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
    <Card className="mt-6">
      <h2 className="font-display text-xl font-semibold text-leaf">Live scoreboard</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="flex-1 rounded-lg border border-white/12 bg-night/60 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-leaf/50"
          placeholder="Class code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button onClick={view} disabled={!code}>
          View
        </Button>
      </div>

      {msg && <p className="mt-4 text-sm text-amber">{msg}</p>}

      {/* only render the class block once the code is confirmed valid */}
      {joined && found === true && (
        <div className="mt-5">
          <h3 className="font-display text-sm font-semibold text-cyan">Class {joined}</h3>
          <div className="mt-3 space-y-2">
            {rows.length === 0 && (
              <p className="text-sm text-mist">Waiting for players to join…</p>
            )}
            {rows.map((r, i) => (
              <div key={i} className="glass flex items-center justify-between rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-semibold text-mist">#{i + 1}</span>
                  <span className="font-semibold text-fog">{r.city_name}</span>
                  {r.finished_at && (
                    <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] text-leaf">
                      ✓ net-zero
                    </span>
                  )}
                </div>
                <span className="text-sm text-cyan">{r.carbon_gain.toFixed(4)} ppm/mo</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
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
