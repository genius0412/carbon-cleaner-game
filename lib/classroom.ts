"use client";

/**
 * Classroom join helpers shared by the play flow, the in-game menu, and the
 * classroom page. Joining links a (cloud-saved) game to a class scoreboard.
 */

import { getSupabaseBrowser } from "./supabase/client";

/** Build a shareable invite link that pre-fills the class code on /play. */
export function classInviteLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/play?class=${encodeURIComponent(code.trim().toUpperCase())}`;
}

/** Normalize a user-entered class code. */
export function normalizeClassCode(code: string): string {
  return code.trim().toUpperCase();
}

export interface JoinResult {
  ok: boolean;
  message: string;
  className?: string;
}

export interface SaveClass {
  id: string;
  name: string | null;
  join_code: string;
}

/** Classes a given (cloud-saved) game currently belongs to. */
export async function listClassesForSave(saveId: string): Promise<SaveClass[]> {
  const sb = getSupabaseBrowser();
  if (!sb || !saveId) return [];
  try {
    const { data, error } = await sb
      .from("classroom_members")
      .select("classrooms(id, name, join_code)")
      .eq("game_save_id", saveId);
    if (error || !data) return [];
    // PostgREST embeds the related row(s) under `classrooms` (object or array).
    return (data as unknown as { classrooms: SaveClass | SaveClass[] | null }[])
      .flatMap((row) => {
        const c = row.classrooms;
        if (!c) return [] as SaveClass[];
        return Array.isArray(c) ? c : [c];
      });
  } catch {
    return [];
  }
}

/**
 * Add a saved game to a class by its join code. Requires the game to already
 * have a cloud save id (so it can be linked).
 */
export async function joinClassByCode(
  code: string,
  saveId: string,
  cityName: string,
  gameCreatedAt?: string,
): Promise<JoinResult> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, message: "Joining a class needs an internet connection." };

  const join_code = normalizeClassCode(code);
  if (!join_code) return { ok: false, message: "Enter a class code." };

  const { data: cls, error: lookupErr } = await sb
    .from("classrooms")
    .select("id, name, created_at")
    .eq("join_code", join_code)
    .maybeSingle();
  if (lookupErr || !cls) {
    return { ok: false, message: "No class found with that code." };
  }

  // Anti-cheat: a game can only join a class created at or before it was made,
  // so you can't enter an old, already-progressed game into a new class.
  const classCreatedAt = (cls as { created_at?: string }).created_at;
  if (gameCreatedAt && classCreatedAt && new Date(gameCreatedAt) < new Date(classCreatedAt)) {
    return {
      ok: false,
      className: cls.name ?? undefined,
      message:
        "This game was started before the class was created, so it can't join (to keep the scoreboard fair). Start a new game to join this class.",
    };
  }

  // Already a member? Don't re-insert — an upsert would become an UPDATE, and
  // classroom_members has no UPDATE policy (RLS rejects it). Just report success.
  const { data: existing } = await sb
    .from("classroom_members")
    .select("game_save_id")
    .eq("classroom_id", cls.id)
    .eq("game_save_id", saveId)
    .maybeSingle();
  if (existing) {
    return {
      ok: true,
      className: cls.name ?? undefined,
      message: `${cityName} is already in ${cls.name ?? "this class"}.`,
    };
  }

  // Plain INSERT (covered by the insert policy) — never the UPDATE path.
  const { error } = await sb
    .from("classroom_members")
    .insert({ classroom_id: cls.id, game_save_id: saveId, city_name: cityName });
  if (error) {
    return { ok: false, message: error.message, className: cls.name ?? undefined };
  }
  return {
    ok: true,
    className: cls.name ?? undefined,
    message: `Joined ${cls.name ?? "the class"}! ${cityName} is on the scoreboard.`,
  };
}
