import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { sanitizeRoles } from "@/lib/roles";

/**
 * Update a classroom the signed-in teacher owns, its name and/or the roles
 * students may pick. Runs server-side so the user's session is read from cookies
 * (the browser client has been unreliable at attaching the auth token). RLS
 * still enforces teacher ownership.
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
  let name: string | undefined;
  let allowedRolesProvided = false;
  let allowed_roles: string[] | null = null;
  try {
    const body = await request.json();
    id = typeof body?.id === "string" ? body.id : "";
    if (typeof body?.name === "string") name = body.name.trim();
    if (body?.allowedRoles !== undefined) {
      allowedRolesProvided = true;
      const roles = sanitizeRoles(body.allowedRoles);
      // Empty selection means "no restriction", not "lock out every role".
      allowed_roles = roles.length > 0 ? roles : null;
    }
  } catch {
    /* handled below */
  }
  if (!id) return NextResponse.json({ error: "Missing class id." }, { status: 400 });
  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Class name can't be empty." }, { status: 400 });
  }

  // Only touch the fields the caller actually sent.
  const patch: { name?: string; allowed_roles?: string[] | null } = {};
  if (name !== undefined) patch.name = name;
  if (allowedRolesProvided) patch.allowed_roles = allowed_roles;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await sb
    .from("classrooms")
    .update(patch)
    .eq("id", id)
    .eq("teacher_id", user.id) // belt-and-suspenders alongside RLS
    .select("id, join_code, name, allowed_roles")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
  }
  return NextResponse.json({ class: data });
}
