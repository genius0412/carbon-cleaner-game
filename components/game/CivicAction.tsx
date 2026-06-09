"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataChip } from "@/components/ui/DataChip";
import { useToast } from "@/components/ui/Toast";
import { useGameStore } from "@/lib/store";
import { useAutoPause } from "./useAutoPause";
import {
  lookupReps,
  SENTENCE_BLOCKS,
  pickFacts,
  type SentenceBlock,
  type Representative,
} from "@/lib/civic/letterContent";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function CivicAction({ open, onClose }: { open: boolean; onClose: () => void }) {
  useAutoPause(open);
  const game = useGameStore((s) => s.game);
  const setCivic = useGameStore((s) => s.setCivic);
  const doCivicBoost = useGameStore((s) => s.doCivicBoost);
  const meta = useGameStore((s) => s.meta);
  const toast = useToast();

  const [town, setTown] = useState(game?.civic?.representativeTown ?? "");
  const [reps, setReps] = useState<Representative[]>([]);
  const [checking, setChecking] = useState(false);

  const younger = game?.characterType === "student_younger";

  if (!game) return null;

  const handleLookup = () => {
    setReps(lookupReps(town));
    setCivic({ representativeTown: town });
  };

  return (
    <Modal open={open} onClose={onClose} title="Civic Action, Contact a Representative" wide>
      <p className="-mt-2 mb-4 text-sm text-mist">
        This is the heart of Carbon Cleaner: turn what you've learned into real
        action. Look up your representative, write a letter, then (optionally)
        send it and upload proof for a major progress boost.
      </p>

      {/* 1. Representative lookup */}
      <Card className="mb-4">
        <h3 className="font-display text-sm font-semibold text-cyan">1 · Find your representative</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={town}
            onChange={(e) => setTown(e.target.value)}
            placeholder="Type your town or city"
            className="flex-1 rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm text-fog outline-none focus:border-leaf/50"
          />
          <Button size="sm" onClick={handleLookup}>Look up</Button>
        </div>
        <p className="mt-2 text-[11px] text-mist">
          Contact details are a cited/editable dataset: <DataChip id={60} />
        </p>
        {reps.length > 0 && (
          <ul className="mt-3 space-y-2">
            {reps.map((r, i) => (
              <li key={i} className="glass rounded-lg p-3 text-sm">
                <p className="font-semibold text-fog">{r.office}</p>
                <p className="text-mist">{r.name} · {r.email}</p>
                <p className="mt-1 text-xs text-cyan">Address them: {r.address}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 2. Letter builder */}
      {younger ? (
        <YoungerLetterBuilder onLetter={(l) => setCivic({ letter: l })} />
      ) : (
        <OlderLetterComposer
          seed={game.cityName + (meta.guestCode ?? "")}
          initial={game.civic?.letter ?? ""}
          onLetter={(l) => setCivic({ letter: l })}
        />
      )}

      {/* 3. Proof upload + lenient check */}
      <Card className="mt-4">
        <h3 className="font-display text-sm font-semibold text-cyan">3 · Take real action (optional)</h3>
        <p className="mt-2 text-sm text-mist">
          Send your letter to your representative and upload a
          screenshot of the email you sent to earn a big boost. <span className="text-danger">Your screenshot
          will appear in your final report.</span>
        </p>
        {game.civic?.boostApplied ? (
          <div className="mt-3 rounded-xl bg-leaf/15 p-3 text-sm text-leaf">
            ✓ Civic action verified, boost applied! Stakeholders are listening.
          </div>
        ) : (
          <ProofUploader
            disabled={checking}
            letter={game.civic?.letter ?? ""}
            onChecking={setChecking}
            gameSaveId={meta.id}
            onPassed={() => {
              doCivicBoost(game.civic?.letter ?? "");
              toast("Civic action verified, boost applied!", "success");
              // auto-close once approved; small delay lets the success toast register
              setTimeout(onClose, 1200);
            }}
          />
        )}
      </Card>
    </Modal>
  );
}

/* ---------------- Younger: drag-and-drop sentence blocks ---------------- */
function YoungerLetterBuilder({ onLetter }: { onLetter: (l: string) => void }) {
  const [available, setAvailable] = useState<SentenceBlock[]>(SENTENCE_BLOCKS);
  const [chosen, setChosen] = useState<SentenceBlock[]>([]);

  const move = (block: SentenceBlock, toChosen: boolean) => {
    if (toChosen) {
      setAvailable((a) => a.filter((b) => b.id !== block.id));
      setChosen((c) => {
        const next = [...c, block];
        onLetter(next.map((b) => b.text).join(" "));
        return next;
      });
    } else {
      setChosen((c) => {
        const next = c.filter((b) => b.id !== block.id);
        onLetter(next.map((b) => b.text).join(" "));
        return next;
      });
      setAvailable((a) => [...a, block]);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const block = available.find((b) => b.id === id);
    if (block) move(block, true);
  };

  return (
    <Card className="mb-4">
      <h3 className="font-display text-sm font-semibold text-cyan">2 · Build your letter</h3>
      <p className="mt-1 text-xs text-mist">
        Drag sentences into your letter, or tap them. Reorder by removing and
        re-adding.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wide text-mist">Sentence blocks</p>
          <div className="flex flex-col gap-2">
            {available.map((b) => (
              <button
                key={b.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
                onClick={() => move(b, true)}
                className="glass rounded-lg p-2 text-left text-xs text-fog hover:border-leaf/40"
              >
                {b.text}
              </button>
            ))}
            {available.length === 0 && (
              <p className="text-xs text-mist">All blocks used.</p>
            )}
          </div>
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="rounded-lg border border-dashed border-leaf/30 bg-leaf/5 p-2"
        >
          <p className="mb-1 text-[11px] uppercase tracking-wide text-mist">Your letter (drop here)</p>
          <div className="flex flex-col gap-2">
            {chosen.length === 0 && (
              <p className="text-xs text-mist">Drag sentences here to build your letter.</p>
            )}
            {chosen.map((b) => (
              <button
                key={b.id}
                onClick={() => move(b, false)}
                className="rounded-lg bg-leaf/15 p-2 text-left text-xs text-fog hover:bg-danger/15"
                title="Click to remove"
              >
                {b.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- Older: compose from a randomized fact pool ---------------- */
function OlderLetterComposer({
  seed,
  initial,
  onLetter,
}: {
  seed: string;
  initial: string;
  onLetter: (l: string) => void;
}) {
  const facts = useMemo(() => pickFacts(seed, 3), [seed]);
  const [text, setText] = useState(initial);

  return (
    <Card className="mb-4">
      <h3 className="font-display text-sm font-semibold text-cyan">2 · Write your letter</h3>
      <p className="mt-1 text-xs text-mist">
        Use these data points (your unique set) to make a persuasive case. Real
        figures are cited via <DataChip id={61} />.
      </p>
      <ul className="mt-3 space-y-1.5">
        {facts.map((f) => (
          <li key={f.id} className="glass rounded-lg p-2 text-xs text-fog">
            {f.text.split("{{blank}}").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <DataChip id={61} />}
              </span>
            ))}
          </li>
        ))}
      </ul>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onLetter(e.target.value);
        }}
        rows={8}
        placeholder="Dear Representative, ..."
        className="mt-3 w-full rounded-lg border border-white/12 bg-night/60 p-3 text-sm text-fog outline-none focus:border-leaf/50"
      />
      <p className="mt-1 text-right text-[11px] text-mist">{text.length} characters</p>
    </Card>
  );
}

/* ---------------- Proof uploader + lenient check ---------------- */
function ProofUploader({
  letter,
  disabled,
  gameSaveId,
  onChecking,
  onPassed,
}: {
  letter: string;
  disabled: boolean;
  gameSaveId?: string;
  onChecking: (b: boolean) => void;
  onPassed: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  // Inline error shown below the submit area (instead of a top-right toast).
  const [error, setError] = useState<string | null>(null);
  // Dev-only: which checker the server actually used (gemini | vision | keyword | accepted | error).
  const [debug, setDebug] = useState<{ method?: string; passed?: boolean; reason?: string } | null>(null);
  const setCivic = useGameStore((s) => s.setCivic);

  const submit = async () => {
    if (!file) {
      setError("Choose a screenshot first.");
      return;
    }
    setError(null);
    onChecking(true);
    try {
      // read as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // optional: upload to Supabase Storage
      const sb = getSupabaseBrowser();
      let imagePath: string | null = null;
      if (sb) {
        try {
          const path = `proof/${gameSaveId ?? "guest"}-${Date.now()}-${file.name}`;
          const { error } = await sb.storage.from("civic-proof").upload(path, file, {
            upsert: true,
          });
          if (!error) imagePath = path;
        } catch {
          /* storage optional */
        }
      }

      const res = await fetch("/api/civic-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type || "image/png",
          letter,
        }),
      });
      const data = await res.json();
      setDebug({ method: data.method, passed: data.passed, reason: data.reason });

      // record upload result (best-effort) in Supabase
      if (sb && imagePath) {
        try {
          await sb.from("civic_uploads").insert({
            game_save_id: gameSaveId ?? null,
            image_path: imagePath,
            passed_check: !!data.passed,
          });
        } catch {
          /* ignore */
        }
      }

      setCivic({ proofUploaded: true, proofPassedCheck: !!data.passed });
      if (data.passed) onPassed();
      else setError(data.reason || "The check didn't pass. Try a clearer screenshot.");
    } catch {
      setError("Something went wrong checking your upload.");
    } finally {
      onChecking(false);
    }
  };

  const isDev = process.env.NODE_ENV !== "production";
  // gemini/vision = the image was actually read; keyword/accepted = it was NOT.
  const sawImage = debug?.method === "gemini" || debug?.method === "vision";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
          className="text-xs text-mist file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-leaf/20 file:px-3 file:py-1.5 file:text-leaf"
        />
        <Button size="sm" onClick={submit} disabled={disabled || !file}>
          {disabled ? "Checking…" : "Submit proof"}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {isDev && debug?.method && (
        <div
          className={`inline-flex flex-wrap items-center gap-2 rounded-md border px-2 py-1 font-mono text-[11px] ${
            sawImage
              ? "border-leaf/40 bg-leaf/10 text-leaf"
              : "border-amber/40 bg-amber/10 text-amber"
          }`}
          title={
            sawImage
              ? "A vision model actually read the image."
              : "The image was NOT read, server fell back to a text/keyword check."
          }
        >
          <span className="font-semibold">dev · checker: {debug.method}</span>
          <span className="opacity-70">{sawImage ? "read image ✓" : "did not read image ✗"}</span>
          {typeof debug.passed === "boolean" && <span>· {debug.passed ? "PASS" : "FAIL"}</span>}
          {debug.reason && <span className="opacity-70">· {debug.reason}</span>}
        </div>
      )}
    </div>
  );
}
