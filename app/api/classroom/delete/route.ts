import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Delete a class the signed-in teacher owns. Memberships cascade away with the
 * classroom row, but the students' game saves are untouched: their games keep
 * running, they just no longer belong to this class. Runs server-side so the
 * session is read from cookies (mirrors create/update/kick); RLS enforces
 * teacher ownership too.
 */
export async function POST(request: Request) {
  const sb = await getSupabaseServer();
  if (!sb) {
    return NextResponse.json({ error: "Classrooms aren't available right now." }, { status: 500 });
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

  let id = "";
  try {
    const body = await request.json();
    id = typeof body?.id === "string" ? body.id : "";
  } catch {
    /* handled below */
  }
  if (!id) return NextResponse.json({ error: "Missing class id." }, { status: 400 });

  // Confirm the caller actually owns this class before deleting it.
  const { data: cls, error: clsErr } = await sb
    .from("classrooms")
    .select("id")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (clsErr) {
    return NextResponse.json({ error: clsErr.message, code: clsErr.code }, { status: 400 });
  }
  if (!cls) {
    return NextResponse.json(
      { error: "You can only delete your own classes." },
      { status: 403 },
    );
  }

  const { error } = await sb
    .from("classrooms")
    .delete()
    .eq("id", id)
    .eq("teacher_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
