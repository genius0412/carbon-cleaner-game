/**
 * Core simulation types. The engine is pure: it operates on GameState
 * and returns new GameState, with no React/DOM dependencies so it can be
 * unit-tested in isolation.
 */

export type CharacterType = "mayor" | "student_older" | "student_younger";

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
  type: "infrastructure" | "research" | "bill" | "trees" | "civic";
  label: string;
  detail: string;
}

export interface GameState {
  // identity
  mode: "mayor" | "student";
  characterType: CharacterType;
  cityName: string;

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

  // bookkeeping
  tookNegativeActionThisMonth: boolean;
  log: ActionLogEntry[];

  /** Story beats already shown (so they don't replay across reloads). */
  seenStoryIds: string[];

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
