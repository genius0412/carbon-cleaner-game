/**
 * studentActions.ts
 * Grassroots actions a real student could plausibly take. These give students
 * a broad, interactive menu of things to do beyond the civic letter, each one
 * a recognizable real-world activity with a modest, balanced game effect.
 *
 * Balance intent: no single action wins the game. Reaching net-zero as a
 * student rewards *breadth* (try many kinds), *repetition* (with diminishing
 * returns), the civic letter, tree planting, and a couple of small builds
 * funded by fundraisers.
 */

import type { StudentActionDef } from "./types";

export const STUDENT_ACTIONS: StudentActionDef[] = [
  // ---- Awareness / advocacy: strong on support, light on carbon ----
  {
    id: "social_campaign",
    name: "Run a Social Media Campaign",
    icon: "📱",
    category: "awareness",
    description:
      "Post facts, infographics, and your progress online to get more people in town to care about the climate.",
    cost: 0,
    carbonDelta: -0.00025,
    supportDelta: 4,
    repeatable: true,
    cooldownMonths: 6,
    diminishing: 0.875,
    feedback:
      "Your posts spread fast, more neighbours are paying attention and backing the cause.",
  },
  {
    id: "petition",
    name: "Start a Petition",
    icon: "✍️",
    category: "awareness",
    description:
      "Collect signatures calling for cleaner energy and present them to local leaders.",
    cost: 0,
    carbonDelta: -0.0004,
    supportDelta: 6,
    repeatable: true,
    cooldownMonths: 6,
    diminishing: 0.825,
    feedback:
      "Hundreds of signatures land on the council's desk, public pressure is building.",
  },
  {
    id: "school_presentation",
    name: "Give a School Presentation",
    icon: "🎤",
    category: "awareness",
    description:
      "Present what you've learned at an assembly to inform and rally your classmates.",
    cost: 0,
    carbonDelta: -0.00025,
    supportDelta: 5,
    repeatable: true,
    cooldownMonths: 8,
    diminishing: 0.875,
    feedback: "The assembly is buzzing, your peers want to get involved.",
  },

  // ---- School: organize lasting changes on campus ----
  {
    id: "climate_club",
    name: "Found a Climate Club",
    icon: "🌍",
    category: "school",
    description:
      "Start an after-school club that keeps organizing projects all year. A lasting base that makes every other action more effective, and unlocks bigger initiatives.",
    cost: 5_000,
    carbonDelta: -0.001,
    supportDelta: 5,
    repeatable: false,
    cooldownMonths: 0,
    diminishing: 1,
    // A standing organization makes every future action land harder.
    synergyBoost: 0.25,
    feedback:
      "Your climate club is official, a steady engine that makes everything that comes next more effective.",
  },
  {
    id: "green_team",
    name: "Launch a Green Team",
    icon: "🌱",
    category: "school",
    description:
      "With the club behind you, stand up a Green Team that runs campus sustainability projects every term, bigger and more reliable than one-off events.",
    cost: 0,
    carbonDelta: -0.001,
    supportDelta: 3,
    repeatable: true,
    cooldownMonths: 6,
    diminishing: 0.925,
    requires: ["climate_club"],
    feedback:
      "The Green Team is rolling, projects that used to fizzle now actually ship.",
  },
  {
    id: "recycling_drive",
    name: "Organize a Recycling Drive",
    icon: "♻️",
    category: "school",
    description:
      "Set up sorted bins and a collection day so far less of the school's waste ends up in landfill.",
    cost: 2_000,
    carbonDelta: -0.00075,
    supportDelta: 2,
    repeatable: true,
    cooldownMonths: 6,
    diminishing: 0.925,
    feedback:
      "Bins are overflowing with sorted recyclables, that's real waste diverted.",
  },
  {
    id: "energy_audit",
    name: "Run an Energy Audit",
    icon: "💡",
    category: "school",
    description:
      "Walk the school and your home switching to LEDs, unplugging idle devices, and sealing drafts.",
    cost: 0,
    carbonDelta: -0.0006,
    supportDelta: 1,
    repeatable: true,
    cooldownMonths: 6,
    diminishing: 0.825,
    feedback:
      "Lights off, vampires unplugged, the meter is already spinning slower.",
  },

  // ---- Lifestyle: model lower-carbon habits ----
  {
    id: "meatless_monday",
    name: "Launch Meatless Mondays",
    icon: "🥗",
    category: "lifestyle",
    description:
      "Campaign for one plant-based day a week in the cafeteria, a surprisingly big emissions cut.",
    cost: 0,
    carbonDelta: -0.0005,
    supportDelta: 2,
    repeatable: true,
    cooldownMonths: 8,
    diminishing: 0.875,
    feedback: "The cafeteria's plant-based day is a hit, and a real footprint cut.",
  },
  {
    id: "bike_week",
    name: "Organize a Bike-to-School Week",
    icon: "🚲",
    category: "lifestyle",
    description:
      "Rally students to bike, walk, or carpool instead of being driven, fewer tailpipes each morning.",
    cost: 0,
    carbonDelta: -0.00045,
    supportDelta: 3,
    repeatable: true,
    cooldownMonths: 8,
    diminishing: 0.875,
    feedback: "The bike racks are packed, quieter, cleaner mornings all week.",
  },

  // ---- Community: get out into the neighbourhood ----
  {
    id: "community_cleanup",
    name: "Host a Community Cleanup",
    icon: "🧹",
    category: "community",
    description:
      "Gather volunteers to clear litter from a park or creek and plant native ground cover.",
    cost: 1_000,
    carbonDelta: -0.0003,
    supportDelta: 4,
    repeatable: true,
    cooldownMonths: 6,
    diminishing: 0.925,
    feedback:
      "A cleaner park and a crowd of new volunteers, goodwill is contagious.",
  },
  {
    id: "climate_summit",
    name: "Host a Youth Climate Summit",
    icon: "🏟️",
    category: "community",
    description:
      "Use your club's network to convene students from across the district for a day of action and pledges, a movement, not a moment.",
    cost: 3_000,
    carbonDelta: -0.00075,
    supportDelta: 8,
    repeatable: true,
    cooldownMonths: 8,
    diminishing: 0.875,
    requires: ["climate_club"],
    feedback:
      "Hundreds of students showed up and signed on, the movement just leveled up.",
  },

  // ---- Fundraising: turn enthusiasm into a budget for bigger projects ----
  {
    id: "green_fundraiser",
    name: "Run a Green Fundraiser",
    icon: "💰",
    category: "fundraising",
    description:
      "Host a bake sale or car wash to raise money, fund tree planting and small local builds.",
    cost: 0,
    budgetDelta: 15_000,
    carbonDelta: 0,
    supportDelta: 1,
    repeatable: true,
    cooldownMonths: 8,
    diminishing: 0.925,
    feedback: "The fundraiser was a success, fresh funds for your next project.",
  },
];

const BY_ID: Record<string, StudentActionDef> = Object.fromEntries(
  STUDENT_ACTIONS.map((a) => [a.id, a]),
);

export function studentActionById(id: string): StudentActionDef | undefined {
  return BY_ID[id];
}
