"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const signup = async () => {
    setMsg(null);
    setOk(false);

    // basic client-side validation
    const uname = username.trim();
    if (uname.length < 3) {
      setMsg("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(uname)) {
      setMsg("Username can only contain letters, numbers, and underscores.");
      return;
    }
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }

    const sb = getSupabaseBrowser();
    if (!sb) {
      setMsg("Supabase isn't configured yet. You can still play as a guest.");
      return;
    }

    setBusy(true);

    // 1) is the username already taken?
    try {
      const { data: available, error: rpcErr } = await sb.rpc("username_available", {
        uname,
      });
      if (rpcErr) {
        // RPC missing? fall through and let the unique index catch it.
      } else if (available === false) {
        setBusy(false);
        setMsg("That username is already taken. Try another.");
        return;
      }
    } catch {
      /* ignore — handled below */
    }

    // 2) create the auth user (profile is created by the DB trigger)
    const emailRedirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: uname }, emailRedirectTo },
    });
    setBusy(false);

    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        setMsg("An account with this email already exists. Try logging in.");
      } else if (/duplicate|unique/i.test(error.message)) {
        setMsg("That username is already taken. Try another.");
      } else {
        setMsg(error.message);
      }
      return;
    }

    // With "Confirm email" ON, an existing email returns a user with no
    // identities (anti-enumeration) — treat that as "already exists".
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setMsg("An account with this email already exists. Try logging in.");
      return;
    }

    setOk(true);
    if (data.session) {
      // email confirmation disabled → logged straight in
      setMsg("Account created! Taking you to the game…");
      setTimeout(() => router.push("/play"), 1200);
    } else {
      setMsg(
        "Account created! Check your email for a confirmation link, then come back and log in.",
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center eco-grid px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-mist hover:text-fog">← Home</Link>
        <h1 className="mt-4 font-display text-3xl font-semibold">Create account</h1>
        <Card className="mt-6 space-y-3">
          <input
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
            placeholder="Username (letters, numbers, _)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            type="password"
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            onKeyDown={(e) => e.key === "Enter" && signup()}
          />
          <Button className="w-full" onClick={signup} disabled={busy}>
            {busy ? "Creating…" : "Sign up"}
          </Button>
          <p className="text-center text-xs text-mist">
            Have an account? <Link href="/login" className="text-leaf hover:underline">Log in</Link>
            {" · "}
            <Link href="/play" className="text-leaf hover:underline">Play as guest</Link>
          </p>
        </Card>
        {msg && (
          <p className={`mt-4 text-center text-sm ${ok ? "text-leaf" : "text-amber"}`}>{msg}</p>
        )}
      </div>
    </main>
  );
}
