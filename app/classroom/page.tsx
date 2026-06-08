"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { classInviteLink, joinClassByCode } from "@/lib/classroom";
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

/** Turn a Supabase/route error into an actionable message. */
function friendlyClassError(error: {
  message?: string;
  error?: string;
  code?: string;
}): string {
  const msg = error.message ?? error.error ?? "";
  const code = error.code;

  // Table/policies not applied in the live database (schema drift).
  if (/permission denied for (table|relation|schema)/i.test(msg)) {
    return "Your Supabase database is missing INSERT permission on the classrooms table. Re-run the schema GRANTs (see README/schema.sql).";
  }
  if (code === "42P01" || /does not exist/i.test(msg)) {
    return "The classrooms table doesn't exist in your database yet — run schema.sql in Supabase.";
  }
  if (/row-level security/i.test(msg)) {
    return "Blocked by row-level security on classrooms. Re-run the classroom policies from schema.sql in Supabase.";
  }
  if (code === "PGRST301" || /jwt|not authenticated/i.test(msg)) {
    return "Your session wasn't recognized — please log in again.";
  }
  // Fall back to the raw reason so nothing is hidden.
  return msg ? `Couldn't create class: ${msg}` : "Couldn't create a class code. Please try again.";
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
    if (!user) return;
    setBusy(true);
    setMsg(null);

    // Create server-side: the route authenticates from the cookie session, so
    // the RLS teacher check passes even when the browser client fails to attach
    // the auth token.
    try {
      const res = await fetch("/api/classroom/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const payload = await res.json();
      setBusy(false);

      if (res.ok && payload.class) {
        setJustCreated((payload.class as TeacherClass).join_code);
        setName("");
        loadClasses();
      } else {
        // eslint-disable-next-line no-console
        console.error("[classroom] create failed:", payload);
        setMsg(friendlyClassError(payload));
      }
    } catch {
      setBusy(false);
      setMsg("Couldn't reach the server. Please try again.");
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
              <TeacherClassRow key={c.id} cls={c} onRenamed={loadClasses} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ---------------- One class row: rename, copy code, share link ---------- */
function TeacherClassRow({
  cls,
  onRenamed,
}: {
  cls: TeacherClass;
  onRenamed: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cls.name ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(null), 1800);
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === (cls.name ?? "")) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/classroom/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: cls.id, name: trimmed }),
      });
      const payload = await res.json();
      setBusy(false);
      if (res.ok) {
        setEditing(false);
        onRenamed();
      } else {
        setErr(friendlyClassError(payload));
      }
    } catch {
      setBusy(false);
      setErr("Couldn't reach the server. Please try again.");
    }
  };

  return (
    <li className="glass rounded-xl px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                autoFocus
                className="flex-1 rounded-lg border border-white/12 bg-night/60 px-2.5 py-1.5 text-sm outline-none focus:border-leaf/50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") {
                    setName(cls.name ?? "");
                    setEditing(false);
                  }
                }}
              />
              <Button size="sm" onClick={saveName} disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setName(cls.name ?? "");
                  setEditing(false);
                  setErr(null);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-fog">
                {cls.name || "Untitled Class"}
              </p>
              <span className="rounded-full bg-white/8 px-2 py-0.5 font-mono text-[11px] tracking-widest text-cyan">
                {cls.join_code}
              </span>
            </div>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Rename
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard?.writeText(cls.join_code);
                flash("Code copied");
              }}
            >
              Copy code
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(classInviteLink(cls.join_code));
                flash("Invite link copied");
              }}
            >
              🔗 Share link
            </Button>
          </div>
        )}
      </div>
      {note && <p className="mt-1 text-[11px] text-leaf">{note}</p>}
      {err && <p className="mt-1 text-[11px] text-amber">{err}</p>}
    </li>
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

  // Joining links your game to the class scoreboard, so it needs an active
  // game. If none is loaded, explain that instead of hiding the section.
  if (!game) {
    return (
      <Card className="mt-6">
        <h2 className="font-display text-xl font-semibold text-cyan">Join a class with your game</h2>
        <p className="mt-1 text-sm text-mist">
          To put your city on a class scoreboard, you first need a game going.
          Start or continue one, then come back here with your teacher&apos;s code.
        </p>
        <Link
          href="/play"
          className="mt-3 inline-block rounded-full bg-leaf px-5 py-2 text-sm font-semibold text-night transition-transform hover:scale-105"
        >
          Start or continue a game →
        </Link>
      </Card>
    );
  }

  const join = async () => {
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

    const result = await joinClassByCode(code, saveId, game.cityName, game.createdAt);
    setBusy(false);
    setMsg(result.message);
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
  const [className, setClassName] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [found, setFound] = useState<boolean | null>(null); // null = not checked yet
  const [msg, setMsg] = useState<string | null>(null);

  const view = () => {
    // reset any previous (possibly valid) result before checking the new code
    setRows([]);
    setFound(null);
    setMsg(null);
    setClassName(null);
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
          .select("id, name")
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
        if (active) setClassName((cls.name as string | null) ?? null);
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
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-cyan">
              {className || "Class"}
            </h3>
            <span className="rounded-full bg-white/8 px-2 py-0.5 font-mono text-[11px] tracking-widest text-mist">
              {joined}
            </span>
          </div>
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
