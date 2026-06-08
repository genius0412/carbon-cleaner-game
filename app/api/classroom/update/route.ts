import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Rename a classroom the signed-in teacher owns. Runs server-side so the user's
 * session is read from cookies (the browser client has been unreliable at
 * attaching the auth token). RLS still enforces teacher ownership.
 */
export async function POST(request: Request) {
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

  let id = "";
  let name = "";
  try {
    const body = await request.json();
    id = typeof body?.id === "string" ? body.id : "";
    name = typeof body?.name === "string" ? body.name.trim() : "";
  } catch {
    /* handled below */
  }
  if (!id) return NextResponse.json({ error: "Missing class id." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Class name can't be empty." }, { status: 400 });

  const { data, error } = await sb
    .from("classrooms")
    .update({ name })
    .eq("id", id)
    .eq("teacher_id", user.id) // belt-and-suspenders alongside RLS
    .select("id, join_code, name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
  }
  return NextResponse.json({ class: data });
}
