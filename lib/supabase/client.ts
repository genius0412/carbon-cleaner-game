"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from "./env";

/**
 * Browser Supabase client. Returns null if env vars are not configured so
 * the game still runs in a fully local/offline mode (saves to localStorage).
 *
 * Memoized to a single instance: creating a fresh client on every call spins up
 * multiple auth listeners contending the same navigator.locks key, which can
 * stall queries (e.g. saves hanging after an OAuth sign-in).
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return browserClient;
}

export { isSupabaseConfigured };
