"use client";

/**
 * saves.ts, persistence abstraction.
 * Persists game state to Supabase when configured; always mirrors to
 * localStorage so the game works fully offline. Guest saves use an opaque
 * resume code.
 */

import type { GameState } from "./engine/types";
import { getSupabaseBrowser } from "./supabase/client";
import { effectiveCarbonGain, formatYearMonth } from "./engine/engine";

const LOCAL_KEY = "carbon-cleaner-save"; // most-recent save (legacy / quick resume)
const LOCAL_SAVES_KEY = "carbon-cleaner-saves"; // map of every local save by key
const LOCAL_GUESTCODE = "carbon-cleaner-guestcode";

export interface SaveMeta {
  id?: string;
  /** Stable local-only id (e.g. "local-xxxx") for offline multi-save. */
  localId?: string;
  guestCode?: string;
  userId?: string | null;
}

/** One entry in a list of saved games (local or cloud). */
export interface SaveEntry {
  /** Unique key for React lists + routing (localId or cloud id). */
  key: string;
  state: GameState;
  meta: SaveMeta;
  updatedAt: string;
}

type StoredSave = { state: GameState; meta: SaveMeta; updatedAt: string };

/** Generate an opaque, human-copyable resume code. */
export function makeGuestCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
    if (i === 3 || i === 7) out += "-";
  }
  return out;
}

/** Stable id for a brand-new local game. */
export function makeLocalId(): string {
  const rnd =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `local-${rnd}`;
}

/** The key a save is stored under in the local map. */
function saveKey(meta: SaveMeta): string | null {
  return meta.localId ?? meta.id ?? null;
}

export function loadLocal(): { state: GameState; meta: SaveMeta } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readLocalSaves(): Record<string, StoredSave> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SAVES_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalSaves(map: Record<string, StoredSave>) {
  localStorage.setItem(LOCAL_SAVES_KEY, JSON.stringify(map));
}

export function saveLocal(state: GameState, meta: SaveMeta) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ state, meta }));
  if (meta.guestCode) localStorage.setItem(LOCAL_GUESTCODE, meta.guestCode);

  const key = saveKey(meta);
  if (key) {
    const map = readLocalSaves();
    map[key] = { state, meta, updatedAt: new Date().toISOString() };
    writeLocalSaves(map);
  }
}

/** All locally-saved games, most-recent first. */
export function listLocalSaves(): SaveEntry[] {
  const map = readLocalSaves();
  const entries: SaveEntry[] = Object.entries(map).map(([key, v]) => ({
    key,
    state: v.state,
    meta: v.meta,
    updatedAt: v.updatedAt,
  }));
  // legacy single save that predates the map
  if (entries.length === 0) {
    const legacy = loadLocal();
    if (legacy) {
      entries.push({
        key: legacy.meta.localId ?? legacy.meta.id ?? "local",
        state: legacy.state,
        meta: legacy.meta,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Look up a single local save by its key (localId or cloud id). */
export function getLocalSave(key: string): { state: GameState; meta: SaveMeta } | null {
  const map = readLocalSaves();
  const hit = map[key];
  if (hit) return { state: hit.state, meta: hit.meta };
  const legacy = loadLocal();
  if (legacy && (legacy.meta.localId === key || legacy.meta.id === key)) return legacy;
  return null;
}

/** Remove a local save. */
export function deleteLocalSave(key: string) {
  if (typeof window === "undefined") return;
  const map = readLocalSaves();
  // The deduped play menu shows the cloud copy of a synced game, whose `key` is
  // the cloud id, but the local mirror is stored under its localId. Match on
  // the map key OR either meta id so deletion works whichever id we're handed,
  // otherwise the local mirror survives and the game reappears on refresh.
  let changed = false;
  for (const [k, v] of Object.entries(map)) {
    if (k === key || v.meta.id === key || v.meta.localId === key) {
      delete map[k];
      changed = true;
    }
  }
  if (changed) writeLocalSaves(map);
  // clear the legacy pointer if it referenced this save
  const legacy = loadLocal();
  if (legacy && (legacy.meta.localId === key || legacy.meta.id === key)) {
    localStorage.removeItem(LOCAL_KEY);
  }
}

export function getStoredGuestCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_GUESTCODE);
}

function rowFromState(state: GameState, meta: SaveMeta) {
  return {
    id: meta.id,
    user_id: meta.userId ?? null,
    guest_code: meta.guestCode ?? null,
    mode: state.mode,
    character_type: state.characterType,
    city_name: state.cityName,
    player_name: state.playerName ?? null,
    state, // full JSON
    carbon_gain: effectiveCarbonGain(state),
    carbon_amount: state.carbonPpm,
    support: state.support,
    budget: state.budget,
    year_month: formatYearMonth(state),
    finished_at: state.finishedAt ?? null,
    // Stable creation time (anti-cheat for class joins). Only sent when known
    // so legacy saves without it leave the column untouched.
    ...(state.createdAt ? { created_at: state.createdAt } : {}),
    updated_at: new Date().toISOString(),
  };
}

/** Upsert to Supabase (if configured) + localStorage. Returns the save id. */
export async function persistSave(
  state: GameState,
  meta: SaveMeta,
): Promise<SaveMeta> {
  saveLocal(state, meta);
  const sb = getSupabaseBrowser();
  if (!sb) return meta;

  const row = rowFromState(state, meta);
  try {
    const { data, error } = await sb
      .from("game_saves")
      .upsert(row, { onConflict: "id" })
      .select("id")
      .single();
    if (error) {
      // fall back silently to local-only
      return meta;
    }
    const newMeta = { ...meta, id: data?.id ?? meta.id };
    saveLocal(state, newMeta);
    return newMeta;
  } catch {
    return meta;
  }
}

/** Restore the most recent cloud save for a logged-in user. */
export async function restoreLatestForUser(
  userId: string,
): Promise<{ state: GameState; meta: SaveMeta } | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("game_saves")
      .select("id, user_id, guest_code, state")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.state) {
      return {
        state: data.state as GameState,
        meta: { id: data.id, userId: data.user_id, guestCode: data.guest_code ?? undefined },
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Build SaveEntry list from selected game_saves rows. */
function entriesFromRows(rows: { id: string; user_id?: string | null; guest_code?: string | null; state: GameState; updated_at?: string }[]): SaveEntry[] {
  return rows
    .filter((r) => r.state)
    .map((r) => ({
      key: r.id,
      state: r.state as GameState,
      meta: { id: r.id, userId: r.user_id ?? undefined, guestCode: r.guest_code ?? undefined },
      updatedAt: r.updated_at ?? new Date().toISOString(),
    }));
}

/** All cloud saves for a logged-in user, most-recent first. */
export async function listSavesForUser(userId: string): Promise<SaveEntry[]> {
  const sb = getSupabaseBrowser();
  if (!sb) return [];
  try {
    const { data } = await sb
      .from("game_saves")
      .select("id, user_id, guest_code, state, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    return data ? entriesFromRows(data) : [];
  } catch {
    return [];
  }
}

/** All cloud saves tied to a guest resume code, most-recent first. */
export async function listSavesByGuestCode(code: string): Promise<SaveEntry[]> {
  const sb = getSupabaseBrowser();
  if (!sb) return [];
  try {
    const { data } = await sb
      .from("game_saves")
      .select("id, user_id, guest_code, state, updated_at")
      .eq("guest_code", code)
      .order("updated_at", { ascending: false });
    return data ? entriesFromRows(data) : [];
  } catch {
    return [];
  }
}

/**
 * Bulk-update the denormalized player_name on all of a user's cloud saves.
 * Called when they rename themselves in account settings so existing
 * leaderboard rows reflect the new name. Best-effort (no-op offline).
 */
export async function updatePlayerNameForUser(
  userId: string,
  name: string,
): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb || !userId) return;
  try {
    await sb.from("game_saves").update({ player_name: name }).eq("user_id", userId);
  } catch {
    /* ignore, name still updates on the next per-save persist */
  }
}

/** Delete a cloud save by id. Returns false when the row is still there
 *  afterwards (network error, or the delete was blocked by RLS). */
export async function deleteCloudSave(id: string): Promise<boolean> {
  const sb = getSupabaseBrowser();
  if (!sb) return true;
  try {
    const { data, error } = await sb
      .from("game_saves")
      .delete()
      .eq("id", id)
      .select("id");
    if (!error && (data?.length ?? 0) > 0) return true;
    // 0 rows deleted: either already gone (fine) or silently blocked — check.
    const { data: still } = await sb
      .from("game_saves")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    return !still;
  } catch {
    return false;
  }
}

/** Restore a guest save by resume code (Supabase first, else local). */
export async function restoreByGuestCode(
  code: string,
): Promise<{ state: GameState; meta: SaveMeta } | null> {
  const sb = getSupabaseBrowser();
  if (sb) {
    try {
      const { data } = await sb
        .from("game_saves")
        .select("id, guest_code, user_id, state")
        .eq("guest_code", code)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.state) {
        return {
          state: data.state as GameState,
          meta: { id: data.id, guestCode: data.guest_code, userId: data.user_id },
        };
      }
    } catch {
      /* ignore, fall through to local */
    }
  }
  // local fallback
  const local = loadLocal();
  if (local && local.meta.guestCode === code) return local;
  return null;
}
