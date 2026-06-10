/**
 * Headless engine balance test. Verifies:
 *  - Mayor mode is winnable by a strong strategic player, but NOT early
 *    (difficulty floor: no wins before 2034).
 *  - Student mode is winnable by a diligent student (works the action menu,
 *    sends the letter, plants trees) well before the 2050 deadline.
 *  - Student mode is NOT winnable by doing almost nothing (letter only).
 * Run: npx tsx scripts/sim-test.ts
 */
import {
  createInitialState,
  tickMonth,
  buildInfrastructure,
  replaceInfrastructure,
  upgradeInfrastructure,
  foundResearch,
  passBill,
  plantTrees,
  performStudentAction,
  applyCivicBoost,
  studentActionStatus,
  effectiveCarbonGain,
  effectiveInfraDelta,
} from "../lib/engine/engine.ts";
import { INFRASTRUCTURE, RESEARCH, BILLS, TREES } from "../lib/engine/content.ts";
import { STUDENT_ACTIONS } from "../lib/engine/studentActions.ts";
import type { GameState } from "../lib/engine/types.ts";

let assertions = 0;
const assert = (cond: boolean, msg: string) => {
  assertions++;
  if (!cond) {
    console.error("✗ FAIL:", msg);
    process.exit(1);
  }
};

// ---------------------------------------------------------------------------
// Mayor: greedy-but-sane strategy played month by month.
// ---------------------------------------------------------------------------
function runMayor(): GameState {
  let state = createInitialState("mayor", "Testopolis");
  assert(state.carbonGainPerMonth > 0, "mayor starts emitting (positive gain)");
  assert(state.support === 55, "mayor starts at 55% support");
  assert(state.budget === 2_000_000, "mayor starts with $2M");

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

    // 3) build the strongest unlocked infra on an empty region we can afford.
    const emptyRegion = state.regions.find((rg) => !rg.builtInfraId);
    if (emptyRegion) {
      const options = INFRASTRUCTURE.filter(
        (i) =>
          (!i.requiresResearch || state.completedResearch.includes(i.requiresResearch)) &&
          (i.supportDelta >= 0 || state.support > 60),
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
    } else {
      // 3b) everything built: swap weak early builds for stronger unlocked
      // tech the terrain allows (terrain now restricts what fits where), then
      // deepen capture with upgrades.
      let replaced = false;
      for (const rg of state.regions) {
        const built = state.builtInfra.find((b) => b.regionId === rg.id);
        const curDef = built && INFRASTRUCTURE.find((i) => i.id === built.infraId);
        if (!built || !curDef) continue;
        const curEff = effectiveInfraDelta(
          curDef, rg, state.completedResearch, built.level ?? 1,
        );
        const candidates = INFRASTRUCTURE.filter(
          (i) =>
            i.id !== curDef.id &&
            i.allowedTerrain.includes(rg.terrain) &&
            (!i.requiresResearch || state.completedResearch.includes(i.requiresResearch)) &&
            (i.supportDelta >= 0 || state.support > 60),
        ).sort((a, b) => a.carbonDelta - b.carbonDelta);
        for (const cand of candidates) {
          const candEff = effectiveInfraDelta(cand, rg, state.completedResearch, 1);
          // deltas are negative: more negative = stronger
          if (candEff < curEff && state.budget - cand.cost > RESERVE) {
            const r = replaceInfrastructure(state, rg.id, cand.id);
            if (r.ok) {
              state = r.state;
              replaced = true;
            }
          }
          break; // only consider the strongest candidate per region
        }
        if (replaced) break; // at most one replacement per month
      }
      if (!replaced) {
        for (const b of state.builtInfra) {
          const r = upgradeInfrastructure(state, b.regionId);
          if (r.ok && state.budget - 0 > RESERVE) {
            if (r.state.budget > RESERVE) {
              state = r.state;
              break;
            }
          }
        }
      }
    }

    // 4) shore up approval with a serious greening program before elections
    if (state.support < 56 && state.budget > RESERVE + 100_000) {
      const maple = TREES.find((t) => t.id === "maple")!;
      const batches = Math.floor(100_000 / maple.costPerBatch);
      const r = plantTrees(state, "maple", batches);
      if (r.ok) state = r.state;
    }

    state = tickMonth(state as GameState);
    months++;
  }
  return state;
}

// ---------------------------------------------------------------------------
// Student: works the menu steadily, sends the letter, plants trees.
// ---------------------------------------------------------------------------
function runStudent(diligent: boolean): GameState {
  let state = createInitialState("student_older", "Testville");
  let months = 0;
  while (state.status === "playing" && months < 1000) {
    // the civic letter (the homework centerpiece) lands a few months in
    if (months === 5 && !state.civic?.boostApplied) {
      state = applyCivicBoost(state, "A sincere letter to my representative.");
    }

    if (diligent) {
      // take every grassroots action that's currently available
      for (const def of STUDENT_ACTIONS) {
        const st = studentActionStatus(state, def.id);
        if (st.available && state.budget >= def.cost) {
          const r = performStudentAction(state, def.id, 1);
          if (r.ok) state = r.state;
        }
      }
      // small local builds when savings allow
      const emptyRegion = state.regions.find((rg) => !rg.builtInfraId);
      if (emptyRegion) {
        for (const id of ["tree_initiative", "recycling", "led_streetlights"]) {
          const def = INFRASTRUCTURE.find((i) => i.id === id)!;
          if (state.budget - def.cost > 30_000) {
            const r = buildInfrastructure(state, emptyRegion.id, id);
            if (r.ok) {
              state = r.state;
              break;
            }
          }
        }
      }
      // put spare pocket money into trees each quarter
      if (months % 3 === 0 && state.budget > 40_000) {
        const maple = TREES.find((t) => t.id === "maple")!;
        const batches = Math.floor(10_000 / maple.costPerBatch);
        const r = plantTrees(state, "maple", batches);
        if (r.ok) state = r.state;
      }
    }

    state = tickMonth(state as GameState);
    months++;
  }
  return state;
}

// ---------------------------------------------------------------------------

const mayor = runMayor();
console.log("--- Mayor (strong strategic play) ---");
console.log("Status:", mayor.status, "· Year:", mayor.year);
console.log("Gain/mo:", effectiveCarbonGain(mayor).toFixed(5), "· Support:", mayor.support.toFixed(0) + "%");
console.log("Infra:", mayor.builtInfra.length, "· Research:", mayor.completedResearch.length, "· Bills:", mayor.passedBills.length);
assert(mayor.status === "won", "a strategic Mayor can reach net-zero in time");
assert(effectiveCarbonGain(mayor) <= 0, "mayor win means effective gain <= 0");
assert(mayor.year >= 2034, `mayor mode must be hard: no wins before 2034 (won ${mayor.year})`);

const student = runStudent(true);
console.log("\n--- Student (diligent) ---");
console.log("Status:", student.status, "· Year:", student.year);
console.log("Gain/mo:", effectiveCarbonGain(student).toFixed(5));
assert(student.status === "won", "a diligent student can reach net-zero");
assert(student.year <= 2046, `diligent student should win with room to spare (won ${student.year})`);
assert(student.year >= 2029, `student mode shouldn't be a pushover either (won ${student.year})`);

const slacker = runStudent(false);
console.log("\n--- Student (letter only, no other effort) ---");
console.log("Status:", slacker.status, "· Year:", slacker.year);
assert(slacker.status !== "won", "doing almost nothing must not win the game");

console.log(`\n✓ All ${assertions} assertions passed. Balance targets hold.`);
