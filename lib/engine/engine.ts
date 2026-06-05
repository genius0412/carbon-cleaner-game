/**
 * engine.ts
 * Pure simulation core. No React/DOM. Every function takes state and
 * returns a NEW state (immutable-ish) so it is trivially testable.
 *
 * Key metric: carbonGainPerMonth (ppm/mo). Win when effective gain <= 0.
 */

import { GAME, MONTH_NAMES } from "../config/gameConstants";
import type {
  GameState,
  CharacterType,
  InfrastructureDef,
  Region,
} from "./types";
import { buildRegions } from "./regions";
import {
  INFRASTRUCTURE,
  RESEARCH,
  BILLS,
  TREES,
  infraById,
  researchById,
  billById,
} from "./content";

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export function createInitialState(
  characterType: CharacterType,
  cityName: string,
): GameState {
  const mode: "mayor" | "student" =
    characterType === "mayor" ? "mayor" : "student";

  let budget: number = GAME.startingBudget;
  if (characterType === "student_younger")
    budget = GAME.student.youngerStartingBudget;
  else if (characterType === "student_older")
    budget = GAME.student.olderStartingBudget;

  return {
    mode,
    characterType,
    cityName: cityName || `${GAME.stateName} City`,
    year: GAME.startYear,
    month: GAME.startMonth,
    status: "playing",
    carbonPpm: GAME.startingCarbonPpm,
    carbonGainPerMonth: GAME.startingCarbonGainPerMonth,
    support: GAME.startingSupport,
    budget,
    regions: buildRegions(),
    builtInfra: [],
    completedResearch: [],
    activeResearch: [],
    passedBills: [],
    trees: [],
    tookNegativeActionThisMonth: false,
    log: [],
    seenStoryIds: [],
    unlockedFeatures: [],
    civic: characterType === "mayor" ? undefined : {},
    finishedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatYearMonth(state: GameState): string {
  return `${MONTH_NAMES[state.month - 1]} ${state.year}`;
}

export function clampSupport(s: number): number {
  return Math.max(GAME.supportMin, Math.min(GAME.supportMax, s));
}

/**
 * Effective carbon delta for a built infrastructure, accounting for terrain
 * and any research efficiency boosts that retroactively apply.
 */
export function effectiveInfraDelta(
  def: InfrastructureDef,
  region: Region,
  completedResearch: string[],
): number {
  let delta = def.carbonDelta;

  // terrain modifier
  if (def.favoredTerrain.includes(region.terrain)) delta *= GAME.terrainBonus;
  else delta *= GAME.terrainPenalty;

  // research efficiency boosts (each applicable, completed research = +25%)
  for (const rid of def.boostedBy) {
    if (completedResearch.includes(rid)) delta *= 1.25;
  }
  return delta;
}

/** How much extra carbon-reduction a completed research adds to existing infra. */
export function researchBoostSummary(
  state: GameState,
  researchId: string,
): { count: number; addedReductionPerMonth: number } {
  let count = 0;
  let added = 0;
  for (const b of state.builtInfra) {
    const def = infraById(b.infraId);
    const region = state.regions.find((r) => r.id === b.regionId);
    if (!def || !region) continue;
    if (def.boostedBy.includes(researchId)) {
      count++;
      const before = effectiveInfraDelta(def, region, state.completedResearch);
      const after = effectiveInfraDelta(def, region, [
        ...state.completedResearch,
        researchId,
      ]);
      added += before - after; // positive number = extra reduction
    }
  }
  return { count, addedReductionPerMonth: added };
}

/**
 * Recompute base carbonGainPerMonth from scratch given all built infra,
 * passed bills, trees and completed research. This keeps the gauge correct
 * even after retroactive research boosts.
 */
export function recomputeCarbonGain(state: GameState): number {
  let gain = GAME.startingCarbonGainPerMonth;

  // infrastructure
  for (const b of state.builtInfra) {
    const def = infraById(b.infraId);
    const region = state.regions.find((r) => r.id === b.regionId);
    if (!def || !region) continue;
    gain += effectiveInfraDelta(def, region, state.completedResearch);
  }

  // bills
  for (const bid of state.passedBills) {
    const bill = billById(bid);
    if (bill) gain += bill.carbonDelta;
  }

  // trees: convert kg CO2/yr -> a tiny ppm/mo gameplay effect.
  // Scale factor is a gameplay constant; tree CO2 figures are data blanks.
  for (const t of state.trees) {
    const def = TREES.find((x) => x.id === t.defId);
    if (!def) continue;
    const treesTotal = t.batches * GAME.treesPerBatch;
    const kgPerYear = treesTotal * def.co2PerYearPerTree;
    // 1,000,000 kg/yr ~= 0.001 ppm/mo reduction (balance constant)
    gain -= (kgPerYear / 1_000_000) * 0.001;
  }

  // civic action boost (student)
  if (state.civic?.boostApplied) {
    gain -= GAME.student.civicActionCarbonBoost;
  }

  return gain;
}

/**
 * Recurring net budget change per month: the yearly grant amortized across 12
 * months, minus the monthly operating cost of every research project currently
 * in progress (paralysis raises those costs). Positive = gaining money.
 */
export function monthlyNetBudget(state: GameState): number {
  let net = GAME.yearlyBudgetGrant / 12;
  for (const ar of state.activeResearch) {
    const def = researchById(ar.defId);
    if (!def) continue;
    let monthly = def.monthlyCost;
    if (state.support < GAME.supportParalysisBelow)
      monthly *= GAME.paralysisCostMultiplier;
    net -= monthly;
  }
  return net;
}

/** Effective gain including dynamic support penalties (used for win/lose & display). */
export function effectiveCarbonGain(state: GameState): number {
  let gain = state.carbonGainPerMonth;
  if (state.support < GAME.supportUnderminedBelow) {
    gain += GAME.underminePenaltyPerMonth;
  }
  return gain;
}

// ---------------------------------------------------------------------------
// Time advance (one in-game month)
// ---------------------------------------------------------------------------

export function tickMonth(prev: GameState): GameState {
  if (prev.status !== "playing") return prev;

  const state: GameState = {
    ...prev,
    regions: prev.regions.map((r) => ({ ...r })),
    activeResearch: prev.activeResearch.map((a) => ({ ...a })),
    log: [...prev.log],
  };

  // 1) advance research, pay monthly operating costs, complete projects
  const stillActive: typeof state.activeResearch = [];
  for (const ar of state.activeResearch) {
    const def = researchById(ar.defId);
    if (!def) continue;
    // monthly operating cost (paralysis raises costs)
    let monthly = def.monthlyCost;
    if (state.support < GAME.supportParalysisBelow)
      monthly *= GAME.paralysisCostMultiplier;
    state.budget -= monthly;

    const remaining = ar.monthsRemaining - 1;
    if (remaining <= 0) {
      state.completedResearch = [...state.completedResearch, ar.defId];
      state.log.push({
        yearMonth: formatYearMonth(state),
        type: "research",
        label: `Research complete: ${def.name}`,
        detail: `Unlocked ${infraById(def.unlocksInfraId)?.name ?? def.unlocksInfraId}.`,
      });
    } else {
      stillActive.push({ ...ar, monthsRemaining: remaining });
    }
  }
  state.activeResearch = stillActive;

  // 2) passive support recovery (only if no negative action this month)
  if (!state.tookNegativeActionThisMonth && state.support < GAME.passiveRecoveryCap) {
    state.support = Math.min(
      GAME.passiveRecoveryCap,
      state.support + GAME.passiveSupportRecoveryPerMonth,
    );
  }
  // slow-recovery bills nudge support up gently
  for (const bid of state.passedBills) {
    const bill = billById(bid);
    if (bill?.slowRecovery && state.support < GAME.supportMax) {
      state.support = clampSupport(state.support + 0.3);
    }
  }

  // 3) carbon update — recompute base gain, then apply effective gain to ppm
  state.carbonGainPerMonth = recomputeCarbonGain(state);
  const effGain = effectiveCarbonGain(state);
  state.carbonPpm = Math.max(0, state.carbonPpm + effGain);

  // 4) advance the calendar
  let month = state.month + 1;
  let year = state.year;
  if (month > 12) {
    month = 1;
    year += 1;
    // yearly budget grant at the start of each in-game year
    state.budget += GAME.yearlyBudgetGrant;
  }
  state.month = month;
  state.year = year;
  state.tookNegativeActionThisMonth = false;

  // 5) win / lose checks
  state.status = evaluateStatus(state);
  if (state.status !== "playing" && !state.finishedAt) {
    state.finishedAt = new Date().toISOString();
  }

  return state;
}

export function evaluateStatus(state: GameState): GameState["status"] {
  // lose: carbon hits failure threshold
  if (state.carbonPpm >= GAME.failureCarbonPpm) return "lost";
  // win: effective gain at or below net-zero, before Jan 2101
  if (effectiveCarbonGain(state) <= GAME.netZeroThreshold) {
    // require minimal governing function (support not in total paralysis)
    if (state.support >= GAME.supportParalysisBelow) return "won";
  }
  // lose: reached Jan 2101 without net zero
  if (state.year > GAME.endYear) return "lost";
  return "playing";
}

// ---------------------------------------------------------------------------
// Player actions (each returns { state, ok, message })
// ---------------------------------------------------------------------------

export interface ActionResult {
  state: GameState;
  ok: boolean;
  message: string;
}

export function buildInfrastructure(
  prev: GameState,
  regionId: string,
  infraId: string,
): ActionResult {
  const region = prev.regions.find((r) => r.id === regionId);
  const def = infraById(infraId);
  if (!region || !def)
    return { state: prev, ok: false, message: "Unknown region or infrastructure." };
  if (region.builtInfraId)
    return { state: prev, ok: false, message: "This region already has infrastructure. One per region." };
  if (def.requiresResearch && !prev.completedResearch.includes(def.requiresResearch))
    return { state: prev, ok: false, message: "Requires completed research first." };

  let cost = def.cost;
  if (prev.support < GAME.supportParalysisBelow) cost *= GAME.paralysisCostMultiplier;
  if (prev.budget < cost)
    return { state: prev, ok: false, message: "Not enough budget." };

  const regions = prev.regions.map((r) =>
    r.id === regionId ? { ...r, builtInfraId: infraId } : r,
  );
  const state: GameState = {
    ...prev,
    regions,
    budget: prev.budget - cost,
    builtInfra: [...prev.builtInfra, { infraId, regionId }],
    support: clampSupport(prev.support + def.supportDelta),
    tookNegativeActionThisMonth:
      prev.tookNegativeActionThisMonth || def.supportDelta < 0,
    log: [
      ...prev.log,
      {
        yearMonth: formatYearMonth(prev),
        type: "infrastructure",
        label: `Built ${def.name}`,
        detail: `In ${region.name} (${region.terrain}). Cost $${cost.toLocaleString()}.`,
      },
    ],
  };
  state.carbonGainPerMonth = recomputeCarbonGain(state);
  state.status = evaluateStatus(state);
  if (state.status !== "playing" && !state.finishedAt)
    state.finishedAt = new Date().toISOString();
  return { state, ok: true, message: def.feedback };
}

/**
 * Replace the infrastructure already built in a region with a different one.
 * Charges the new build's cost (no refund of the old), reverses the old
 * support delta and applies the new one, and recomputes carbon output.
 */
export function replaceInfrastructure(
  prev: GameState,
  regionId: string,
  infraId: string,
): ActionResult {
  const region = prev.regions.find((r) => r.id === regionId);
  const def = infraById(infraId);
  if (!region || !def)
    return { state: prev, ok: false, message: "Unknown region or infrastructure." };
  if (!region.builtInfraId)
    return { state: prev, ok: false, message: "Nothing to replace here yet." };
  if (region.builtInfraId === infraId)
    return { state: prev, ok: false, message: "That's already built here." };
  if (def.requiresResearch && !prev.completedResearch.includes(def.requiresResearch))
    return { state: prev, ok: false, message: "Requires completed research first." };

  const oldDef = infraById(region.builtInfraId);

  let cost = def.cost;
  if (prev.support < GAME.supportParalysisBelow) cost *= GAME.paralysisCostMultiplier;
  if (prev.budget < cost)
    return { state: prev, ok: false, message: "Not enough budget." };

  const regions = prev.regions.map((r) =>
    r.id === regionId ? { ...r, builtInfraId: infraId } : r,
  );
  // swap the built-infra record for this region
  const builtInfra = prev.builtInfra
    .filter((b) => b.regionId !== regionId)
    .concat({ infraId, regionId });

  // reverse the previous support bump, then apply the new one
  const supportAfter = clampSupport(
    prev.support - (oldDef?.supportDelta ?? 0) + def.supportDelta,
  );

  const state: GameState = {
    ...prev,
    regions,
    budget: prev.budget - cost,
    builtInfra,
    support: supportAfter,
    tookNegativeActionThisMonth:
      prev.tookNegativeActionThisMonth || def.supportDelta < 0,
    log: [
      ...prev.log,
      {
        yearMonth: formatYearMonth(prev),
        type: "infrastructure",
        label: `Replaced ${oldDef?.name ?? "infrastructure"} with ${def.name}`,
        detail: `In ${region.name} (${region.terrain}). Cost $${cost.toLocaleString()}.`,
      },
    ],
  };
  state.carbonGainPerMonth = recomputeCarbonGain(state);
  state.status = evaluateStatus(state);
  if (state.status !== "playing" && !state.finishedAt)
    state.finishedAt = new Date().toISOString();
  return { state, ok: true, message: def.feedback };
}

export function foundResearch(prev: GameState, researchId: string): ActionResult {
  const def = researchById(researchId);
  if (!def) return { state: prev, ok: false, message: "Unknown research." };
  if (prev.completedResearch.includes(researchId))
    return { state: prev, ok: false, message: "Already completed." };
  if (prev.activeResearch.some((a) => a.defId === researchId))
    return { state: prev, ok: false, message: "Already in progress." };
  if (prev.support < GAME.supportParalysisBelow)
    return { state: prev, ok: false, message: "Support too low — research has stalled." };
  if (prev.budget < def.foundingCost)
    return { state: prev, ok: false, message: "Not enough budget to found this corporation." };

  const state: GameState = {
    ...prev,
    budget: prev.budget - def.foundingCost,
    activeResearch: [
      ...prev.activeResearch,
      { defId: researchId, monthsRemaining: def.timelineMonths },
    ],
    log: [
      ...prev.log,
      {
        yearMonth: formatYearMonth(prev),
        type: "research",
        label: `Founded ${def.name}`,
        detail: `${def.timelineMonths} months, $${def.monthlyCost.toLocaleString()}/mo operating.`,
      },
    ],
  };
  return {
    state,
    ok: true,
    message: `${def.name} founded. It will deliver in ${def.timelineMonths} months. Operating cost is $${def.monthlyCost.toLocaleString()}/mo.`,
  };
}

export function passBill(prev: GameState, billId: string): ActionResult {
  const bill = billById(billId);
  if (!bill) return { state: prev, ok: false, message: "Unknown bill." };
  if (prev.passedBills.includes(billId))
    return { state: prev, ok: false, message: "Already passed." };
  if (bill.requiresResearch && !prev.completedResearch.includes(bill.requiresResearch))
    return { state: prev, ok: false, message: "Requires completed research first." };
  if (prev.support < GAME.supportBillsBlockedBelow)
    return { state: prev, ok: false, message: "Public support is too low to pass legislation (need ≥ 50%)." };

  const state: GameState = {
    ...prev,
    passedBills: [...prev.passedBills, billId],
    support: clampSupport(prev.support + bill.supportImpact),
    budget: prev.budget + (bill.budgetDelta ?? 0),
    tookNegativeActionThisMonth:
      prev.tookNegativeActionThisMonth || bill.supportImpact < 0,
    log: [
      ...prev.log,
      {
        yearMonth: formatYearMonth(prev),
        type: "bill",
        label: `Passed ${bill.name}`,
        detail: `Support ${bill.supportImpact}%${bill.budgetDelta ? `, +$${bill.budgetDelta.toLocaleString()}` : ""}.`,
      },
    ],
  };
  state.carbonGainPerMonth = recomputeCarbonGain(state);
  state.status = evaluateStatus(state);
  if (state.status !== "playing" && !state.finishedAt)
    state.finishedAt = new Date().toISOString();
  return { state, ok: true, message: bill.feedback };
}

export function plantTrees(
  prev: GameState,
  treeDefId: string,
  batches: number,
): ActionResult {
  const def = TREES.find((t) => t.id === treeDefId);
  if (!def || batches < 1)
    return { state: prev, ok: false, message: "Choose a species and at least one batch." };
  const cost = def.costPerBatch * batches;
  if (prev.budget < cost)
    return { state: prev, ok: false, message: "Not enough budget." };

  const existing = prev.trees.find((t) => t.defId === treeDefId);
  const trees = existing
    ? prev.trees.map((t) =>
        t.defId === treeDefId ? { ...t, batches: t.batches + batches } : t,
      )
    : [...prev.trees, { defId: treeDefId, batches }];

  const totalTrees = batches * GAME.treesPerBatch;
  const state: GameState = {
    ...prev,
    budget: prev.budget - cost,
    trees,
    support: clampSupport(prev.support + 1),
    log: [
      ...prev.log,
      {
        yearMonth: formatYearMonth(prev),
        type: "trees",
        label: `Planted ${totalTrees} ${def.name} trees`,
        detail: `Cost $${cost.toLocaleString()}.`,
      },
    ],
  };
  state.carbonGainPerMonth = recomputeCarbonGain(state);
  return {
    state,
    ok: true,
    message: `${totalTrees} ${def.name} trees planted. They'll keep pulling carbon down for decades — a slow but beloved offset.`,
  };
}

/** Apply the civic-action boost once verified proof is accepted. */
export function applyCivicBoost(prev: GameState, letter: string): GameState {
  const civic = { ...(prev.civic ?? {}), letter, proofUploaded: true, proofPassedCheck: true, boostApplied: true };
  const state: GameState = {
    ...prev,
    civic,
    support: clampSupport(prev.support + GAME.student.civicActionSupportBoost),
    log: [
      ...prev.log,
      {
        yearMonth: formatYearMonth(prev),
        type: "civic",
        label: "Submitted real-world civic action",
        detail: "Verified email to a representative — major momentum boost.",
      },
    ],
  };
  state.carbonGainPerMonth = recomputeCarbonGain(state);
  state.status = evaluateStatus(state);
  if (state.status !== "playing" && !state.finishedAt)
    state.finishedAt = new Date().toISOString();
  return state;
}

/** Infrastructure available to the current character (students are limited). */
export function availableInfrastructure(state: GameState): InfrastructureDef[] {
  if (state.mode === "mayor") return INFRASTRUCTURE;
  // students: only small-scale local actions
  return INFRASTRUCTURE.filter((i) =>
    ["led_streetlights", "recycling", "tree_initiative"].includes(i.id),
  );
}

export function canFoundResearch(state: GameState): boolean {
  return state.mode === "mayor";
}

export function canPassBills(state: GameState): boolean {
  return state.mode === "mayor";
}

export { INFRASTRUCTURE, RESEARCH, BILLS, TREES };
