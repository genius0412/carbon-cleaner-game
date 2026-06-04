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
  const [busy, setBusy] = useState(false);

  const signup = async () => {
    setBusy(true);
    setMsg(null);
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMsg("Supabase isn't configured yet. You can still play as a guest.");
      setBusy(false);
      return;
    }
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }
    // create profile row (best-effort)
    if (data.user) {
      try {
        await sb.from("profiles").insert({ id: data.user.id, username, role: "player" });
      } catch {
        /* ignore */
      }
    }
    setBusy(false);
    setMsg("Account created! Check your email if confirmation is required, then log in.");
    setTimeout(() => router.push("/play"), 1500);
  };

  return (
    <main className="flex min-h-screen items-center justify-center eco-grid px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-mist hover:text-fog">← Home</Link>
        <h1 className="mt-4 font-display text-3xl font-semibold">Create account</h1>
        <Card className="mt-6 space-y-3">
          <input
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-sm outline-none focus:border-leaf/50"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" onClick={signup} disabled={busy}>Sign up</Button>
          <p className="text-center text-xs text-mist">
            Have an account? <Link href="/login" className="text-leaf hover:underline">Log in</Link>
            {" · "}
            <Link href="/play" className="text-leaf hover:underline">Play as guest</Link>
          </p>
        </Card>
        {msg && <p className="mt-4 text-center text-sm text-amber">{msg}</p>}
      </div>
    </main>
  );
}
