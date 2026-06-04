/**
 * Headless engine smoke test — verifies a Mayor can reach net-zero with a
 * sensible strategy played out over time, and that core invariants hold.
 * Run: npx tsx scripts/sim-test.ts
 */
import {
  createInitialState,
  tickMonth,
  buildInfrastructure,
  foundResearch,
  passBill,
  effectiveCarbonGain,
} from "../lib/engine/engine.ts";
import { INFRASTRUCTURE, RESEARCH, BILLS } from "../lib/engine/content.ts";
import type { GameState } from "../lib/engine/types.ts";

let state = createInitialState("mayor", "Testopolis");
let assertions = 0;
const assert = (cond: boolean, msg: string) => {
  assertions++;
  if (!cond) {
    console.error("✗ FAIL:", msg);
    process.exit(1);
  }
};

assert(state.carbonGainPerMonth > 0, "starts emitting (positive gain)");
assert(state.support === 65, "starts at 65% support");
assert(state.budget === 2_000_000, "mayor starts with $2M");

// Greedy strategy played out month-by-month, keeping a cash reserve.
const RESERVE = 300_000;
let months = 0;
while (state.status === "playing" && months < 1000) {
  // 1) found the cheapest not-yet-started research we can afford
  for (const r of [...RESEARCH].sort((a, b) => a.foundingCost - b.foundingCost)) {
    const started =
      state.completedResearch.includes(r.id) ||
      state.activeResearch.some((a) => a.defId === r.id);
    if (!started && state.budget - r.foundingCost > RESERVE) {
      const res = foundResearch(state, r.id);
      if (res.ok) state = res.state;
      break;
    }
  }

  // 2) pass an affordable, unlocked bill if support is healthy
  if (state.support > 60) {
    for (const b of BILLS) {
      if (state.passedBills.includes(b.id)) continue;
      if (b.requiresResearch && !state.completedResearch.includes(b.requiresResearch)) continue;
      const r = passBill(state, b.id);
      if (r.ok) {
        state = r.state;
        break;
      }
    }
  }

  // 3) build the strongest unlocked infra on an empty region we can afford
  const emptyRegion = state.regions.find((rg) => !rg.builtInfraId);
  if (emptyRegion) {
    const options = INFRASTRUCTURE.filter(
      (i) => !i.requiresResearch || state.completedResearch.includes(i.requiresResearch),
    ).sort((a, b) => a.carbonDelta - b.carbonDelta);
    for (const opt of options) {
      if (state.budget - opt.cost > RESERVE) {
        const r = buildInfrastructure(state, emptyRegion.id, opt.id);
        if (r.ok) {
          state = r.state;
          break;
        }
      }
    }
  }

  state = tickMonth(state as GameState);
  months++;
}

console.log("Final status:", state.status);
console.log("Year reached:", state.year);
console.log("Final carbon gain/mo:", effectiveCarbonGain(state).toFixed(5));
console.log("Carbon ppm:", state.carbonPpm.toFixed(1));
console.log("Support:", state.support.toFixed(0) + "%");
console.log("Built infra:", state.builtInfra.length, "/", state.regions.length);
console.log("Research done:", state.completedResearch.length, "/", RESEARCH.length);
console.log("Bills passed:", state.passedBills.length, "/", BILLS.length);

assert(state.status === "won", "a strategic Mayor can reach net-zero in time");
assert(effectiveCarbonGain(state) <= 0, "win means effective gain <= 0");

console.log(`\n✓ All ${assertions} assertions passed. Mayor loop is winnable.`);
