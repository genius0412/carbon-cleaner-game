"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { updatePlayerNameForUser } from "@/lib/saves";
import { GoogleIcon } from "@/components/auth/GoogleButton";

export default function AccountPage() {
  const { user, loading } = useAuth();

  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <section className="z-10 mx-auto w-full max-w-lg px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">Account settings</h1>
        <p className="mt-3 text-mist">
          Change the name others see when you play, or update your password.
        </p>

        {loading ? (
          <Card className="mt-8">
            <p className="text-sm text-mist">Checking your session…</p>
          </Card>
        ) : !user ? (
          <Card className="mt-8">
            <p className="text-sm text-mist">
              <Link href="/login?next=/account" className="text-leaf hover:underline">
                Log in
              </Link>{" "}
              to manage your account.
            </p>
          </Card>
        ) : (
          <>
            <DisplayNameCard
              userId={user.id}
              initial={user.displayName ?? user.username ?? ""}
            />
            <PasswordCard
              isGoogle={user.provider === "google"}
              hasPassword={user.providers.includes("email")}
            />
            <Card className="mt-6">
              <h2 className="font-display text-lg font-semibold text-mist">Account</h2>

              {/* How they sign in. Google accounts have no username. */}
              <div className="mt-2 flex items-center gap-2 text-sm text-mist">
                <span>Sign-in method:</span>
                {user.provider === "google" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-fog">
                    <GoogleIcon /> Google
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-fog">
                    ✉️ Email &amp; password
                  </span>
                )}
              </div>

              {user.username && (
                <p className="mt-2 text-sm text-mist">
                  Username: <strong className="text-fog">{user.username}</strong>
                </p>
              )}
              <p className="mt-1 text-sm text-mist">
                Email: <strong className="text-fog">{user.email ?? ", "}</strong>
              </p>
            </Card>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

/* ---------------- Display name ---------------- */
function DisplayNameCard({ userId, initial }: { userId: string; initial: string }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Keep the field in sync if the profile name arrives after first paint.
  useEffect(() => {
    setName(initial);
  }, [initial]);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setMsg({ ok: false, text: "Display name must be at least 2 characters." });
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMsg({ ok: false, text: "Supabase isn't configured." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await sb
      .from("profiles")
      .update({ display_name: trimmed, display_name_confirmed: true })
      .eq("id", userId);
    if (error) {
      setBusy(false);
      setMsg({ ok: false, text: error.message });
      return;
    }
    // Refresh the denormalized name on existing games so leaderboards update.
    await updatePlayerNameForUser(userId, trimmed);
    setBusy(false);
    setMsg({ ok: true, text: "Display name updated." });
  };

  return (
    <Card className="mt-8">
      <h2 className="font-display text-lg font-semibold text-leaf">Display name</h2>
      <p className="mt-1 text-sm text-mist">The name others see when you play.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="flex-1 rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
      {msg && (
        <p className={`mt-2 text-sm ${msg.ok ? "text-leaf" : "text-amber"}`}>{msg.text}</p>
      )}
    </Card>
  );
}

/* ---------------- Password ---------------- */
function PasswordCard({
  isGoogle,
  hasPassword,
}: {
  isGoogle: boolean;
  hasPassword: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // A Google account with no password is *adding* one (so it can also use
  // email + password login); everyone else is *changing* an existing password.
  const adding = isGoogle && !hasPassword;

  const save = async () => {
    if (password.length < 6) {
      setMsg({ ok: false, text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setMsg({ ok: false, text: "Passwords don't match." });
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMsg({ ok: false, text: "Supabase isn't configured." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    setMsg({ ok: true, text: adding ? "Password added." : "Password updated." });
  };

  return (
    <Card className="mt-6">
      <h2 className="font-display text-lg font-semibold text-cyan">
        {adding ? "Add a password" : "Password"}
      </h2>
      <p className="mt-1 text-sm text-mist">
        {adding
          ? "Add a password to also sign in with your email."
          : "Choose a new password."}
      </p>
      <div className="mt-3 space-y-2">
        <input
          type="password"
          className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
          placeholder={adding ? "Password (min 6 characters)" : "New password (min 6 characters)"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <input
          type="password"
          className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : adding ? "Add password" : "Update password"}
        </Button>
      </div>
      {msg && (
        <p className={`mt-2 text-sm ${msg.ok ? "text-leaf" : "text-amber"}`}>{msg.text}</p>
      )}
    </Card>
  );
}
