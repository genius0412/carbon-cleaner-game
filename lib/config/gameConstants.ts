/**
 * gameConstants.ts
 * ------------------------------------------------------------------
 * ALL tunable GAME CONSTANTS live here. These are deliberately
 * fictional / balance numbers (NOT real-world data). Tweak freely to
 * rebalance the game. Real-world facts/costs are NEVER here, those
 * are DATA BLANKS (see lib/config/dataBlanks.ts).
 * ------------------------------------------------------------------
 */

export const GAME = {
  // --- World framing (fictional) ---
  stateName: "Verdana",
  population: 100_000,

  // --- Time ---
  startYear: 2026,
  startMonth: 1, // January
  endYear: 2050, // last playable year (game over Jan 2051)
  // Real time -> game time. 1 in-game month per 30 real seconds at 1x.
  realSecondsPerGameMonth: 30,
  speedOptions: [1, 1.5, 2.5] as const,

  // --- Carbon (ppm) ---
  startingCarbonPpm: 430,
  failureCarbonPpm: 600,
  // The county starts emitting: positive carbon gain per month (ppm/mo).
  // This is a gameplay value, not a real measurement.
  startingCarbonGainPerMonth: 0.045,
  // Win when carbon gain per month <= this.
  netZeroThreshold: 0.0,

  // --- Population support (%) ---
  startingSupport: 65,
  supportMin: 0,
  supportMax: 100,
  // Passive recovery when no negative action taken this month.
  passiveSupportRecoveryPerMonth: 0.5,
  passiveRecoveryCap: 80, // cannot passively rise above this
  // Thresholds for governance effects.
  supportBillsBlockedBelow: 50, // bills cannot pass under this
  supportUnderminedBelow: 30, // residents undermine progress
  supportParalysisBelow: 10, // near total paralysis
  // Penalty added to carbon gain/mo when support < underminedBelow.
  underminePenaltyPerMonth: 0.004,
  // Upgrade cost multiplier when support < paralysisBelow.
  paralysisCostMultiplier: 1.5,

  // --- Budget ($) ---
  startingBudget: 2_000_000,
  yearlyBudgetGrant: 1_000_000, // disbursed monthly (1/12 each in-game month)

  // --- Student mode adjustments ---
  student: {
    // Small budgets: students act mainly through advocacy + civic action, but
    // older students can still afford a couple of small-scale local builds
    // (e.g. the $90k tree initiative).
    youngerStartingBudget: 60_000,
    olderStartingBudget: 200_000,
    // Students govern a much smaller purse: 10% of the mayor's recurring grant,
    // i.e. $100k per in-game year (disbursed monthly).
    yearlyBudgetGrant: 100_000,
    // Big progress boost (reduction to carbon gain/mo) for submitting
    // verified real-world civic action proof.
    civicActionCarbonBoost: 0.012,
    civicActionSupportBoost: 8,
  },

  // --- Terrain efficiency modifiers ---
  // Multiplier applied to an infrastructure's carbon delta when built on
  // matching/mismatching terrain (gameplay balance, not real data).
  terrainBonus: 1.25,
  terrainPenalty: 0.8,

  // --- Tree planting ---
  treesPerBatch: 10,

  // --- Persistence ---
  autosaveDebounceMs: 4000,
} as const;

export type Speed = (typeof GAME.speedOptions)[number];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
