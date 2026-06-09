/**
 * Core simulation types. The engine is pure: it operates on GameState
 * and returns new GameState, with no React/DOM dependencies so it can be
 * unit-tested in isolation.
 */

export type CharacterType = "mayor" | "student_older" | "student_younger";

/** Features that unlock through the storyline ("build" is always available). */
export type FeatureKey = "trees" | "research" | "bills" | "civic";

export type GameStatus = "playing" | "won" | "lost";

export type Terrain =
  | "mountains"
  | "forest"
  | "plains"
  | "coast"
  | "urban"
  | "farmland";

/** A clickable region on the map. One infrastructure per region (hard rule). */
export interface Region {
  id: string;
  name: string;
  terrain: Terrain;
  /** SVG polygon points / position for the cartoon map. */
  cx: number;
  cy: number;
  /** Path "d" for the region blob shape. */
  path: string;
  /** Isometric grid cell (col, row) on the 5x3 city-builder map. */
  gx: number;
  gy: number;
  /** id of the InfrastructureDef built here, or null. */
  builtInfraId: string | null;
}

/** Carbon delta is ppm/month (negative = removing carbon). */
export interface InfrastructureDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  carbonDelta: number; // ppm/mo, usually negative
  supportDelta: number; // immediate % change
  feedback: string;
  /** terrains where this gets the efficiency bonus. */
  favoredTerrain: Terrain[];
  /** research id required to unlock, or null if available from start. */
  requiresResearch: string | null;
  /** which research ids retroactively boost this infra's output. */
  boostedBy: string[];
  /** data-blank ids referenced in the description/numbers. */
  dataBlanks: number[];
  icon: string; // emoji/icon key
}

export interface ResearchDef {
  id: string;
  name: string;
  foundingCost: number;
  monthlyCost: number;
  timelineMonths: number;
  unlocksInfraId: string;
  description: string;
}

/** Active research project in progress. */
export interface ActiveResearch {
  defId: string;
  monthsRemaining: number;
}

export interface BillDef {
  id: string;
  name: string;
  description: string;
  supportRequirement: number; // must be >= this to pass
  carbonDelta: number; // ppm/mo
  supportImpact: number; // immediate % (usually negative)
  budgetDelta?: number; // e.g. carbon tax adds funds
  /** recovers support slowly over time after passing. */
  slowRecovery?: boolean;
  requiresResearch?: string | null;
  feedback: string;
  dataBlanks: number[];
}

export interface TreeDef {
  id: string;
  name: string;
  costPerBatch: number; // cost for a batch of 10
  co2PerYearPerTree: number; // gameplay default; real value is a data blank
  dataBlanks: number[];
}

/** A logged action for the timeline / final report. */
export interface ActionLogEntry {
  yearMonth: string; // "March 2031"
  type: "infrastructure" | "research" | "bill" | "trees" | "civic" | "student";
  label: string;
  detail: string;
}

/** Grassroots actions a student can realistically take. */
export type StudentActionCategory =
  | "awareness"
  | "school"
  | "lifestyle"
  | "community"
  | "fundraising";

export interface StudentActionDef {
  id: string;
  name: string;
  icon: string;
  category: StudentActionCategory;
  description: string;
  /** Budget spent on materials (often 0 — students mostly spend effort). */
  cost: number;
  /** Budget raised (fundraisers). */
  budgetDelta?: number;
  /** ppm/mo added to the base carbon gain (negative = removes carbon). */
  carbonDelta: number;
  /** Immediate support change (%). */
  supportDelta: number;
  /** Can it be done more than once? */
  repeatable: boolean;
  /** Minimum in-game months between repeats (0 = none). */
  cooldownMonths: number;
  /** Each repeat multiplies effects by diminishing^count (1 = no decay). */
  diminishing: number;
  /** Action ids that must be completed (count ≥ 1) before this one unlocks. */
  requires?: string[];
  /**
   * Foundational boost: while this action has been done (count ≥ 1), the
   * carbon/support/funds from every OTHER student action are multiplied by
   * (1 + synergyBoost). Founding a club makes everything else more effective.
   */
  synergyBoost?: number;
  /** Flavor shown after taking the action. */
  feedback: string;
}

/** Per-action progress record for student actions. */
export interface StudentActionRecord {
  id: string;
  count: number;
  /** Absolute month index (year*12 + month-1) of the last time it was done. */
  lastMonthIndex: number;
}

export interface GameState {
  // identity
  mode: "mayor" | "student";
  characterType: CharacterType;
  cityName: string;
  /** Friendly display name for the player, shown on leaderboards and to
   *  teachers. Settable in-game (guests included); seeded from a logged-in
   *  user's account display name. Falls back to cityName when unset. */
  playerName?: string;
  /** Real-world ISO timestamp when the game was created (anti-cheat: a game
   *  can only join a class that existed at or before this time). */
  createdAt?: string;

  // time
  year: number;
  month: number; // 1-12
  status: GameStatus;

  // gauges
  carbonPpm: number;
  carbonGainPerMonth: number; // base, before dynamic penalties
  support: number;
  budget: number;

  // world
  regions: Region[];
  builtInfra: { infraId: string; regionId: string }[];
  completedResearch: string[];
  activeResearch: ActiveResearch[];
  passedBills: string[];
  trees: { defId: string; batches: number }[];

  /** Grassroots student actions taken, with repeat counts + cooldown tracking. */
  studentActions: StudentActionRecord[];
  /** Cumulative ppm/mo reduction from student actions (<= 0). */
  studentActionCarbon: number;

  // bookkeeping
  tookNegativeActionThisMonth: boolean;
  log: ActionLogEntry[];

  /** Story beats already shown (so they don't replay across reloads). */
  seenStoryIds: string[];

  /**
   * Features unlocked through the storyline. "build" is always available;
   * others ("trees", "research", "bills", "civic") unlock via story beats.
   */
  unlockedFeatures: FeatureKey[];

  // civic action (student)
  civic?: {
    representativeTown?: string;
    letter?: string;
    proofUploaded?: boolean;
    proofPassedCheck?: boolean;
    boostApplied?: boolean;
  };

  // meta
  finishedAt?: string | null;
}
