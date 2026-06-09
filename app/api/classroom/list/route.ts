import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * List the classes owned by the signed-in teacher. Runs server-side so the
 * session is read from cookies, the browser client has been unreliable at
 * attaching the auth token after OAuth (it returns opaque empty errors), which
 * made the in-page class list come back blank. Mirrors create/update/kick.
 */
export async function GET() {
  const sb = await getSupabaseServer();
  if (!sb) {
    return NextResponse.json({ error: "Supabase isn't configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json(
      { error: "Your session wasn't recognized. Please log in again." },
      { status: 401 },
    );
  }

  const { data, error } = await sb
    .from("classrooms")
    .select("id, join_code, name, allowed_roles")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
  }
  return NextResponse.json({ classes: data ?? [] });
}
