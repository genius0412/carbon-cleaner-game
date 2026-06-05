/**
 * story.ts
 * Narrative layer for Carbon Cleaner. Story "beats" are advisor briefings that
 * fire when their trigger condition first becomes true. Some beats are "civic"
 * beats — they are how the Civic Action flow surfaces (it is NOT a permanent
 * button; the citizenry calls on the player at story moments).
 *
 * Pure + data-only so it stays testable and UI-agnostic.
 */

import type { GameState } from "./types";

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
  /** Label for the primary action button. */
  cta?: string;
}

const isStudent = (s: GameState) => s.mode === "student";

export const STORY_BEATS: StoryBeat[] = [
  // --- Opening, fires almost immediately after the first month ---
  {
    id: "arrival",
    kind: "story",
    speaker: "Mara Vega",
    role: "Chief of Staff",
    avatar: "🧭",
    title: "Day one in office",
    lines: [
      "The transition team is gone and the building's finally quiet. It's just us and the work now.",
      "The county's carbon count is climbing every single month. The scientists say if it crosses 600 ppm, the damage becomes irreversible — heatwaves, failed harvests, flooded coasts.",
      "We have until 2100 to get our monthly carbon gain to zero. Open the map when you're ready. Every region is a decision waiting to be made.",
    ],
    trigger: (s) => s.year === 2025 && s.month >= 2,
    cta: "Let's get to work",
  },

  // --- First build celebration ---
  {
    id: "first_build",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "The first cut",
    lines: [
      "I just watched the emissions telemetry tick the other direction for the first time. It's small — but it's real.",
      "This is exactly how it works: no single project saves us. Dozens of them, stacked across the county, bend the curve. Keep going.",
    ],
    trigger: (s) => s.builtInfra.length >= 1,
    cta: "Keep building",
  },

  // --- Civic call #1 — the people get involved (this is how Civic Action appears) ---
  {
    id: "civic_call_1",
    kind: "civic",
    speaker: "Tomás Reyes",
    role: "Citizens' Climate Coalition",
    avatar: "✊",
    title: "The people are organizing",
    lines: [
      "Mayor — families across the county are showing up to our meetings. They want to help, but they want leadership to push higher up the chain, too.",
      "Will you put it in writing? A letter to your representative carries weight that a press release never will. We'll help you draft it.",
    ],
    trigger: (s) => s.year >= 2025 && s.month >= 6,
    cta: "Open the letter desk",
  },

  // --- Student-focused civic call (earlier + central to their playthrough) ---
  {
    id: "civic_student",
    kind: "civic",
    speaker: "Ms. Okafor",
    role: "Your Teacher",
    avatar: "🎓",
    title: "Your voice is the lever",
    lines: [
      "You don't control the county budget — but you control something powerful: your voice.",
      "Let's write to a real representative about climate change. When you actually send it, the momentum it creates will ripple further than you'd think.",
    ],
    trigger: (s) => isStudent(s) && s.month >= 3,
    modes: ["student"],
    cta: "Write my letter",
  },

  // --- Carbon rising warning ---
  {
    id: "carbon_450",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "Crossing 450 ppm",
    lines: [
      "We've passed 450 ppm. The county's air is measurably warmer than the day you took office.",
      "We're still gaining carbon every month. We need the gain number negative, not just smaller. Lean into the big-ticket interventions when you can afford them.",
    ],
    trigger: (s) => s.carbonPpm >= 450,
    cta: "Understood",
  },

  // --- Danger ---
  {
    id: "carbon_530",
    kind: "story",
    speaker: "Mara Vega",
    role: "Chief of Staff",
    avatar: "🧭",
    title: "We're in the red zone",
    lines: [
      "530 ppm. I won't sugarcoat it — at this rate we will hit the 600 threshold and lose everything we've built.",
      "If support allows, push the strongest bills and the scrubber-class infrastructure now. This is the moment.",
    ],
    trigger: (s) => s.carbonPpm >= 530,
    cta: "Act now",
  },

  // --- Low support ---
  {
    id: "support_low",
    kind: "story",
    speaker: "Mara Vega",
    role: "Chief of Staff",
    avatar: "🧭",
    title: "We're losing the room",
    lines: [
      "Public support just dropped below 40%. Below 50% we can't pass legislation at all, and if it slides under 30% residents will actively undermine us.",
      "Ease off the unpopular mandates for a bit. Tree-planting and visible wins like solar will buy back goodwill.",
    ],
    trigger: (s) => s.support < 40,
    cta: "Rebuild trust",
  },

  // --- Civic call #2 — later, if they haven't acted ---
  {
    id: "civic_call_2",
    kind: "civic",
    speaker: "Tomás Reyes",
    role: "Citizens' Climate Coalition",
    avatar: "✊",
    title: "One more push from the people",
    lines: [
      "The movement's bigger now, but momentum fades without leadership. We're asking again: take it to your representative, on the record.",
      "Send it for real and the surge of public will is going to move your numbers.",
    ],
    trigger: (s) => s.year >= 2045 && !s.civic?.boostApplied,
    cta: "Write the letter",
  },

  // --- Approaching victory ---
  {
    id: "approaching_zero",
    kind: "story",
    speaker: "Dr. Imani Soto",
    role: "Lead Climate Scientist",
    avatar: "🔬",
    title: "We can see the finish line",
    lines: [
      "Monthly carbon gain is almost flat. We are one or two good decisions away from net-zero.",
      "Whatever you've got left — one more region, one more bill — now's the time. History is about to turn on this.",
    ],
    trigger: (s) => {
      // base gain near zero but still positive
      return s.carbonGainPerMonth > 0 && s.carbonGainPerMonth < 0.008;
    },
    cta: "Finish it",
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
    try {
      if (beat.trigger(state)) return beat;
    } catch {
      /* defensive: ignore bad triggers */
    }
  }
  return null;
}
