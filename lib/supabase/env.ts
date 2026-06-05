/**
 * Centralized Supabase env resolution.
 *
 * Supports BOTH the legacy anon-key name and Supabase's newer "publishable
 * key" name, so whichever you put in .env.local works:
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY         (legacy JWT anon key)
 *   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (new sb_publishable_... key)
 *
 * NOTE: each NEXT_PUBLIC_* var is referenced as a literal so Next.js can
 * statically inline it into the client bundle.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = () =>
  Boolean(SUPABASE_URL && SUPABASE_KEY);
