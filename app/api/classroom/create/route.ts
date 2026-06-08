import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { sanitizeRoles } from "@/lib/classroom";

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
  // null = no restriction (any role); an array = only those roles are allowed.
  let allowed_roles: string[] | null = null;
  try {
    const body = await request.json();
    if (typeof body?.name === "string" && body.name.trim()) name = body.name.trim();
    if (body?.allowedRoles !== undefined) {
      const roles = sanitizeRoles(body.allowedRoles);
      // An empty selection means "no restriction" rather than "no roles" (which
      // would lock students out of every role).
      allowed_roles = roles.length > 0 ? roles : null;
    }
  } catch {
    /* empty body is fine */
  }

  // Generate a code, retrying on the rare unique collision.
  for (let attempt = 0; attempt < 6; attempt++) {
    const join_code = makeClassCode();
    const { data, error } = await sb
      .from("classrooms")
      .insert({ join_code, name, teacher_id: user.id, allowed_roles })
      .select("id, join_code, name, allowed_roles")
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
