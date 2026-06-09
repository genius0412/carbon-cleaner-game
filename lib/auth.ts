"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "./supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
  /** Friendly, editable display name (separate from the unique username). */
  displayName: string | null;
  /** False until the user has chosen/confirmed a display name (OAuth prompt). */
  displayNameConfirmed: boolean;
  /** Primary sign-in method, e.g. "email" or "google". */
  provider: string | null;
  /** All linked sign-in methods (a Google user who adds a password has both). */
  providers: string[];
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
    // OUTSIDE the onAuthStateChange callback, that callback executes inside
    // supabase-js's auth lock, and calling another Supabase method from within
    // it deadlocks (the symptom: "Checking session…" then a false logged-out
    // state on client-side navigation). We defer it with setTimeout so the lock
    // is released first.
    const enrichProfile = async (id: string) => {
      try {
        const { data } = await sb
          .from("profiles")
          .select("username, display_name, display_name_confirmed")
          .eq("id", id)
          .maybeSingle();
        if (active && data) {
          setUser((prev) =>
            prev && prev.id === id
              ? {
                  ...prev,
                  username: data.username ?? prev.username,
                  displayName: data.display_name ?? prev.displayName,
                  displayNameConfirmed: !!data.display_name_confirmed,
                }
              : prev,
          );
        }
      } catch {
        /* ignore, fields stay at their session defaults */
      }
    };

    // Synchronous, no Supabase calls, safe to run inside the auth lock.
    const applySession = (session: Session | null) => {
      if (!active) return;
      const u = session?.user;
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      const meta = u.user_metadata ?? {};
      const metaUsername = (meta.username as string | undefined) ?? null;
      const metaDisplay =
        (meta.display_name as string | undefined) ??
        metaUsername ??
        (meta.full_name as string | undefined) ??
        (meta.name as string | undefined) ??
        null;
      // Which provider(s) the account is linked to (e.g. "email", "google").
      const providers =
        (u.app_metadata?.providers as string[] | undefined) ??
        (u.app_metadata?.provider ? [u.app_metadata.provider] : []);
      setUser({
        id: u.id,
        email: u.email ?? null,
        username: metaUsername,
        displayName: metaDisplay,
        // Assume confirmed until the profile says otherwise, so we don't flash
        // the prompt for already-set-up users; enrichProfile corrects this.
        displayNameConfirmed: true,
        provider: (u.app_metadata?.provider as string | undefined) ?? providers[0] ?? null,
        providers,
      });
      setLoading(false);
      // Defer the profiles query until after the lock is released, it fills in
      // the username/display name and the authoritative confirmed flag.
      setTimeout(() => enrichProfile(u.id), 0);
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
