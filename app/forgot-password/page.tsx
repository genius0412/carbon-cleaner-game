"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendReset = async () => {
    setBusy(true);
    setMsg(null);
    setOk(false);
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMsg("Supabase isn't configured.");
      setBusy(false);
      return;
    }

    const id = identifier.trim();
    let email = id;

    // allow entering a username, resolve it to the account email
    if (!id.includes("@")) {
      try {
        const { data } = await sb.rpc("email_for_identifier", { identifier: id });
        if (data) email = data as string;
        else {
          setBusy(false);
          setMsg("No account found with that username.");
          return;
        }
      } catch {
        setBusy(false);
        setMsg("Couldn't look up that username. Try your email instead.");
        return;
      }
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (error) {
      setMsg(error.message);
    } else {
      setOk(true);
      setMsg("If an account exists, a password-reset link is on its way to your email.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center eco-grid px-6">
      <div className="w-full max-w-sm">
        <Link href="/login" className="text-sm text-mist hover:text-fog">← Back to log in</Link>
        <h1 className="mt-4 font-display text-3xl font-semibold">Reset your password</h1>
        <p className="mt-2 text-sm text-mist">
          Enter your username or email and we'll send a reset link.
        </p>
        <Card className="mt-6 space-y-3">
          <input
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
            placeholder="Username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendReset()}
          />
          <Button className="w-full" onClick={sendReset} disabled={busy || !identifier}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </Card>
        {msg && (
          <p className={`mt-4 text-center text-sm ${ok ? "text-leaf" : "text-amber"}`}>{msg}</p>
        )}
      </div>
    </main>
  );
}
