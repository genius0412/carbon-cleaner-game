import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Remove (kick) a member from a class the signed-in teacher owns. Runs
 * server-side so the user's session is read from cookies (the browser client
 * has been unreliable at attaching the auth token). We verify the caller owns
 * the classroom before deleting; the RLS teacher-delete policy enforces it too.
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

  let classroomId = "";
  let gameSaveId = "";
  try {
    const body = await request.json();
    classroomId = typeof body?.classroomId === "string" ? body.classroomId : "";
    gameSaveId = typeof body?.gameSaveId === "string" ? body.gameSaveId : "";
  } catch {
    /* handled below */
  }
  if (!classroomId || !gameSaveId) {
    return NextResponse.json(
      { error: "Missing classroom or member id." },
      { status: 400 },
    );
  }

  // Confirm the caller actually owns this class before touching its members.
  const { data: cls, error: clsErr } = await sb
    .from("classrooms")
    .select("id")
    .eq("id", classroomId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (clsErr) {
    return NextResponse.json({ error: clsErr.message, code: clsErr.code }, { status: 400 });
  }
  if (!cls) {
    return NextResponse.json(
      { error: "You can only remove members from your own classes." },
      { status: 403 },
    );
  }

  const { error } = await sb
    .from("classroom_members")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("game_save_id", gameSaveId);
  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
