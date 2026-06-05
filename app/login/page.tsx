"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { restoreByGuestCode } from "@/lib/saves";
import { useGameStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const loadGame = useGameStore((s) => s.loadGame);
  const [identifier, setIdentifier] = useState(""); // username OR email
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true);
    setMsg(null);
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMsg("Supabase isn't configured. Use guest mode or a resume code.");
      setBusy(false);
      return;
    }

    const id = identifier.trim();
    let email = id;

    // If they typed a username (no "@"), resolve it to an email.
    if (!id.includes("@")) {
      try {
        const { data, error } = await sb.rpc("email_for_identifier", { identifier: id });
        if (!error && data) {
          email = data as string;
        } else {
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

    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (/email not confirmed/i.test(error.message)) {
        setMsg("Please confirm your email first — check your inbox for the link.");
      } else if (/invalid login credentials/i.test(error.message)) {
        setMsg("Incorrect username/email or password.");
      } else {
        setMsg(error.message);
      }
    } else {
      router.push("/play");
    }
  };

  const resume = async () => {
    setBusy(true);
    setMsg(null);
    const result = await restoreByGuestCode(code.trim().toUpperCase());
    setBusy(false);
    if (result) {
      loadGame(result.state, result.meta);
      router.push("/play");
    } else {
      setMsg("No save found for that resume code.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center eco-grid px-6 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-mist hover:text-fog">← Home</Link>
        <h1 className="mt-4 font-display text-3xl font-semibold">Log in</h1>

        <Card className="mt-6 space-y-3">
          <input
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
            placeholder="Username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
          <input
            type="password"
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          <Button className="w-full" onClick={login} disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </Button>
          <div className="flex items-center justify-between text-xs text-mist">
            <Link href="/forgot-password" className="hover:text-fog">
              Forgot your password?
            </Link>
            <span>
              No account?{" "}
              <Link href="/signup" className="text-leaf hover:underline">Sign up</Link>
            </span>
          </div>
        </Card>

        <Card className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-cyan">Resume a guest game</p>
          <input
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 font-mono text-sm outline-none focus:border-leaf/50"
            placeholder="XXXX-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button variant="secondary" className="w-full" onClick={resume} disabled={busy || !code}>
            Restore save
          </Button>
        </Card>

        {msg && <p className="mt-4 text-center text-sm text-amber">{msg}</p>}
      </div>
    </main>
  );
}
