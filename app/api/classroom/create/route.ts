import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/** Short, readable class code (no ambiguous characters). */
function makeClassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Create a classroom as the signed-in teacher. Runs server-side so the user's
 * session is read straight from the request cookies — the browser client has
 * been failing to attach the auth token, which made the RLS check (auth.uid() =
 * teacher_id) fail. Here auth.uid() is resolved from the cookie session.
 */
export async function POST(request: Request) {
  const sb = await getSupabaseServer();
  if (!sb) {
    return NextResponse.json({ error: "Supabase isn't configured." }, { status: 500 });
  }

  // Verify the caller is authenticated (validates the token server-side).
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

  let name = "Untitled Class";
  try {
    const body = await request.json();
    if (typeof body?.name === "string" && body.name.trim()) name = body.name.trim();
  } catch {
    /* empty body is fine */
  }

  // Generate a code, retrying on the rare unique collision.
  for (let attempt = 0; attempt < 6; attempt++) {
    const join_code = makeClassCode();
    const { data, error } = await sb
      .from("classrooms")
      .insert({ join_code, name, teacher_id: user.id })
      .select("id, join_code, name")
      .single();

    if (!error && data) {
      return NextResponse.json({ class: data });
    }
    if (error && /duplicate|unique/i.test(error.message)) {
      continue; // collision — try another code
    }
    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }
  }

  return NextResponse.json(
    { error: "Couldn't generate a unique class code. Please try again." },
    { status: 409 },
  );
}
