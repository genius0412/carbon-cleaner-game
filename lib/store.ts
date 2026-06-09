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
  replaceInfrastructure,
  foundResearch,
  passBill,
  plantTrees,
  applyCivicBoost,
  performStudentAction,
  type ActionResult,
} from "./engine/engine";
import { persistSave, makeGuestCode, makeLocalId, type SaveMeta } from "./saves";
import { nextStoryBeat, type StoryBeat } from "./engine/story";
import { playSound, type SoundName } from "./sound";

interface GameStore {
  game: GameState | null;
  meta: SaveMeta;
  speed: number;
  paused: boolean;
  // number of open panels/modals; >0 => auto-paused
  openPanels: number;
  lastFeedback: { title: string; message: string; ok: boolean } | null;

  // save status (for the manual save button + "last saved" indicator)
  lastSavedAt: number | null; // epoch ms of the last successful persist
  saving: boolean;

  // smooth in-month time flow (0..1 of the current month elapsed)
  monthProgress: number;
  // story
  activeStory: StoryBeat | null;
  civicRequested: boolean;

  // lifecycle
  newGame: (
    character: CharacterType,
    cityName: string,
    opts?: { asGuest?: boolean; userId?: string | null; playerName?: string | null },
  ) => void;
  loadGame: (state: GameState, meta: SaveMeta) => void;
  reset: () => void;

  // clock
  tick: () => void;
  advanceClock: (deltaMs: number) => void;
  setSpeed: (s: number) => void;
  setPaused: (p: boolean) => void;
  togglePause: () => void;
  skipMonth: () => void;
  skipYear: () => void;
  openPanel: () => void;
  closePanel: () => void;

  // story
  resolveStory: (takeAction: boolean) => void;
  clearCivicRequest: () => void;

  // actions
  doBuild: (regionId: string, infraId: string) => void;
  doReplace: (regionId: string, infraId: string) => void;
  doResearch: (researchId: string) => void;
  doBill: (billId: string) => void;
  doTrees: (treeId: string, batches: number) => void;
  doStudentAction: (actionId: string, scale?: number) => void;
  doCivicBoost: (letter: string) => void;
  setCivic: (patch: Partial<NonNullable<GameState["civic"]>>) => void;
  setPlayerName: (name: string) => void;

  clearFeedback: () => void;
  setFeedback: (f: { title: string; message: string; ok: boolean } | null) => void;
  save: () => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useGameStore = create<GameStore>((set, get) => {
  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get().save(), GAME.autosaveDebounceMs);
  };

  const applyResult = (
    res: ActionResult,
    successTitle: string,
    successSound: SoundName = "build",
    opts?: { silentSuccess?: boolean },
  ) => {
    if (!res.ok) {
      playSound("error");
      set({ lastFeedback: { title: "Action blocked", message: res.message, ok: false } });
      return;
    }
    playSound(successSound);
    // Some actions (e.g. tree planting) update silently with no bottom popup.
    set(
      opts?.silentSuccess
        ? { game: res.state }
        : { game: res.state, lastFeedback: { title: successTitle, message: res.message, ok: true } },
    );
    scheduleSave();
  };

  // Migrate older saves that predate newer fields.
  const withDefaults = (state: GameState): GameState => ({
    ...state,
    seenStoryIds: state.seenStoryIds ?? [],
    unlockedFeatures: state.unlockedFeatures ?? [],
    studentActions: state.studentActions ?? [],
    studentActionCarbon: state.studentActionCarbon ?? 0,
  });

  /** Fire a story beat if one is due and none is currently showing. */
  const maybeFireStory = (game: GameState) => {
    if (get().activeStory) return;
    const beat = nextStoryBeat(game, game.seenStoryIds ?? []);
    if (beat) {
      playSound("story");
      set({ activeStory: beat });
    }
  };

  /** Play the win/lose sting when a game ends. */
  const endSound = (status: GameState["status"]) => {
    if (status === "won") playSound("win");
    else if (status === "lost") playSound("lose");
  };

  return {
    game: null,
    meta: {},
    speed: 1,
    paused: false,
    openPanels: 0,
    lastFeedback: null,
    lastSavedAt: null,
    saving: false,
    monthProgress: 0,
    activeStory: null,
    civicRequested: false,

    newGame: (character, cityName, opts) => {
      const game = createInitialState(character, cityName);
      // Seed the display name from the logged-in user's account name (guests
      // leave it unset and can name themselves in-game).
      if (opts?.playerName) game.playerName = opts.playerName;
      // Logged-in users save under their account; otherwise generate a guest
      // resume code (unless an account-less, code-less save is explicitly wanted).
      // every new game gets a stable local id so multiple games can be saved,
      // listed, and resumed offline (in addition to any cloud/guest identity).
      const localId = makeLocalId();
      const meta: SaveMeta = opts?.userId
        ? { userId: opts.userId, localId }
        : opts?.asGuest === false
          ? { localId }
          : { guestCode: makeGuestCode(), localId };
      set({
        game,
        meta,
        paused: false,
        speed: 1,
        openPanels: 0,
        lastFeedback: null,
        monthProgress: 0,
        activeStory: null,
        civicRequested: false,
      });
      scheduleSave();
    },

    loadGame: (state, meta) =>
      set({
        game: withDefaults(state),
        meta,
        // Resume with time flowing right away (matches new games).
        paused: false,
        speed: 1,
        openPanels: 0,
        monthProgress: 0,
        activeStory: null,
        civicRequested: false,
      }),

    reset: () =>
      set({
        game: null,
        meta: {},
        openPanels: 0,
        lastFeedback: null,
        monthProgress: 0,
        activeStory: null,
        civicRequested: false,
      }),

    tick: () => {
      const { game, paused, openPanels, activeStory } = get();
      if (!game || game.status !== "playing") return;
      if (paused || openPanels > 0 || activeStory) return;
      const next = tickMonth(game);
      set({ game: next });
      if (next.status !== "playing") {
        endSound(next.status);
        set({ paused: true });
        get().save();
      } else {
        maybeFireStory(next);
        scheduleSave();
      }
    },

    advanceClock: (deltaMs) => {
      const { game, paused, openPanels, activeStory, speed, monthProgress } = get();
      if (!game || game.status !== "playing") return;
      if (paused || openPanels > 0 || activeStory) return;

      const monthDurationMs = (GAME.realSecondsPerGameMonth * 1000) / speed;
      let p = monthProgress + deltaMs / monthDurationMs;

      if (p < 1) {
        set({ monthProgress: p });
        return;
      }

      // one or more whole months elapsed
      const wholeMonths = Math.floor(p);
      let next = game;
      for (let i = 0; i < wholeMonths && next.status === "playing"; i++) {
        next = tickMonth(next);
      }
      p = next.status === "playing" ? p - wholeMonths : 0;
      set({ game: next, monthProgress: p });

      if (next.status !== "playing") {
        endSound(next.status);
        set({ paused: true });
        get().save();
      } else {
        maybeFireStory(next);
        scheduleSave();
      }
    },

    resolveStory: (takeAction) => {
      const { activeStory, game } = get();
      if (!activeStory || !game) return;
      const seen = game.seenStoryIds.includes(activeStory.id)
        ? game.seenStoryIds
        : [...game.seenStoryIds, activeStory.id];
      // apply any feature unlocks carried by this beat
      const unlocked = [...game.unlockedFeatures];
      for (const f of activeStory.unlocks ?? []) {
        if (!unlocked.includes(f)) unlocked.push(f);
      }
      set({
        game: { ...game, seenStoryIds: seen, unlockedFeatures: unlocked },
        activeStory: null,
        civicRequested: takeAction && activeStory.kind === "civic",
      });
      scheduleSave();
    },

    clearCivicRequest: () => set({ civicRequested: false }),

    setSpeed: (s) => set({ speed: s }),
    setPaused: (p) => set({ paused: p }),
    togglePause: () => set((st) => ({ paused: !st.paused })),

    skipMonth: () => {
      const { game, activeStory } = get();
      if (!game || game.status !== "playing" || activeStory) return;
      const next = tickMonth(game);
      set({
        game: next,
        monthProgress: 0,
        paused: next.status !== "playing" ? true : get().paused,
      });
      if (next.status === "playing") maybeFireStory(next);
      else endSound(next.status);
      scheduleSave();
    },

    skipYear: () => {
      const { game, activeStory } = get();
      if (!game || game.status !== "playing" || activeStory) return;
      let next = game;
      for (let i = 0; i < 12 && next.status === "playing"; i++) {
        next = tickMonth(next);
      }
      set({
        game: next,
        monthProgress: 0,
        paused: next.status !== "playing" ? true : get().paused,
      });
      if (next.status === "playing") maybeFireStory(next);
      else endSound(next.status);
      scheduleSave();
    },

    openPanel: () => set((st) => ({ openPanels: st.openPanels + 1 })),
    closePanel: () => set((st) => ({ openPanels: Math.max(0, st.openPanels - 1) })),

    doBuild: (regionId, infraId) => {
      const { game } = get();
      if (!game) return;
      applyResult(buildInfrastructure(game, regionId, infraId), "Infrastructure online", "build");
    },
    doReplace: (regionId, infraId) => {
      const { game } = get();
      if (!game) return;
      applyResult(replaceInfrastructure(game, regionId, infraId), "Infrastructure replaced", "build");
    },
    doResearch: (researchId) => {
      const { game } = get();
      if (!game) return;
      applyResult(foundResearch(game, researchId), "Research corporation founded", "research");
    },
    doBill: (billId) => {
      const { game } = get();
      if (!game) return;
      applyResult(passBill(game, billId), "Legislation passed", "bill");
    },
    doTrees: (treeId, batches) => {
      const { game } = get();
      if (!game) return;
      // Planting is a quiet, repeatable action: update + sound, but no popup.
      applyResult(plantTrees(game, treeId, batches), "Trees planted", "trees", { silentSuccess: true });
    },
    doStudentAction: (actionId, scale = 1) => {
      const { game } = get();
      if (!game) return;
      // The challenge modal shows the outcome, so suppress the bottom popup on
      // success (errors like cooldown still surface).
      applyResult(performStudentAction(game, actionId, scale), "Action taken", "civic", {
        silentSuccess: true,
      });
    },
    doCivicBoost: (letter) => {
      const { game } = get();
      if (!game) return;
      playSound("civic");
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

    setPlayerName: (name) => {
      const { game } = get();
      if (!game) return;
      set({ game: { ...game, playerName: name.trim() || undefined } });
      scheduleSave();
    },

    clearFeedback: () => set({ lastFeedback: null }),
    setFeedback: (lastFeedback) => set({ lastFeedback }),

    save: async () => {
      const { game, meta } = get();
      if (!game) return;
      set({ saving: true });
      // persistSave writes localStorage synchronously, then does a best-effort
      // cloud upsert. Don't let a slow/stalled cloud write hang the indicator
      // (or the "Save & exit" button) — the local save is already done.
      const persist = (async () => {
        try {
          const newMeta = await persistSave(game, meta);
          if (newMeta.id !== meta.id) set({ meta: newMeta });
        } catch {
          /* local save already succeeded; ignore cloud errors */
        }
      })();
      await Promise.race([
        persist,
        new Promise<void>((resolve) => setTimeout(resolve, 3000)),
      ]);
      set({ saving: false, lastSavedAt: Date.now() });
    },
  };
});
