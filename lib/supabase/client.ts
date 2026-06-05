"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from "./env";

/**
 * Browser Supabase client. Returns null if env vars are not configured so
 * the game still runs in a fully local/offline mode (saves to localStorage).
 */
export function getSupabaseBrowser() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}

export { isSupabaseConfigured };
