"use client";

/**
 * Classroom join helpers shared by the play flow, the in-game menu, and the
 * classroom page. Joining links a (cloud-saved) game to a class scoreboard.
 */

import { getSupabaseBrowser } from "./supabase/client";
import type { CharacterType, GameState } from "./engine/types";
// Pure role helpers live in a non-"use client" module so server routes can use
// them too (see lib/roles.ts). Re-exported here for existing client imports.
import { ALL_ROLES, sanitizeRoles, roleLabel } from "./roles";

export { ALL_ROLES, sanitizeRoles, roleLabel };

/**
 * Roles a class permits, by join code. Returns null when the class places no
 * restriction (any role is fine) or can't be found, so callers fall back to
 * offering every role.
 */
export async function getClassAllowedRoles(code: string): Promise<CharacterType[] | null> {
  const sb = getSupabaseBrowser();
  const join_code = normalizeClassCode(code);
  if (!sb || !join_code) return null;
  try {
    const { data } = await sb
      .from("classrooms")
      .select("allowed_roles")
      .eq("join_code", join_code)
      .maybeSingle();
    const roles = sanitizeRoles((data as { allowed_roles?: unknown } | null)?.allowed_roles);
    return roles.length > 0 ? roles : null;
  } catch {
    return null;
  }
}

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

export interface ScoreboardRow {
  game_save_id: string | null;
  city_name: string;
  /** Player's display name (leaderboard subtitle); null when unset. */
  player_name: string | null;
  /** Role the player chose (mayor / student_older / student_younger). */
  character_type: CharacterType | null;
  carbon_gain: number;
  /** Current in-game date (e.g. "Mar 2034"); shows how far they've played. */
  year_month: string | null;
  /** Current atmospheric carbon (ppm) at last save. */
  carbon_amount: number | null;
  finished_at: string | null;
  /** Game outcome from the save: "won" | "lost" | "playing" (null = unknown). */
  status: string | null;
}

export interface ClassScoreboard {
  classId: string;
  className: string | null;
  /** Members already ranked: finishers (by finish time) then players (by gain). */
  rows: ScoreboardRow[];
}

/** Winners rank first by finish time; everyone else by lowest carbon gain.
 *  A finished-but-lost game ranks with the rest, ending the game by losing
 *  shouldn't beat someone still playing well. */
export function rankScoreboard(rows: ScoreboardRow[]): ScoreboardRow[] {
  const winners = rows
    .filter((r) => r.status === "won" && r.finished_at)
    .sort((a, b) => (a.finished_at! < b.finished_at! ? -1 : 1));
  const rest = rows
    .filter((r) => !(r.status === "won" && r.finished_at))
    .sort((a, b) => a.carbon_gain - b.carbon_gain);
  return [...winners, ...rest];
}

/**
 * Fetch a class's live, ranked scoreboard by join code. Returns null when the
 * class can't be found (or there's no connection). Each row carries its
 * game_save_id so callers can highlight "you".
 */
export async function fetchClassScoreboard(code: string): Promise<ClassScoreboard | null> {
  const sb = getSupabaseBrowser();
  const join_code = normalizeClassCode(code);
  if (!sb || !join_code) return null;
  try {
    const { data: cls } = await sb
      .from("classrooms")
      .select("id, name")
      .eq("join_code", join_code)
      .maybeSingle();
    if (!cls) return null;
    const { data } = await sb
      .from("classroom_members")
      .select("game_save_id, city_name, game_saves(carbon_gain, carbon_amount, year_month, finished_at, city_name, player_name, character_type, status:state->>status)")
      .eq("classroom_id", cls.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: ScoreboardRow[] = (data ?? []).map((m: any) => ({
      game_save_id: m.game_save_id ?? null,
      city_name: m.city_name ?? m.game_saves?.city_name ?? "Unknown",
      player_name: m.game_saves?.player_name ?? null,
      character_type: (m.game_saves?.character_type as CharacterType | null) ?? null,
      carbon_gain: m.game_saves?.carbon_gain ?? 999,
      year_month: m.game_saves?.year_month ?? null,
      carbon_amount: m.game_saves?.carbon_amount ?? null,
      finished_at: m.game_saves?.finished_at ?? null,
      status: m.game_saves?.status ?? null,
    }));
    return {
      classId: cls.id as string,
      className: (cls.name as string | null) ?? null,
      rows: rankScoreboard(mapped),
    };
  } catch {
    return null;
  }
}

/**
 * Full saved game states for every member of a class, for the teacher's
 * combined report / grading export. Skips members whose save is missing.
 */
export async function fetchClassStates(
  classId: string,
): Promise<{ saveId: string; state: GameState }[]> {
  const sb = getSupabaseBrowser();
  if (!sb || !classId) return [];
  try {
    const { data } = await sb
      .from("classroom_members")
      .select("game_save_id, game_saves(state)")
      .eq("classroom_id", classId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).flatMap((m: any) =>
      m.game_save_id && m.game_saves?.state
        ? [{ saveId: m.game_save_id as string, state: m.game_saves.state }]
        : [],
    );
  } catch {
    return [];
  }
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

  // A game can belong to only one class. If this save already has a membership,
  // either it's this same class (report success, no re-insert, there's no
  // UPDATE policy so an upsert would be rejected by RLS) or it's a different
  // class (refuse: one class per game).
  const { data: memberships } = await sb
    .from("classroom_members")
    .select("classroom_id")
    .eq("game_save_id", saveId);
  if (memberships && memberships.length > 0) {
    if (memberships.some((m) => m.classroom_id === cls.id)) {
      return {
        ok: true,
        className: cls.name ?? undefined,
        message: `${cityName} is already in ${cls.name ?? "this class"}.`,
      };
    }
    return {
      ok: false,
      className: cls.name ?? undefined,
      message:
        "This game is already in a class. A game can only join one class, start a new game to join a different one.",
    };
  }

  // Plain INSERT (covered by the insert policy), never the UPDATE path.
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

/**
 * Remove a member from a class (teacher-only). Goes through the server route so
 * the teacher check runs against the cookie session; RLS also enforces it.
 * Returns an error message on failure, or null on success.
 */
export async function kickMember(
  classroomId: string,
  gameSaveId: string,
): Promise<string | null> {
  try {
    const res = await fetch("/api/classroom/kick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ classroomId, gameSaveId }),
    });
    if (res.ok) return null;
    const payload = await res.json().catch(() => ({}));
    return payload.error ?? "Couldn't remove that member. Please try again.";
  } catch {
    return "Couldn't reach the server. Please try again.";
  }
}
