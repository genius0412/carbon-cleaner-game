/**
 * studentChallenges.ts
 * Story + mini-challenge content for each student action. The engine only
 * knows the action's effects; this layer makes each action a small interactive
 * scene: a storyline intro, a hands-on challenge, and an outcome. How well the
 * player does scales the reward (see scoreToScale).
 *
 * Five reusable challenge mechanics, quiz, sort, tap, order, pick, reused
 * across actions, with entirely distinct content + narrative. Every action in
 * STUDENT_ACTIONS must have an entry here, or its "Do it" button opens an empty
 * modal (the ChallengeModal renders nothing without content).
 */

export type Challenge =
  | {
      kind: "quiz";
      /** Each correct answer adds to the score. */
      questions: { q: string; options: string[]; answer: number; explain?: string }[];
    }
  | {
      kind: "sort";
      buckets: { id: string; label: string; hint?: string }[];
      items: { label: string; bucket: string }[];
    }
  | {
      kind: "tap";
      goal: number;
      seconds: number;
      tapLabel: string;
      unit: string;
    }
  | {
      kind: "order";
      /** Steps in the CORRECT order; the UI shuffles them. */
      steps: string[];
    }
  | {
      kind: "pick";
      options: { label: string; detail: string; quality: number }[];
    };

export interface StudentChallenge {
  /** Scene-setting shown before the challenge. */
  intro: string;
  /** Short title for the challenge step. */
  task: string;
  challenge: Challenge;
  /** Outcome flavor by performance. */
  win: string;
  partial: string;
}

export const STUDENT_CHALLENGES: Record<string, StudentChallenge> = {
  // ---------------------------------------------------------------- awareness
  social_campaign: {
    intro:
      "Your phone's in your hand and the whole town scrolls past every evening. One good post could move thousands, but the feed is brutal. What you say matters.",
    task: "Pick the post most likely to actually change minds",
    challenge: {
      kind: "pick",
      options: [
        {
          label: "“We're all doomed. 😩 Nothing matters anymore.”",
          detail: "Doom-posting spreads fast but leaves people hopeless and passive.",
          quality: 0.2,
        },
        {
          label:
            "“Our town can cut emissions 30% with rooftop solar, here's the plan, and how YOU can help 👇”",
          detail: "Hopeful, specific, and gives people a concrete action. This is how movements grow.",
          quality: 1,
        },
        {
          label: "“Climate change is real. Please care. Thanks.”",
          detail: "True, but vague and forgettable, no hook, no action.",
          quality: 0.5,
        },
        {
          label: "“Politicians are all liars and idiots!! 🤬”",
          detail: "Venting feels good but alienates the very people you need on side.",
          quality: 0.1,
        },
      ],
    },
    win: "Your post takes off, shares, comments, new volunteers. The algorithm finally did something good.",
    partial: "It got a few likes. Not viral, but a start, you're learning what lands.",
  },

  meatless_monday: {
    intro:
      "The cafeteria manager gives you one shot: design the launch-day plate for Meatless Monday. Make it genuinely low-carbon, and tasty enough that kids don't riot.",
    task: "Choose the lowest-carbon lunch that students will still eat",
    challenge: {
      kind: "pick",
      options: [
        {
          label: "🍔 'Just a smaller beef burger'",
          detail: "Beef is the single most carbon-intensive food. Even small portions blow the budget.",
          quality: 0.1,
        },
        {
          label: "🧆 Spiced chickpea & veggie bowl with flatbread",
          detail: "Legumes are protein-rich and very low-carbon, filling and crowd-pleasing.",
          quality: 1,
        },
        {
          label: "🧀 Triple-cheese mac",
          detail: "Meat-free, but dairy is surprisingly carbon-heavy. Better than beef, not great.",
          quality: 0.5,
        },
        {
          label: "🐟 Grilled fish tacos",
          detail: "Lower than beef, but it isn't plant-based, and trawling has its own footprint.",
          quality: 0.4,
        },
      ],
    },
    win: "The chickpea bowls sell out. Even the skeptics admit it slapped. Meatless Monday is here to stay.",
    partial: "Lunch went okay, a few empty trays, a few complaints. You'll tweak the menu next week.",
  },

  // ------------------------------------------------------------------- school
  recycling_drive: {
    intro:
      "Launch day. Three big bins, a pile of the school's trash, and a crowd watching. If people see it sorted right, the habit sticks. Get it wrong and the whole load is 'contaminated', landfill.",
    task: "Sort each item into the right bin",
    challenge: {
      kind: "sort",
      buckets: [
        { id: "recycle", label: "♻️ Recycle", hint: "Clean paper, metal, rigid plastic, glass" },
        { id: "compost", label: "🌱 Compost", hint: "Food & plant waste" },
        { id: "landfill", label: "🗑️ Landfill", hint: "Mixed / non-recyclable" },
      ],
      items: [
        { label: "🍎 Apple core", bucket: "compost" },
        { label: "🥤 Plastic bottle", bucket: "recycle" },
        { label: "🍕 Greasy pizza box", bucket: "landfill" },
        { label: "📰 Newspaper", bucket: "recycle" },
        { label: "🥫 Aluminum can", bucket: "recycle" },
        { label: "🍌 Banana peel", bucket: "compost" },
        { label: "🍬 Candy wrapper", bucket: "landfill" },
      ],
    },
    win: "Spotless bins, zero contamination. The custodians are impressed, the program's a keeper.",
    partial: "A few items in the wrong bin, but the drive mostly worked. People got the idea.",
  },

  energy_audit: {
    intro:
      "Clipboard in hand, you walk the school after the last bell. Phantom power and forgotten switches quietly burn money and carbon all night. Find the wasters.",
    task: "Sort each thing into 'switch it off' or 'leave it'",
    challenge: {
      kind: "sort",
      buckets: [
        { id: "off", label: "🔌 Switch off / unplug", hint: "Wasting energy" },
        { id: "keep", label: "✅ Leave it", hint: "Needs to stay on" },
      ],
      items: [
        { label: "💡 Empty classroom lights, on", bucket: "off" },
        { label: "🖥️ Computer lab idling overnight", bucket: "off" },
        { label: "🧊 Cafeteria fridge", bucket: "keep" },
        { label: "📺 Projector left in standby", bucket: "off" },
        { label: "🚪 Exit / emergency signs", bucket: "keep" },
        { label: "🔌 Phone chargers in empty sockets", bucket: "off" },
        { label: "🌐 Server / network closet", bucket: "keep" },
      ],
    },
    win: "You flip a dozen switches and tape up a checklist. The next power bill is going to sting, in a good way.",
    partial: "You caught the big offenders, missed a couple. Still real savings overnight.",
  },

  // ----------------------------------------------------------------- ordering
  climate_club: {
    intro:
      "You've got a room booked, a poster, and exactly zero members yet. Founding a club that lasts is all about sequence, do it in the right order and it builds its own momentum.",
    task: "Put the launch steps in the smartest order",
    challenge: {
      kind: "order",
      steps: [
        "Find a teacher to sponsor the club",
        "Recruit a few committed founding members",
        "Hold a first meeting to agree your mission",
        "Plan one small, visible first project",
        "Promote the win to recruit the whole school",
      ],
    },
    win: "Officially chartered, with a sponsor and a buzzing first project. The club runs itself now.",
    partial: "The club exists, a bit chaotic, but it exists. You'll find your rhythm.",
  },

  green_team: {
    intro:
      "The club's behind you and the Green Team is ready to commit to one flagship project every term. Pick the one that delivers real, repeatable cuts, not just a feel-good photo op.",
    task: "Choose the Green Team's flagship project",
    challenge: {
      kind: "pick",
      options: [
        {
          label: "🌳 A one-off tree-planting photo day",
          detail: "Nice picture, but a single afternoon a year barely moves the needle once you account for the term break.",
          quality: 0.3,
        },
        {
          label: "♻️ A standing audit-and-fix crew: lights, heating, waste, every term",
          detail: "Boring on camera, huge over time, repeatable savings that compound term after term. Exactly what a standing team is for.",
          quality: 1,
        },
        {
          label: "👕 Sell branded Green Team merch",
          detail: "Builds identity, but new plastic-y merch can cost more carbon than it saves. Mostly vibes.",
          quality: 0.2,
        },
        {
          label: "📣 A big awareness week, then nothing",
          detail: "Awareness matters, but a one-week splash with no follow-through is the opposite of what a standing team should do.",
          quality: 0.5,
        },
      ],
    },
    win: "The audit crew becomes an institution, every term they find new savings, and projects that used to fizzle now actually ship.",
    partial: "The team's running, if a little unfocused. You'll steer it toward the work that lasts.",
  },

  climate_summit: {
    intro:
      "Your club is convening students from across the district for one big day. A summit becomes a movement only if it's sequenced right, energy up front, commitments locked before everyone goes home.",
    task: "Order the summit day for lasting impact",
    challenge: {
      kind: "order",
      steps: [
        "Open with a rallying keynote to set the stakes",
        "Run workshops so every school learns a concrete skill",
        "Break into groups to draft real, local action plans",
        "Have each school publicly pledge a commitment",
        "Set the follow-up dates before anyone leaves",
      ],
    },
    win: "Hundreds of students left with a plan, a pledge, and a date to report back. That's not a moment, it's a network.",
    partial: "A buzzing day, but a few schools drifted off without committing. Still, the movement just got bigger.",
  },

  bike_week: {
    intro:
      "Bike-to-School Week only works if the morning runs smoothly. Plan the rollout so it's safe, fun, and impossible to ignore.",
    task: "Order the week's rollout for maximum turnout",
    challenge: {
      kind: "order",
      steps: [
        "Survey students on what stops them biking",
        "Map safe routes and fix the worst hazards",
        "Recruit 'bike buddy' groups for younger kids",
        "Run a launch-day rally with prizes",
        "Tally the cars avoided and share the results",
      ],
    },
    win: "Packed bike racks all week and a leaderboard everyone's watching. Some kids never went back to the car.",
    partial: "Decent turnout despite a rushed plan. A solid first run to build on.",
  },

  // --------------------------------------------------------------------- taps
  petition: {
    intro:
      "Pen, clipboard, and a Saturday at the market. Every signature is one real conversation. The council won't ignore a thick stack, so go get them before the market closes.",
    task: "Collect as many signatures as you can",
    challenge: {
      kind: "tap",
      goal: 25,
      seconds: 10,
      tapLabel: "✍️ Ask for a signature",
      unit: "signatures",
    },
    win: "Pages and pages of names. You drop the stack on the council clerk's desk with a smile.",
    partial: "A respectable list, not the landslide you hoped for, but enough to be heard.",
  },

  community_cleanup: {
    intro:
      "The creek path is buried in litter. You've rallied a crew and the bags are ready. Beat the afternoon rain, grab as much as you can before it pours.",
    task: "Pick up as much litter as you can",
    challenge: {
      kind: "tap",
      goal: 30,
      seconds: 10,
      tapLabel: "🧤 Grab a piece of litter",
      unit: "pieces",
    },
    win: "The path is transformed, bags lined up, neighbors clapping, ground cover going in. Photos for days.",
    partial: "A real dent in the mess before the rain hit. The park already looks better.",
  },

  // -------------------------------------------------------------------- quiz
  school_presentation: {
    intro:
      "Whole-school assembly. Hundreds of faces, some bored, some hostile. You finish your slides and open the floor, now the tricky questions come. Nail them and the room is yours.",
    task: "Answer the audience's questions",
    challenge: {
      kind: "quiz",
      questions: [
        {
          q: "“What actually causes most of the warming?”",
          options: [
            "The hole in the ozone layer",
            "Greenhouse gases like CO₂ trapping heat",
            "The sun getting hotter",
            "Litter in the ocean",
          ],
          answer: 1,
          explain: "Greenhouse gases trap heat, that's the core mechanism.",
        },
        {
          q: "“What's one of the biggest sources of emissions?”",
          options: [
            "Burning fossil fuels for energy & transport",
            "Volcanoes",
            "Breathing",
            "Wind turbines",
          ],
          answer: 0,
          explain: "Fossil fuels for power and transport dominate global emissions.",
        },
        {
          q: "“Can anything we do at school even matter?”",
          options: [
            "No, only governments matter",
            "Yes, habits, advocacy and local pressure add up and spread",
            "Only if we plant a million trees",
            "No, it's too late",
          ],
          answer: 1,
          explain: "Collective local action shifts norms and pressures decision-makers.",
        },
      ],
    },
    win: "You field every question cold. The applause is real, and a line of new recruits forms after.",
    partial: "You stumbled on one, recovered on the rest. The room mostly left convinced.",
  },

  green_fundraiser: {
    intro:
      "Bake sale committee, final planning meeting. You want to raise the most money with the smallest footprint, and the choices you make here decide both.",
    task: "Make the smart fundraising calls",
    challenge: {
      kind: "quiz",
      questions: [
        {
          q: "How should you serve drinks to keep it green?",
          options: [
            "Individual plastic water bottles",
            "A big dispenser with reusable or compostable cups",
            "Cans, one per person",
            "Don't serve drinks",
          ],
          answer: 1,
          explain: "Bulk + reusable cups slashes single-use waste and costs less.",
        },
        {
          q: "Where should the profits go for the most impact here?",
          options: [
            "Tree planting and local clean-energy projects",
            "A pizza party for the committee",
            "Straight into savings, untouched",
            "Branded plastic merch",
          ],
          answer: 0,
          explain: "Reinvesting in real projects compounds your impact.",
        },
        {
          q: "What's the greenest way to source the baked goods?",
          options: [
            "Home-baked with local, mostly plant-based ingredients",
            "Bulk imported packaged snacks",
            "Fast-food catering",
            "Whatever's cheapest, footprint aside",
          ],
          answer: 0,
          explain: "Local, plant-forward, low-packaging keeps the footprint tiny.",
        },
      ],
    },
    win: "Sold out by noon, almost no waste, and a fat envelope of cash for your next project.",
    partial: "A tidy profit, though a bit more waste than you'd like. Lesson logged for next time.",
  },
};

/** Win threshold: at or above this score, show the 'win' outcome copy. */
export const WIN_SCORE = 0.7;

/**
 * Map a challenge score (0..1) to a reward scale. Floor at 0.4 so a genuine
 * attempt always does *something*, but acing it earns the full effect.
 */
export function scoreToScale(score: number): number {
  const s = Math.max(0, Math.min(1, score));
  return 0.4 + 0.6 * s;
}

export function getChallenge(actionId: string): StudentChallenge | undefined {
  return STUDENT_CHALLENGES[actionId];
}
