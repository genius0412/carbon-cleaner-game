import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * OAuth / PKCE callback. Supabase redirects here with a `?code=` param after
 * the user authorizes with an external provider (e.g. Google). We exchange it
 * for a session (which sets the auth cookies) and then send them on their way.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Where to land after sign-in; defaults to the game.
  const next = searchParams.get("next") ?? "/play";

  if (code) {
    const sb = await getSupabaseServer();
    if (sb) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Something went wrong, bounce back to login with a flag.
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
