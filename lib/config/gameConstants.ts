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
  // This is a gameplay value, not a real measurement. The mayor answers for
  // the whole county's emissions (and has the tools to match); students fight
  // a smaller share they can plausibly move through grassroots action.
  startingCarbonGainPerMonth: 0.065,
  // Net-zero is carbon gain per month <= this...
  netZeroThreshold: 0.0,
  // ...held for this many consecutive months to win. A single lucky month
  // isn't a cured county; this also stops day-one insta-wins.
  netZeroHoldMonths: 12,

  // --- Population support (%) ---
  startingSupport: 65,
  // The mayor starts mid-term with thinner approval, so buying unpopular things
  // carelessly can cost the next election.
  mayorStartingSupport: 55,
  supportMin: 0,
  supportMax: 100,
  // Passive recovery when no negative action taken this month. ~3%/year so
  // idling/skipping no longer floods support back up.
  passiveSupportRecoveryPerMonth: 0.25,
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
    // Students tackle a smaller, school-and-neighbourhood share of emissions.
    // Tuned so a student who works the action menu steadily, sends the civic
    // letter, and plants some trees reaches net-zero with room to spare.
    startingCarbonGainPerMonth: 0.04,
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

  // --- Elections (mayor only) ---
  // The mayor governs on a 4-year term and starts mid-term: the first re-election
  // is in 2028, then every 4 years (2032, 2036, ...). If approval is below
  // minSupport at the January of an election year, the mayor is voted out (loss).
  election: {
    firstYear: 2028,
    termYears: 4,
    minSupport: 50, // must be at/above this to win re-election
    warnSupport: 40, // drop to/below this and a "win back support" warning fires
  },

  // --- Facility upgrades ---
  // Existing infrastructure can be upgraded to deepen its carbon capture. Each
  // level multiplies the facility's effective reduction by its level number
  // (L2 = 2x, L3 = 3x). Upgrading is costly (escalates with level) but pays off.
  upgrade: {
    maxLevel: 3,
    // Cost to go from level L -> L+1 = base build cost * costFactor * L.
    costFactor: 1.5,
    // Small approval bump per upgrade (visible civic improvement).
    supportPerLevel: 1,
  },

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
