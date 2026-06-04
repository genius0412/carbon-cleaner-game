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
  const [email, setEmail] = useState("");
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
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else router.push("/play");
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
    <main className="flex min-h-screen items-center justify-center eco-grid px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-mist hover:text-fog">← Home</Link>
        <h1 className="mt-4 font-display text-3xl font-semibold">Log in</h1>

        <Card className="mt-6 space-y-3">
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
          <Button className="w-full" onClick={login} disabled={busy}>Log in</Button>
          <p className="text-center text-xs text-mist">
            No account? <Link href="/signup" className="text-leaf hover:underline">Sign up</Link>
          </p>
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
