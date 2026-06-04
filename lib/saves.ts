"use client";

/**
 * saves.ts — persistence abstraction.
 * Persists game state to Supabase when configured; always mirrors to
 * localStorage so the game works fully offline. Guest saves use an opaque
 * resume code.
 */

import type { GameState } from "./engine/types";
import { getSupabaseBrowser } from "./supabase/client";
import { effectiveCarbonGain, formatYearMonth } from "./engine/engine";

const LOCAL_KEY = "carbon-cleaner-save";
const LOCAL_GUESTCODE = "carbon-cleaner-guestcode";

export interface SaveMeta {
  id?: string;
  guestCode?: string;
  userId?: string | null;
}

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

export function saveLocal(state: GameState, meta: SaveMeta) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ state, meta }));
  if (meta.guestCode) localStorage.setItem(LOCAL_GUESTCODE, meta.guestCode);
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
    state, // full JSON
    carbon_gain: effectiveCarbonGain(state),
    carbon_amount: state.carbonPpm,
    support: state.support,
    budget: state.budget,
    year_month: formatYearMonth(state),
    finished_at: state.finishedAt ?? null,
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
