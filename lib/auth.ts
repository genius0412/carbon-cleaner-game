"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "./supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
}

/**
 * Tracks the current Supabase auth session and exposes the logged-in user
 * (id, email, username) plus a signOut helper. Returns user=null when logged
 * out or when Supabase isn't configured.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setLoading(false);
      return;
    }
    let active = true;

    // Enrich the username from the profiles table. IMPORTANT: this must run
    // OUTSIDE the onAuthStateChange callback — that callback executes inside
    // supabase-js's auth lock, and calling another Supabase method from within
    // it deadlocks (the symptom: "Checking session…" then a false logged-out
    // state on client-side navigation). We defer it with setTimeout so the lock
    // is released first.
    const enrichUsername = async (id: string) => {
      try {
        const { data } = await sb
          .from("profiles")
          .select("username")
          .eq("id", id)
          .maybeSingle();
        if (active && data?.username) {
          setUser((prev) =>
            prev && prev.id === id ? { ...prev, username: data.username } : prev,
          );
        }
      } catch {
        /* ignore — username stays null */
      }
    };

    // Synchronous, no Supabase calls — safe to run inside the auth lock.
    const applySession = (session: Session | null) => {
      if (!active) return;
      const u = session?.user;
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      const metaUsername =
        (u.user_metadata?.username as string | undefined) ?? null;
      setUser({ id: u.id, email: u.email ?? null, username: metaUsername });
      setLoading(false);
      // Defer the profiles query until after the lock is released.
      if (!metaUsername) setTimeout(() => enrichUsername(u.id), 0);
    };

    // onAuthStateChange fires INITIAL_SESSION on subscribe and is our source of
    // truth; getSession() covers the initial read. Neither callback awaits or
    // calls Supabase, so the lock can't deadlock.
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) =>
      applySession(session),
    );
    sb.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch(() => {});

    // Defensive: never let the spinner stick if the SDK stalls.
    const failsafe = setTimeout(() => {
      if (active) setLoading(false);
    }, 3000);

    return () => {
      active = false;
      clearTimeout(failsafe);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const sb = getSupabaseBrowser();
    // Optimistically clear so the UI updates instantly even if the network
    // call below stalls (the supabase-js auth lock can hang after OAuth).
    setUser(null);
    setLoading(false);
    try {
      // `local` scope clears the stored session/cookies without the global
      // server-revoke round-trip that's prone to hanging.
      await sb?.auth.signOut({ scope: "local" });
    } catch {
      /* already cleared locally above */
    }
  };

  return { user, loading, signOut };
}
