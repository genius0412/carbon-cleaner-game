"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { updatePlayerNameForUser } from "@/lib/saves";

/**
 * One-time display-name prompt. Users who sign up with Google (or any provider)
 * arrive without having chosen a display name (profiles.display_name_confirmed =
 * false). This gate asks them to confirm or edit the name once; afterwards the
 * flag is set and it never shows again. Mounted globally in the root layout so
 * it covers every OAuth landing target.
 */
export function DisplayNameGate() {
  const { user, loading } = useAuth();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Set once we've saved, so the prompt closes immediately without waiting for
  // the auth hook to re-read the (now confirmed) profile.
  const [done, setDone] = useState(false);

  const needsPrompt = !loading && !!user && !user.displayNameConfirmed && !done;

  // Seed the field with the provider-supplied name (e.g. the Google name).
  useEffect(() => {
    if (needsPrompt) setValue(user!.displayName ?? user!.username ?? "");
  }, [needsPrompt, user]);

  if (!needsPrompt) return null;

  const confirm = async () => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setErr("Please enter a name (at least 2 characters).");
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      // No backend — nothing to persist; just dismiss.
      setDone(true);
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await sb
      .from("profiles")
      .update({ display_name: trimmed, display_name_confirmed: true })
      .eq("id", user!.id);
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }
    await updatePlayerNameForUser(user!.id, trimmed);
    setBusy(false);
    setDone(true);
  };

  return (
    <Modal open onClose={() => {}}>
      <h2 className="font-display text-xl font-semibold text-fog">
        Pick your display name
      </h2>
      <p className="mt-2 text-sm text-mist">
        This is the name others see when you play. You can change it later in
        account settings.
      </p>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && confirm()}
        maxLength={40}
        placeholder="Display name"
        className="mt-4 w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm text-fog outline-none focus:border-leaf/50"
      />
      {err && <p className="mt-2 text-sm text-amber">{err}</p>}
      <div className="mt-4 flex justify-end">
        <Button onClick={confirm} disabled={busy}>
          {busy ? "Saving…" : "Confirm"}
        </Button>
      </div>
    </Modal>
  );
}
