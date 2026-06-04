"use client";

/**
 * store.ts — the live game store (Zustand).
 * Holds the running simulation, the real-time clock loop, pause state, speed,
 * auto-pause (a modal/panel is open), and wires actions through the pure
 * engine. Debounced autosave persists to Supabase/localStorage.
 */

import { create } from "zustand";
import { GAME } from "./config/gameConstants";
import type { CharacterType, GameState } from "./engine/types";
import {
  createInitialState,
  tickMonth,
  buildInfrastructure,
  foundResearch,
  passBill,
  plantTrees,
  applyCivicBoost,
  type ActionResult,
} from "./engine/engine";
import { persistSave, makeGuestCode, type SaveMeta } from "./saves";

interface GameStore {
  game: GameState | null;
  meta: SaveMeta;
  speed: number;
  paused: boolean;
  // number of open panels/modals; >0 => auto-paused
  openPanels: number;
  lastFeedback: { title: string; message: string; ok: boolean } | null;

  // lifecycle
  newGame: (character: CharacterType, cityName: string, asGuest: boolean) => void;
  loadGame: (state: GameState, meta: SaveMeta) => void;
  reset: () => void;

  // clock
  tick: () => void;
  setSpeed: (s: number) => void;
  setPaused: (p: boolean) => void;
  togglePause: () => void;
  skipYear: () => void;
  openPanel: () => void;
  closePanel: () => void;

  // actions
  doBuild: (regionId: string, infraId: string) => void;
  doResearch: (researchId: string) => void;
  doBill: (billId: string) => void;
  doTrees: (treeId: string, batches: number) => void;
  doCivicBoost: (letter: string) => void;
  setCivic: (patch: Partial<NonNullable<GameState["civic"]>>) => void;

  clearFeedback: () => void;
  save: () => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useGameStore = create<GameStore>((set, get) => {
  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get().save(), GAME.autosaveDebounceMs);
  };

  const applyResult = (res: ActionResult, successTitle: string) => {
    if (!res.ok) {
      set({ lastFeedback: { title: "Action blocked", message: res.message, ok: false } });
      return;
    }
    set({
      game: res.state,
      lastFeedback: { title: successTitle, message: res.message, ok: true },
    });
    scheduleSave();
  };

  return {
    game: null,
    meta: {},
    speed: 1,
    paused: false,
    openPanels: 0,
    lastFeedback: null,

    newGame: (character, cityName, asGuest) => {
      const game = createInitialState(character, cityName);
      const meta: SaveMeta = asGuest ? { guestCode: makeGuestCode() } : {};
      set({ game, meta, paused: false, speed: 1, openPanels: 0, lastFeedback: null });
      scheduleSave();
    },

    loadGame: (state, meta) =>
      set({ game: state, meta, paused: true, speed: 1, openPanels: 0 }),

    reset: () => set({ game: null, meta: {}, openPanels: 0, lastFeedback: null }),

    tick: () => {
      const { game, paused, openPanels } = get();
      if (!game || game.status !== "playing") return;
      if (paused || openPanels > 0) return;
      const next = tickMonth(game);
      set({ game: next });
      if (next.status !== "playing") {
        set({ paused: true });
        get().save();
      } else {
        scheduleSave();
      }
    },

    setSpeed: (s) => set({ speed: s }),
    setPaused: (p) => set({ paused: p }),
    togglePause: () => set((st) => ({ paused: !st.paused })),

    skipYear: () => {
      const { game } = get();
      if (!game || game.status !== "playing") return;
      let next = game;
      for (let i = 0; i < 12 && next.status === "playing"; i++) {
        next = tickMonth(next);
      }
      set({ game: next, paused: next.status !== "playing" ? true : get().paused });
      scheduleSave();
    },

    openPanel: () => set((st) => ({ openPanels: st.openPanels + 1 })),
    closePanel: () => set((st) => ({ openPanels: Math.max(0, st.openPanels - 1) })),

    doBuild: (regionId, infraId) => {
      const { game } = get();
      if (!game) return;
      applyResult(buildInfrastructure(game, regionId, infraId), "Infrastructure online");
    },
    doResearch: (researchId) => {
      const { game } = get();
      if (!game) return;
      applyResult(foundResearch(game, researchId), "Research corporation founded");
    },
    doBill: (billId) => {
      const { game } = get();
      if (!game) return;
      applyResult(passBill(game, billId), "Legislation passed");
    },
    doTrees: (treeId, batches) => {
      const { game } = get();
      if (!game) return;
      applyResult(plantTrees(game, treeId, batches), "Trees planted");
    },
    doCivicBoost: (letter) => {
      const { game } = get();
      if (!game) return;
      const next = applyCivicBoost(game, letter);
      set({
        game: next,
        lastFeedback: {
          title: "Civic action verified",
          message:
            "Your real-world letter was accepted. Stakeholders are listening — momentum surges toward your climate goals.",
          ok: true,
        },
      });
      scheduleSave();
    },
    setCivic: (patch) => {
      const { game } = get();
      if (!game) return;
      set({ game: { ...game, civic: { ...(game.civic ?? {}), ...patch } } });
      scheduleSave();
    },

    clearFeedback: () => set({ lastFeedback: null }),

    save: async () => {
      const { game, meta } = get();
      if (!game) return;
      const newMeta = await persistSave(game, meta);
      if (newMeta.id !== meta.id) set({ meta: newMeta });
    },
  };
});
