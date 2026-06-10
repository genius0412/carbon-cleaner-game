/**
 * story.ts
 * The narrative spine of Carbon Cleaner. Story "beats" are advisor briefings
 * that fire the first time their trigger becomes true. Beats drive the game's
 * progression: they UNLOCK features (trees, research, bills) and CALL the
 * player to civic action.
 *
 * Design rules:
 *  - "build" is always available; everything else is introduced through story.
 *  - Civic action is summoned by the citizenry via a beat, not available from
 *    the start. It is only ever ASKED for ONCE (you don't spam your rep), but if
 *    the player defers it the Dashboard keeps a "Write a letter" button until
 *    it's done. Civic beats are suppressed once the letter has actually been sent.
 *
 * Pure + data-only so it stays testable and UI-agnostic.
 */

import { GAME } from "../config/gameConstants";
import type { GameState, FeatureKey } from "./types";

export type BeatKind = "story" | "civic";

export interface StoryBeat {
  id: string;
  kind: BeatKind;
  speaker: string;
  role: string;
  avatar: string; // emoji
  title: string;
  lines: string[];
  /** Fires the first time this returns true (each beat shown at most once). */
  trigger: (s: GameState) => boolean;
  /** Restrict to certain modes. */
  modes?: ("mayor" | "student")[];
  /** Features this beat unlocks when dismissed. */
  unlocks?: FeatureKey[];
  /** Label for the primary action button. */
  cta?: string;
}

const isStudent = (s: GameState) => s.mode === "student";
const civicDone = (s: GameState) => !!s.civic?.boostApplied;

/**
 * Whole in-game months since the start of the run. Time-based triggers use
 * this (>= comparisons) instead of exact year/month windows so a beat can
 * never be jumped over by skipping months or whole years at once.
 */
const monthsElapsed = (s: GameState) =>
  (s.year - GAME.startYear) * 12 + (s.month - GAME.startMonth);

export const STORY_BEATS: StoryBeat[] = [
  // ====================================================================
  // ACT I, ARRIVAL
  // ====================================================================
  {
    id: "arrival",
    kind: "story",
    speaker: "Mara Vega",
    role: "Chief of Staff",
    avatar: "🧭",
    title: "One month in office",
    lines: [
      "The transition team's gone and the building's finally quiet. It's just us and the work now, Mayor.",
      "Here's the situation, plainly: {county}'s carbon count is climbing every single month. The atmosphere's at 430 parts per million and we're adding to it.",
      "The scientists are unanimous, if we cross 450 ppm, it's over. Failed harvests, a flooded harbor, summers nobody can work through.",
      "But we have time, and we have a county full of people who want a future. Open the map. Pick a region. Let's put steel in the ground. Or rather, trees in the ground.",
    ],
    trigger: (s) => monthsElapsed(s) >= 1,
    cta: "Let's get to work",
  },
  {
    id: "how_building_works",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "How we win this",
    lines: [
      "Mayor, before you spend a dollar, understand the one number that matters: Carbon Gain per Month. Right now it's positive. We're emitting.",
      "Every project you build pushes that number down. Get it to zero or below and keep it there for a full year, that's net-zero for real, and we've won, even if it's not yet 2050.",
      "And terrain matters. Solar loves the open plains; wind and geothermal want the mountains; algae and scrubbers belong on the coast and in the city. Build where the land works for you and you'll get more out of every project.",
    ],
    trigger: (s) => monthsElapsed(s) >= 2,
    cta: "Understood",
  },

  // ====================================================================
  // ACT II, GROWTH: unlock trees, then research
  // ====================================================================
  {
    id: "first_build",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "The first cut",
    lines: [
      "I just watched the emissions telemetry move the right direction for the first time. It's small, but it's real, and it's yours.",
      "Here's something the public will love: trees. They pull carbon out of the air for free, for decades, and people adore a greener county.",
      "I've authorized the Greening Program. You can now plant in batches from the actions panel, different species pull down different amounts. It's slow, but it's the cheapest carbon you'll ever buy.",
    ],
    trigger: (s) => s.builtInfra.length >= 1,
    unlocks: ["trees"],
    cta: "Unlock Tree Planting",
  },
  {
    id: "unlock_research",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "We need to invent our way out",
    lines: [
      "Off-the-shelf tech alone won't get us to zero. We need breakthroughs, and that means founding Research Corporations.",
      "Two things happen when a corporation finishes its work. First, it UNLOCKS powerful new infrastructure: scrubbers that pull carbon straight from the sky, geothermal heat, autonomous transit, carbon-negative concrete.",
      "Second, and this is the part people miss, completed research makes the infrastructure you ALREADY built more efficient. Research a Smart Grid and every solar panel and EV depot you own quietly starts producing more. Your past investments keep paying off.",
      "Founding a corporation costs money up front plus a monthly operating budget, and the work takes years. Start early. The sooner you fund it, the sooner the whole county compounds.",
    ],
    trigger: (s) => s.builtInfra.length >= 2 || monthsElapsed(s) >= 5,
    modes: ["mayor"], // research is a mayor-only feature
    unlocks: ["research"],
    cta: "Unlock Research",
  },
  {
    id: "research_started",
    kind: "story",
    speaker: "Mara Vega",
    role: "Chief of Staff",
    avatar: "🧭",
    title: "The labs are humming",
    lines: [
      "Word's out that you founded a research corporation. The papers are calling it a bet on the future, which it is.",
      "Keep an eye on the operating costs each month, but don't lose your nerve. The payoff lands when the project completes, and it's worth it.",
    ],
    trigger: (s) => s.activeResearch.length >= 1,
    modes: ["mayor"],
    cta: "Onward",
  },
  {
    id: "first_research_done",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "Breakthrough, and a force multiplier",
    lines: [
      "It's done! The new technology is unlocked and ready to deploy on the map.",
      "But look closer at your existing sites, their output just jumped. That's the efficiency dividend I promised. Every related project you've already built is now doing more with the same footprint.",
      "This is how a county actually reaches zero: not one silver bullet, but layers of progress reinforcing each other.",
    ],
    trigger: (s) => s.completedResearch.length >= 1,
    modes: ["mayor"],
    cta: "Excellent",
  },

  // ====================================================================
  // ACT III, POLITICS: unlock bills
  // ====================================================================
  {
    id: "unlock_bills",
    kind: "story",
    speaker: "Councilor Dawn Pham",
    role: "County Council Chair",
    avatar: "⚖️",
    title: "Steel isn't enough, we need law",
    lines: [
      "Mayor, you've proven you can build. Now let's talk about the things concrete can't fix: how people live, drive, and do business.",
      "The Council is ready to move legislation with you, plastic bans, a carbon tax, emission caps. Bills cost no budget, and some even raise revenue.",
      "But here's the catch: laws need the public behind you. We can't pass anything if support falls below 50%. Push too many unpopular bills at once and you'll stall out entirely.",
      "I've opened the legislative docket. Spend your political capital wisely.",
    ],
    trigger: (s) =>
      s.completedResearch.length >= 1 || s.builtInfra.length >= 4 || s.year >= 2028,
    modes: ["mayor"], // legislation is a mayor-only feature
    unlocks: ["bills"],
    cta: "Unlock Legislation",
  },
  {
    id: "support_low",
    kind: "story",
    speaker: "Mara Vega",
    role: "Chief of Staff",
    avatar: "🧭",
    title: "We're losing the room",
    lines: [
      "Public support just slipped below 40%. I need you to feel how dangerous that is.",
      "Under 50% and the Council won't pass a thing. Under 30% and residents start actively dragging on our progress, strikes, lawsuits, slow-walks.",
      "Ease off the mandates for a while. Plant trees, put up visible solar, deliver wins people can see. Goodwill is a resource like any other, go rebuild it.",
    ],
    trigger: (s) => s.support < 40,
    cta: "Rebuild trust",
  },

  // ====================================================================
  // ACT IV, CIVIC ACTION (asked ONCE, never spam your rep)
  // ====================================================================
  {
    id: "civic_call_mayor",
    kind: "civic",
    speaker: "Tomás Reyes",
    role: "Citizens' Climate Coalition",
    avatar: "✊",
    title: "The people are organizing",
    lines: [
      "Mayor, families across the county are packing our meetings. They don't just want you to act locally; they want {county}'s voice carried up the chain.",
      "There's something only a real person can do that no press release ever will: put your name on a letter to your representative and actually send it.",
      "Do it once, and mean it. We'll help you draft it from the data. One genuine letter from a community that's clearly doing the work, that moves people in power.",
    ],
    trigger: (s) => !civicDone(s) && (s.year >= 2027 || s.completedResearch.length >= 1),
    modes: ["mayor"],
    unlocks: ["civic"],
    cta: "Open the letter desk",
  },
  {
    id: "civic_call_student",
    kind: "civic",
    speaker: "Ms. Okafor",
    role: "Your Teacher",
    avatar: "🎓",
    title: "Your voice is the lever",
    lines: [
      "You don't control a county budget, but you hold something just as powerful, and it's yours alone: your voice.",
      "We're going to write to a real representative about climate change. Use the facts, make it honest, make it yours.",
      "And you only need to send it once. A single sincere letter, actually delivered, carries more weight than a hundred forwarded ones. Quality over noise, that's how you're heard.",
    ],
    trigger: (s) => isStudent(s) && !civicDone(s) && monthsElapsed(s) >= 2,
    modes: ["student"],
    unlocks: ["civic"],
    cta: "Write my letter",
  },
  {
    id: "civic_thanks",
    kind: "story",
    speaker: "Tomás Reyes",
    role: "Citizens' Climate Coalition",
    avatar: "✊",
    title: "It landed",
    lines: [
      "Your letter went out, and it's already rippling. People are sharing it, showing up, signing on.",
      "That's all we'll ask of you on this. One real message, sent with conviction. Don't dilute it by flooding the office; you've done the thing that matters.",
      "Now go finish what you started. The momentum is at your back.",
    ],
    trigger: (s) => civicDone(s),
    cta: "Back to work",
  },

  // ====================================================================
  // ACT V, THE LONG HAUL: warnings + milestones
  // ====================================================================
  {
    // id kept from the old 460 threshold so players who already saw this
    // beat don't see it replay after the rebalance.
    id: "carbon_460",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "Crossing 435 ppm",
    lines: [
      "We've passed 435 ppm. The air over {county} is measurably warmer than the day you took office, and you can feel it in the summers now.",
      "Slowing the gain isn't enough anymore, I need it negative. That means the heavy hitters: scrubbers, cap-and-trade, the big research-tier infrastructure.",
      "If you haven't founded the Carbon Capture Authority yet, do it. Direct air capture is the only thing that takes the count down instead of just slowing the climb.",
    ],
    trigger: (s) => s.carbonPpm >= 435,
    cta: "Escalate",
  },
  {
    id: "midcentury",
    kind: "story",
    speaker: "Mara Vega",
    role: "Chief of Staff",
    avatar: "🧭",
    title: "Halfway there",
    lines: [
      "We're halfway through your mandate, Mayor. Half your time's already spent.",
      "Take a breath and look at what {county}'s become under you, the panels on the rooftops, the turbines on the ridge, the kids who've never known a smoggy sky.",
      "But sentiment won't finish the job. Check your gain number against zero, and let's plan the back half like the future depends on it. Because it does.",
    ],
    trigger: (s) => s.year >= 2038,
    cta: "Plan the back half",
  },
  {
    // id kept from the old 540 threshold (see carbon_460 above).
    id: "carbon_540",
    kind: "story",
    speaker: "Mara Vega",
    role: "Chief of Staff",
    avatar: "🧭",
    title: "Red zone",
    lines: [
      "445 ppm. I won't dress it up, at this trajectory we hit 450 and lose everything we've built.",
      "This is the moment for everything you've got. Max out the strongest bills support will allow. Cover every viable region with scrubber-class infrastructure.",
      "We do not get a second county. Go.",
    ],
    trigger: (s) => s.carbonPpm >= 445,
    cta: "All in",
  },
  {
    id: "approaching_zero",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "We can see the finish line",
    lines: [
      "Mayor, monthly carbon gain is almost flat. We are one, maybe two good decisions from net-zero.",
      "Whatever's left in the tank, one more region, one more bill, one more efficiency breakthrough landing, now is when it counts.",
      "Years from now, people will point to this moment and to {county}. Finish it.",
    ],
    trigger: (s) => s.carbonGainPerMonth > 0 && s.carbonGainPerMonth < 0.008,
    cta: "Finish it",
  },
  {
    id: "netzero_hold",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "The first net-zero month",
    lines: [
      "There it is. This month, {county} put no new carbon into the sky. I've waited my whole career to say that sentence.",
      "But one good month isn't a cured county, it's a snapshot. Keep the gain at or below zero for twelve months straight and history will call it real.",
      "Protect what got us here. Keep support healthy, keep the projects funded, and don't let anything slip back into the red.",
    ],
    trigger: (s) => s.carbonGainPerMonth <= GAME.netZeroThreshold,
    cta: "Hold the line",
  },
];

/** Returns the first not-yet-seen beat whose trigger fires for this state. */
export function nextStoryBeat(
  state: GameState,
  seenIds: string[],
): StoryBeat | null {
  for (const beat of STORY_BEATS) {
    if (seenIds.includes(beat.id)) continue;
    if (beat.modes && !beat.modes.includes(state.mode)) continue;
    // Never re-summon civic action once the letter has been sent.
    if (beat.kind === "civic" && state.civic?.boostApplied) continue;
    try {
      if (beat.trigger(state)) {
        // Personalize: "{county}" in any line becomes the player's county name.
        return {
          ...beat,
          lines: beat.lines.map((l) => l.split("{county}").join(state.cityName)),
        };
      }
    } catch {
      /* defensive: ignore bad triggers */
    }
  }
  return null;
}
