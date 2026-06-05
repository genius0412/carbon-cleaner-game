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

    const apply = async (session: Session | null) => {
      const u = session?.user;
      if (!u) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      let username: string | null =
        (u.user_metadata?.username as string | undefined) ?? null;
      if (!username) {
        // fall back to the profiles table if metadata is missing
        try {
          const { data } = await sb
            .from("profiles")
            .select("username")
            .eq("id", u.id)
            .maybeSingle();
          username = data?.username ?? null;
        } catch {
          /* ignore */
        }
      }
      if (active) {
        setUser({ id: u.id, email: u.email ?? null, username });
        setLoading(false);
      }
    };

    sb.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) =>
      apply(session),
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const sb = getSupabaseBrowser();
    await sb?.auth.signOut();
  };

  return { user, loading, signOut };
}
