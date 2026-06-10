"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { loadLocal, getLocalSave } from "@/lib/saves";
import { useGameStore } from "@/lib/store";
import { formatYearMonth, effectiveCarbonGain } from "@/lib/engine/engine";
import type { GameState } from "@/lib/engine/types";
import { generateReportPdf } from "@/lib/report/pdf";

export default function ReportPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const [state, setState] = useState<GameState | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Prefer the live in-memory game when this report is for the game that's
      // currently loaded. Client-side navigation (the "View report" link) keeps
      // the store mounted, so this reflects the very latest state, including a
      // just-won game whose cloud save may not have flushed yet. (Re-reading the
      // persisted save here is what caused the stale "did not reach net-zero".)
      const { game: liveGame, meta: liveMeta } = useGameStore.getState();
      const isCurrent =
        !!liveGame &&
        (gameId === "local" || gameId === liveMeta.id || gameId === liveMeta.localId);
      if (isCurrent) setState(liveGame);

      // local saves: "local" = most recent, "local-xxxx" = a specific game.
      if (gameId === "local" || gameId.startsWith("local-")) {
        if (!isCurrent) {
          const local = gameId === "local" ? loadLocal() : getLocalSave(gameId);
          if (local) setState(local.state);
        }
        setLoading(false);
        return;
      }
      const sb = getSupabaseBrowser();
      if (sb) {
        try {
          // Only fall back to the persisted snapshot when we don't already have
          // the live (fresher) state for this game.
          if (!isCurrent) {
            const { data } = await sb
              .from("game_saves")
              .select("state")
              .eq("id", gameId)
              .maybeSingle();
            if (data?.state) setState(data.state as GameState);
          }
          // proof image
          const { data: up } = await sb
            .from("civic_uploads")
            .select("image_path")
            .eq("game_save_id", gameId)
            .eq("passed_check", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (up?.image_path) {
            const { data: signed } = await sb.storage
              .from("civic-proof")
              .createSignedUrl(up.image_path, 3600);
            if (signed?.signedUrl) setProofUrl(signed.signedUrl);
          }
        } catch {
          /* fall back to local */
        }
      }
      if (!isCurrent && !state) {
        const local = loadLocal();
        if (local) setState(local.state);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  if (loading) {
    return <Centered>Loading report…</Centered>;
  }
  if (!state) {
    return (
      <Centered>
        <p>No saved game found for this report.</p>
        <Link href="/play" className="mt-4 text-leaf hover:underline">← Back to play</Link>
      </Centered>
    );
  }

  const won = state.status === "won";

  return (
    <main className="min-h-screen bg-night px-6 py-10">
      {/* screen-only controls */}
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
        <Link href="/" className="text-sm text-mist hover:text-fog">← Home</Link>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => window.print()}>🖨️ Print</Button>
          <Button onClick={() => generateReportPdf(state, proofUrl)}>⬇ Download PDF</Button>
        </div>
      </div>

      {/* report body */}
      <article id="report" className="mx-auto max-w-3xl space-y-6">
        <header className="text-center">
          <p className="text-xs uppercase tracking-widest text-cyan">Carbon Cleaner · Final Report</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{state.cityName}</h1>
          <p className="mt-1 text-mist">
            {state.characterType === "mayor" ? "Mayor" : state.characterType === "student_older" ? "Student (14–18)" : "Student (9–14)"}
            {" · "}
            {won ? "Reached net-zero 🌍" : "Did not reach net-zero"}
          </p>
        </header>

        <Card>
          <h2 className="font-display text-lg font-semibold text-leaf">Final stats</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Carbon gain/mo" value={`${effectiveCarbonGain(state).toFixed(4)}`} />
            <Stat label="Carbon level" value={`${state.carbonPpm.toFixed(1)} ppm`} />
            <Stat label="Support" value={`${state.support.toFixed(0)}%`} />
            <Stat label="Reached" value={formatYearMonth(state)} />
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold text-leaf">Timeline of key actions</h2>
          {state.log.length === 0 ? (
            <p className="mt-2 text-sm text-mist">No actions recorded.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {state.log.map((l, i) => (
                <li key={i} className="text-fog/90">
                  <span className="text-cyan">{l.yearMonth}</span>, <strong>{l.label}</strong>{" "}
                  <span className="text-mist">{l.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {state.civic?.letter && (
          <Card>
            <h2 className="font-display text-lg font-semibold text-leaf">Civic-action letter</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-fog/90">{state.civic.letter}</p>
            {state.civic.boostApplied && (
              <p className="mt-2 text-xs text-leaf">✓ Verified real-world action submitted.</p>
            )}
          </Card>
        )}

        {proofUrl && (
          <Card>
            <h2 className="font-display text-lg font-semibold text-leaf">Proof of action</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofUrl} alt="Civic action proof" className="mt-3 max-h-96 rounded-lg" />
          </Card>
        )}
      </article>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-lg p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-mist">{label}</p>
      <p className="font-display font-semibold text-fog">{value}</p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-night text-fog">
      {children}
    </main>
  );
}
