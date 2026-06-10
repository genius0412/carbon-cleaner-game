"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Landing page for the password-reset email link. Supabase redirects here with
 * a recovery session; once it's established the user can set a new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setChecking(false);
      setMsg("Password reset isn't available right now.");
      return;
    }

    // Listen for the recovery/sign-in event the client fires after parsing
    // the link, and also handle a PKCE ?code= param explicitly.
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setReady(true);
        setChecking(false);
      }
    });

    (async () => {
      const url = new URL(window.location.href);
      const codeParam = url.searchParams.get("code");
      if (codeParam) {
        const { error } = await sb.auth.exchangeCodeForSession(codeParam);
        if (!error) {
          setReady(true);
          setChecking(false);
          return;
        }
      }
      const { data } = await sb.auth.getSession();
      if (data.session) setReady(true);
      setChecking(false);
    })();

    return () => sub.subscription.unsubscribe();
  }, []);

  const update = async () => {
    setMsg(null);
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMsg("Passwords don't match.");
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMsg(error.message);
    } else {
      setOk(true);
      setMsg("Password updated! Redirecting to log in…");
      setTimeout(() => router.push("/login"), 1500);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center eco-grid px-6">
      <div className="w-full max-w-sm">
        <Link href="/login" className="text-sm text-mist hover:text-fog">← Back to log in</Link>
        <h1 className="mt-4 font-display text-3xl font-semibold">Set a new password</h1>

        <Card className="mt-6 space-y-3">
          {checking ? (
            <p className="text-sm text-mist">Verifying your reset link…</p>
          ) : ready ? (
            <>
              <input
                type="password"
                className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
                placeholder="New password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <input
                type="password"
                className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && update()}
              />
              <Button className="w-full" onClick={update} disabled={busy}>
                {busy ? "Updating…" : "Update password"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-amber">
              This reset link is invalid or has expired. Request a new one from{" "}
              <Link href="/forgot-password" className="text-leaf hover:underline">
                Forgot your password
              </Link>
              .
            </p>
          )}
        </Card>
        {msg && (
          <p className={`mt-4 text-center text-sm ${ok ? "text-leaf" : "text-amber"}`}>{msg}</p>
        )}
      </div>
    </main>
  );
}
