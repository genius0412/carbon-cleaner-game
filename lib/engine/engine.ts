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
  StudentActionDef,
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
import { studentActionById, STUDENT_ACTIONS } from "./studentActions";

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
    createdAt: new Date().toISOString(),
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
    studentActions: [],
    studentActionCarbon: 0,
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

  // grassroots student actions (cumulative, already stored as a <= 0 sum)
  gain += state.studentActionCarbon ?? 0;

  return gain;
}

/** Absolute month index for cooldown math: year*12 + (month-1). */
export function monthIndex(state: GameState): number {
  return state.year * 12 + (state.month - 1);
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

  // 1b) municipal budget grant, disbursed every month (1/12 of the yearly grant)
  state.budget += GAME.yearlyBudgetGrant / 12;

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

  // 3) carbon update, recompute base gain, then apply effective gain to ppm
  state.carbonGainPerMonth = recomputeCarbonGain(state);
  const effGain = effectiveCarbonGain(state);
  state.carbonPpm = Math.max(0, state.carbonPpm + effGain);

  // 4) advance the calendar
  let month = state.month + 1;
  let year = state.year;
  if (month > 12) {
    month = 1;
    year += 1;
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
  // win: effective gain at or below net-zero, before Jan 2051
  if (effectiveCarbonGain(state) <= GAME.netZeroThreshold) {
    // require minimal governing function (support not in total paralysis)
    if (state.support >= GAME.supportParalysisBelow) return "won";
  }
  // lose: reached Jan 2051 without net zero
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
    return { state: prev, ok: false, message: "Support too low, research has stalled." };
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
    message: `${totalTrees} ${def.name} trees planted. They'll keep pulling carbon down for decades, a slow but beloved offset.`,
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
        detail: "Verified email to a representative, major momentum boost.",
      },
    ],
  };
  state.carbonGainPerMonth = recomputeCarbonGain(state);
  state.status = evaluateStatus(state);
  if (state.status !== "playing" && !state.finishedAt)
    state.finishedAt = new Date().toISOString();
  return state;
}

/**
 * Availability + remaining cooldown for a student action, so the UI can show
 * "Done", "Available in N months", or a live button without duplicating rules.
 */
export interface StudentActionStatus {
  count: number;
  /** True if it can be taken right now (ignoring budget). */
  available: boolean;
  /** Months until it can be repeated (0 if available now). */
  cooldownLeft: number;
  /** One-time action that has already been used. */
  doneOnce: boolean;
  /** True when a prerequisite action hasn't been completed yet. */
  locked: boolean;
  /** Names of prerequisite actions still missing (for the UI hint). */
  missingRequirements: string[];
  /** Extra effectiveness from foundational actions, e.g. 0.25 = +25%. */
  synergyBonus: number;
}

/** Has this student action been completed at least once? */
function studentActionDone(state: GameState, id: string): boolean {
  return (state.studentActions ?? []).some((r) => r.id === id && r.count >= 1);
}

/** Prerequisite action names not yet completed for this def. */
function missingRequirementNames(state: GameState, def: StudentActionDef): string[] {
  return (def.requires ?? [])
    .filter((reqId) => !studentActionDone(state, reqId))
    .map((reqId) => studentActionById(reqId)?.name ?? reqId);
}

/**
 * Combined effectiveness multiplier from every completed "foundational" action
 * (e.g. the Climate Club), excluding the action being performed so it can't
 * boost itself. 1.0 when nothing foundational has been done yet.
 */
function synergyMultiplier(state: GameState, exceptId: string): number {
  let mult = 1;
  for (const a of STUDENT_ACTIONS) {
    if (a.id === exceptId || !a.synergyBoost) continue;
    if (studentActionDone(state, a.id)) mult += a.synergyBoost;
  }
  return mult;
}

export function studentActionStatus(
  state: GameState,
  actionId: string,
): StudentActionStatus {
  const def = studentActionById(actionId);
  const rec = (state.studentActions ?? []).find((r) => r.id === actionId);
  const count = rec?.count ?? 0;
  if (!def)
    return {
      count,
      available: false,
      cooldownLeft: 0,
      doneOnce: false,
      locked: false,
      missingRequirements: [],
      synergyBonus: 0,
    };

  const doneOnce = !def.repeatable && count >= 1;
  const missingRequirements = missingRequirementNames(state, def);
  const locked = missingRequirements.length > 0;
  let cooldownLeft = 0;
  if (rec && def.cooldownMonths > 0) {
    cooldownLeft = Math.max(0, rec.lastMonthIndex + def.cooldownMonths - monthIndex(state));
  }
  return {
    count,
    available: !doneOnce && !locked && cooldownLeft === 0,
    cooldownLeft,
    doneOnce,
    locked,
    missingRequirements,
    synergyBonus: synergyMultiplier(state, actionId) - 1,
  };
}

/**
 * Take a grassroots student action (advocacy, school project, fundraiser, …).
 * `scale` (0..1) is how well the player did the action's challenge, it scales
 * the rewards (carbon/support/budget), never the cost. Defaults to full.
 */
export function performStudentAction(
  prev: GameState,
  actionId: string,
  scale = 1,
): ActionResult {
  const def = studentActionById(actionId);
  if (!def) return { state: prev, ok: false, message: "Unknown action." };

  const records = prev.studentActions ?? [];
  const rec = records.find((r) => r.id === actionId);
  const count = rec?.count ?? 0;

  if (!def.repeatable && count >= 1)
    return { state: prev, ok: false, message: "You've already done this one." };

  // Locked until its prerequisite actions are done (e.g. found a club first).
  const missing = missingRequirementNames(prev, def);
  if (missing.length > 0)
    return {
      state: prev,
      ok: false,
      message: `Do this first: ${missing.join(", ")}.`,
    };

  const now = monthIndex(prev);
  if (rec && def.cooldownMonths > 0) {
    const wait = rec.lastMonthIndex + def.cooldownMonths - now;
    if (wait > 0)
      return {
        state: prev,
        ok: false,
        message: `Give it time, you can do this again in ${wait} month${wait > 1 ? "s" : ""}.`,
      };
  }

  if (def.cost > 0 && prev.budget < def.cost)
    return { state: prev, ok: false, message: "Not enough budget for materials." };

  // Diminishing returns on repeats keep spamming one action from winning;
  // challenge performance (scale) further tunes this run's payoff; foundational
  // actions already taken (a club) make this one land harder via synergy.
  const perf = Math.max(0, Math.min(1, scale));
  const synergy = synergyMultiplier(prev, actionId);
  const factor = Math.pow(def.diminishing, count) * perf * synergy;
  const carbon = def.carbonDelta * factor;
  const support = def.supportDelta * factor;
  const budgetGain = (def.budgetDelta ?? 0) * factor;

  const studentActions = rec
    ? records.map((r) =>
        r.id === actionId ? { ...r, count: count + 1, lastMonthIndex: now } : r,
      )
    : [...records, { id: actionId, count: 1, lastMonthIndex: now }];

  const detailBits: string[] = [];
  if (carbon < 0) detailBits.push(`carbon −${Math.abs(carbon).toFixed(4)} ppm/mo`);
  if (support) detailBits.push(`support ${support > 0 ? "+" : ""}${support.toFixed(1)}%`);
  if (def.cost > 0) detailBits.push(`cost $${def.cost.toLocaleString()}`);
  if (budgetGain) detailBits.push(`+$${Math.round(budgetGain).toLocaleString()} raised`);

  const state: GameState = {
    ...prev,
    budget: prev.budget - def.cost + budgetGain,
    support: clampSupport(prev.support + support),
    studentActions,
    studentActionCarbon: (prev.studentActionCarbon ?? 0) + carbon,
    tookNegativeActionThisMonth: prev.tookNegativeActionThisMonth || support < 0,
    log: [
      ...prev.log,
      {
        yearMonth: formatYearMonth(prev),
        type: "student",
        label: def.name,
        detail: detailBits.join(", ") || def.description,
      },
    ],
  };
  state.carbonGainPerMonth = recomputeCarbonGain(state);
  state.status = evaluateStatus(state);
  if (state.status !== "playing" && !state.finishedAt)
    state.finishedAt = new Date().toISOString();
  return { state, ok: true, message: def.feedback };
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
