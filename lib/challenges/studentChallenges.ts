/**
 * studentChallenges.ts
 * Story + mini-challenge content for each student action. The engine only
 * knows the action's effects; this layer makes each action a small interactive
 * scene: a storyline intro, a hands-on challenge, and an outcome. How well the
 * player does scales the reward (see scoreToScale).
 *
 * Each action has an ARRAY of variants. Repeats rotate through them (by the
 * action's done-count) so doing the same action again brings a new scene and
 * often a different mechanic. Five reusable mechanics: quiz, sort, tap, order,
 * pick. Every action in STUDENT_ACTIONS must have at least one variant here.
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

export const STUDENT_CHALLENGES: Record<string, StudentChallenge[]> = {
  // ---------------------------------------------------------------- awareness
  social_campaign: [
    {
      intro:
        "Your phone's in your hand and the whole town scrolls past every evening. One good post could move thousands, but the feed is brutal. What you say matters.",
      task: "Pick the post most likely to actually change minds",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "“We're all doomed. 😩 Nothing matters anymore, so why recycle, why vote, why even try.”",
            detail: "Doom-posting spreads fast but leaves people hopeless and passive.",
            quality: 0.2,
          },
          {
            label: "“Rooftop solar could cut our town's emissions 30%. Here's the plan 👇”",
            detail: "Hopeful, specific, and gives people a concrete action. This is how movements grow.",
            quality: 1,
          },
          {
            label: "“Climate change is real and getting worse every single year. Please care about this. Thanks.”",
            detail: "True, but vague and forgettable, no hook, no action.",
            quality: 0.5,
          },
          {
            label: "“Politicians are all liars and idiots!! 🤬 Every one of them sold us out for oil money!!”",
            detail: "Venting feels good but alienates the very people you need on side.",
            quality: 0.1,
          },
        ],
      },
      win: "Your post takes off, shares, comments, new volunteers. The algorithm finally did something good.",
      partial: "It got a few likes. Not viral, but a start, you're learning what lands.",
    },
    {
      intro:
        "A post claiming 'the climate has always changed, so this is normal' is going viral in the town group. It's wrong, but it's winning. Your reply will be read by everyone.",
      task: "Choose how to reply to the viral post",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "“Imagine still believing this in 2026 💀 Tell me you skipped science class without telling me.”",
            detail: "The dunk gets laughs from your side and hardens everyone else.",
            quality: 0.2,
          },
          {
            label: "“True! But past shifts took thousands of years. We did this one in a single lifetime 📈”",
            detail: "You grant the kernel of truth, then correct it with something checkable. People actually read this.",
            quality: 1,
          },
          {
            label: "Paste a 14-paragraph wall of statistics with citations for every sentence",
            detail: "All correct, all unread. Nobody scrolls through a lecture.",
            quality: 0.4,
          },
          {
            label: "Report the post to the moderators and quietly move on",
            detail: "It won't get taken down, and the thread keeps spreading without a counterpoint.",
            quality: 0.3,
          },
        ],
      },
      win: "Your reply outpaces the original post. Even the poster grudgingly likes it.",
      partial: "A few people thanked you. The thread moved on, but minds were nudged.",
    },
    {
      intro:
        "A local news station just shared your campaign page and the comment section is on fire, questions, doubts, and a lot of genuine curiosity. Answer fast while the town is actually watching.",
      task: "Reply to as many commenters as you can",
      challenge: {
        kind: "tap",
        goal: 40,
        seconds: 10,
        tapLabel: "💬 Reply to a comment",
        unit: "replies",
      },
      win: "You kept up with the flood. The thread turned friendly and your follower count jumped.",
      partial: "You answered the big ones before the thread cooled off. Still a good night.",
    },
  ],

  meatless_monday: [
    {
      intro:
        "The cafeteria manager gives you one shot: design the launch-day plate for Meatless Monday. Make it genuinely low-carbon, and tasty enough that kids don't riot.",
      task: "Choose the lowest-carbon lunch that students will still eat",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "🍔 The usual burger, just with a smaller beef patty",
            detail: "Beef is the single most carbon-intensive food. Even small portions blow the budget.",
            quality: 0.1,
          },
          {
            label: "🧆 Chickpea bowl with flatbread",
            detail: "Legumes are protein-rich and very low-carbon, filling and crowd-pleasing.",
            quality: 1,
          },
          {
            label: "🧀 Triple-cheese mac with garlic bread",
            detail: "Meat-free, but dairy is surprisingly carbon-heavy. Better than beef, not great.",
            quality: 0.5,
          },
          {
            label: "🐟 Grilled fish tacos with cabbage slaw",
            detail: "Lower than beef, but it isn't plant-based, and trawling has its own footprint.",
            quality: 0.4,
          },
        ],
      },
      win: "The chickpea bowls sell out. Even the skeptics admit it slapped. Meatless Monday is here to stay.",
      partial: "Lunch went okay, a few empty trays, a few complaints. You'll tweak the menu next week.",
    },
    {
      intro:
        "Week two. The novelty has worn off, the lunch line is grumbling, and one bad menu could kill the whole program. Pick the dish that keeps Meatless Monday alive.",
      task: "Pick the week-two menu that wins the doubters back",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "🌯 Build-your-own bean burrito bar",
            detail: "Letting kids assemble their own plate is the oldest trick in the cafeteria book, and beans keep it genuinely low-carbon.",
            quality: 1,
          },
          {
            label: "🥗 A salad bar only, with no hot food at all",
            detail: "Low-carbon, sure, but hungry teenagers will revolt by Wednesday.",
            quality: 0.3,
          },
          {
            label: "🍕 Pizza day with double cheese on every slice",
            detail: "Popular, but all that dairy carries more carbon than people think.",
            quality: 0.4,
          },
          {
            label: "🍞 'Mystery veggie loaf', the cook won't say what's in it",
            detail: "Nobody trusts a loaf with a question mark in it. The program wouldn't survive the memes.",
            quality: 0.1,
          },
        ],
      },
      win: "The burrito line stretches out the door. Nobody even mentions the missing meat.",
      partial: "Mixed reviews, but enough kids came back for seconds to keep the program going.",
    },
  ],

  // ------------------------------------------------------------------- school
  recycling_drive: [
    {
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
    {
      intro:
        "Round two, and the art department just dumped a whole semester of leftovers next to your bins. The custodian raises an eyebrow. Time to show the sorting holds up against the weird stuff.",
      task: "Sort the tricky pile",
      challenge: {
        kind: "sort",
        buckets: [
          { id: "recycle", label: "♻️ Recycle", hint: "Clean paper, metal, rigid plastic, glass" },
          { id: "compost", label: "🌱 Compost", hint: "Food & plant waste" },
          { id: "landfill", label: "🗑️ Landfill", hint: "Mixed / non-recyclable" },
        ],
        items: [
          { label: "🫙 Glass jam jar, rinsed", bucket: "recycle" },
          { label: "🧃 Juice pouch", bucket: "landfill" },
          { label: "📦 Flattened cardboard box", bucket: "recycle" },
          { label: "🍂 Dead class plants", bucket: "compost" },
          { label: "🧁 Styrofoam tray", bucket: "landfill" },
          { label: "🥚 Eggshells from cooking class", bucket: "compost" },
          { label: "📖 Old magazines", bucket: "recycle" },
        ],
      },
      win: "Even the juice pouches ended up where they belong. The custodian quietly adds a fourth bin for you.",
      partial: "Most of the pile landed right. The styrofoam fooled a few people, it fools everyone.",
    },
  ],

  energy_audit: [
    {
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
    {
      intro:
        "This time it's your own house. Armed with last month's eye-watering power bill, you go room to room hunting down everything that's quietly running for no reason.",
      task: "Sort each thing at home into 'switch it off' or 'leave it'",
      challenge: {
        kind: "sort",
        buckets: [
          { id: "off", label: "🔌 Switch off / unplug", hint: "Wasting energy" },
          { id: "keep", label: "✅ Leave it", hint: "Needs to stay on" },
        ],
        items: [
          { label: "🎮 Game console on standby for a week", bucket: "off" },
          { label: "📶 Wifi router", bucket: "keep" },
          { label: "🔥 Space heater in an empty room", bucket: "off" },
          { label: "💡 Porch light on at noon", bucket: "off" },
          { label: "🧊 The fridge", bucket: "keep" },
          { label: "🌀 Bathroom fan running all day", bucket: "off" },
          { label: "🚨 Smoke detector", bucket: "keep" },
        ],
      },
      win: "Your family is annoyed and the power bill drops anyway. You frame the difference on the fridge.",
      partial: "You unplugged the worst of it. Somebody turned the space heater back on, the battle continues.",
    },
  ],

  // ----------------------------------------------------------------- ordering
  climate_club: [
    {
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
  ],

  green_team: [
    {
      intro:
        "The club's behind you and the Green Team is ready to commit to one flagship project every term. Pick the one that delivers real, repeatable cuts, not just a feel-good photo op.",
      task: "Choose the Green Team's flagship project",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "🌳 A one-off tree-planting photo day for the yearbook",
            detail: "Nice picture, but a single afternoon a year barely moves the needle once you account for the term break.",
            quality: 0.3,
          },
          {
            label: "♻️ An audit crew that fixes waste every term",
            detail: "Boring on camera, huge over time, repeatable savings that compound term after term. Exactly what a standing team is for.",
            quality: 1,
          },
          {
            label: "👕 Sell branded Green Team hoodies and stickers",
            detail: "Builds identity, but new plastic-y merch can cost more carbon than it saves. Mostly vibes.",
            quality: 0.2,
          },
          {
            label: "📣 A big awareness week with posters everywhere",
            detail: "Awareness matters, but a one-week splash with no follow-through is the opposite of what a standing team should do.",
            quality: 0.5,
          },
        ],
      },
      win: "The audit crew becomes an institution, every term they find new savings, and projects that used to fizzle now actually ship.",
      partial: "The team's running, if a little unfocused. You'll steer it toward the work that lasts.",
    },
    {
      intro:
        "New term, new sprint. The team has one week of after-school time and a building full of waste to find. A sprint that's sequenced well finds twice as much as one that wings it.",
      task: "Plan the audit sprint in the right order",
      challenge: {
        kind: "order",
        steps: [
          "Walk the whole building and list every problem",
          "Rank the fixes by how much they'd save",
          "Knock out the cheap, easy fixes the same week",
          "Pitch the principal on the big-ticket fixes",
          "Publish the before-and-after numbers",
        ],
      },
      win: "The numbers go up on the noticeboard and the principal approves two of the big fixes on the spot.",
      partial: "The sprint found plenty, even if the pitch meeting ran off the rails. Next term will be sharper.",
    },
    {
      intro:
        "The principal hands the Green Team a small budget and one condition, spend it where it actually matters. The whole team is watching you make the call.",
      task: "Spend the team's budget where it counts",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "🌡️ Smart thermostats for the oldest classrooms",
            detail: "Heating is the building's biggest energy hog, and the old wing leaks money every winter. This pays for itself.",
            quality: 1,
          },
          {
            label: "🎈 A launch party to celebrate getting the budget",
            detail: "Morale is nice. A party that spends the entire budget is less nice.",
            quality: 0.1,
          },
          {
            label: "💡 A few LED bulbs for one hallway",
            detail: "A real improvement, but it nibbles at the edge of the problem while the heating roars on.",
            quality: 0.5,
          },
          {
            label: "📋 Laminated awareness posters for every room",
            detail: "Posters fade into the wallpaper by week two. The thermostat never stops working.",
            quality: 0.3,
          },
        ],
      },
      win: "By December the old wing is warm and the bill is down. The principal asks what you want to fix next.",
      partial: "The money did some good, though the heating bill still makes the office wince.",
    },
  ],

  climate_summit: [
    {
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
    {
      intro:
        "This year's summit is bigger, and everyone wants a say in who opens it. The keynote sets the tone for the whole day. Choose well.",
      task: "Pick the keynote speaker",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "🎤 A student who got her school onto rooftop solar",
            detail: "She's one of them, she actually did the thing, and every school in the room leaves believing they can too.",
            quality: 1,
          },
          {
            label: "✈️ A celebrity activist who flies in for the morning",
            detail: "Big name, big buzz, and a private-jet carbon bill that becomes the only thing anyone talks about.",
            quality: 0.2,
          },
          {
            label: "🏛️ The mayor reading a statement his office wrote",
            detail: "Respectable and instantly forgotten. Nobody ever chanted along to a prepared statement.",
            quality: 0.5,
          },
          {
            label: "🎬 A feature-length climate documentary, lights off",
            detail: "Ninety minutes of doom before lunch flattens the room you were supposed to fire up.",
            quality: 0.3,
          },
        ],
      },
      win: "She gets a standing ovation and three schools start solar petitions before the first workshop.",
      partial: "The day went fine, but the opening never quite lit the spark you wanted.",
    },
  ],

  bike_week: [
    {
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
    {
      intro:
        "The survey results are in, and they're all over the place. You can only fix one thing before the next Bike Week. The right call doubles your riders, the wrong one wastes a month.",
      task: "Pick the barrier to fix first",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "🚸 No safe way across the main road",
            detail: "This is the one parents name when they say no. Fix the crossing and the permission slips follow.",
            quality: 1,
          },
          {
            label: "😎 Kids think biking just isn't cool",
            detail: "Real, but image follows numbers. Get the crossing fixed, the crowd shows up, and cool takes care of itself.",
            quality: 0.5,
          },
          {
            label: "🏆 Not enough prizes for the riders",
            detail: "Prizes nudge the kids who were already coming. They don't move the ones who can't cross the road.",
            quality: 0.3,
          },
          {
            label: "🚲 The bike racks are old and ugly",
            detail: "Nobody in history has skipped biking because of an ugly rack.",
            quality: 0.1,
          },
        ],
      },
      win: "The town paints the crossing and turnout doubles. Parents wave from the corner instead of driving.",
      partial: "Your fix helped some riders, but the main road still scares off the rest. You know what's next.",
    },
  ],

  // --------------------------------------------------------------------- taps
  petition: [
    {
      intro:
        "Pen, clipboard, and a Saturday at the market. Every signature is one real conversation. The council won't ignore a thick stack, so go get them before the market closes.",
      task: "Collect as many signatures as you can",
      challenge: {
        kind: "tap",
        goal: 75,
        seconds: 10,
        tapLabel: "✍️ Ask for a signature",
        unit: "signatures",
      },
      win: "Pages and pages of names. You drop the stack on the council clerk's desk with a smile.",
      partial: "A respectable list, not the landslide you hoped for, but enough to be heard.",
    },
    {
      intro:
        "Before you hit the market again, practice the pitch. You get about eight seconds before a stranger walks on. The opener decides everything.",
      task: "Choose your opening line",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "“Hi! We're local students pushing for cleaner energy. Got thirty seconds?”",
            detail: "Friendly, local, honest about the ask. People stop for students who sound like neighbors.",
            quality: 1,
          },
          {
            label: "“Sign this or the planet is finished. Seriously, this might be your last chance to act.”",
            detail: "Guilt freezes people. Most will apologize and speed up.",
            quality: 0.2,
          },
          {
            label: "Hold the clipboard out silently and give them your most meaningful smile",
            detail: "Mysterious, but nobody signs what nobody explains.",
            quality: 0.1,
          },
          {
            label: "“Everyone else at the market has already signed, you don't want to be the only one.”",
            detail: "Peer pressure works a little, until someone asks what they just signed.",
            quality: 0.5,
          },
        ],
      },
      win: "The pitch lands almost every time. You run out of pages before you run out of people.",
      partial: "Some walked past, plenty stopped. The stack grows either way.",
    },
  ],

  community_cleanup: [
    {
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
    {
      intro:
        "Back at the trailhead, the bags are full and the recycling truck only takes loads that are sorted clean. One last push before pickup.",
      task: "Sort what the crew hauled out",
      challenge: {
        kind: "sort",
        buckets: [
          { id: "recycle", label: "♻️ Recycle", hint: "Clean metal, glass, rigid plastic" },
          { id: "compost", label: "🌱 Compost", hint: "Plant matter" },
          { id: "landfill", label: "🗑️ Landfill", hint: "Everything else" },
        ],
        items: [
          { label: "🥫 Soda cans", bucket: "recycle" },
          { label: "🍟 Fast-food cups and bags", bucket: "landfill" },
          { label: "🍂 Soggy leaves and branches", bucket: "compost" },
          { label: "🍾 Glass bottles", bucket: "recycle" },
          { label: "🛍️ Plastic shopping bags", bucket: "landfill" },
          { label: "💧 Water bottles", bucket: "recycle" },
        ],
      },
      win: "The truck takes every sorted bag. The driver says it's the cleanest load on the route.",
      partial: "Most of it sorted fine. One bag got rejected, lesson learned about the shopping bags.",
    },
  ],

  // -------------------------------------------------------------------- quiz
  school_presentation: [
    {
      intro:
        "Whole-school assembly. Hundreds of faces, some bored, some hostile. You finish your slides and open the floor, now the tricky questions come. Nail them and the room is yours.",
      task: "Answer the audience's questions",
      challenge: {
        kind: "quiz",
        questions: [
          {
            q: "“Water vapor traps more heat than CO₂, so why blame carbon dioxide?”",
            options: [
              "Water vapor isn't actually a greenhouse gas, that's a common misconception",
              "CO₂ is the one we keep adding, and its warming loads the air with more vapor",
              "There's barely any water vapor in the atmosphere compared to carbon dioxide",
              "Water vapor is released mainly by factories and power plants, so it's the same problem",
            ],
            answer: 1,
            explain: "CO₂ is the driver we control; it warms the air, which then holds more water vapor (a feedback).",
          },
          {
            q: "“If our town could change just one thing, what cuts the most emissions?”",
            options: [
              "Taking our electricity and transport off fossil fuels",
              "Getting every household to recycle all of its cardboard and plastic",
              "Making sure everyone turns the lights off when they leave a room",
              "Swapping every plastic straw in town for a paper one",
            ],
            answer: 0,
            explain: "Energy and transport are the largest sources, so decarbonizing them dwarfs the smaller fixes.",
          },
          {
            q: "“People say we should reach ‘net-zero.’ What does that actually mean?”",
            options: [
              "We stop emitting every greenhouse gas everywhere, effective overnight",
              "Whatever we still emit gets balanced by an equal amount removed",
              "Global temperatures drop all the way back to where they stood in 1900",
              "Only heavy industry has to cut its emissions, everyone else is exempt",
            ],
            answer: 1,
            explain: "Net-zero means any remaining emissions are cancelled out by removals, not that emissions hit zero instantly.",
          },
        ],
      },
      win: "You field every question cold. The applause is real, and a line of new recruits forms after.",
      partial: "You stumbled on one, recovered on the rest. The room mostly left convinced.",
    },
    {
      intro:
        "The science teacher liked your assembly so much she booked you for the senior class, and seniors don't do softballs. Three hands are already up.",
      task: "Handle the hard questions",
      challenge: {
        kind: "quiz",
        questions: [
          {
            q: "“Why are we still burning fossil fuels if we've known about this for decades?”",
            options: [
              "Because scientists keep changing their minds about whether warming is real",
              "Because our world was built around them, and rebuilding is slow",
              "Because no alternative energy source actually works at any real scale yet",
              "Because fossil fuels stopped causing warming sometime back in the 2000s",
            ],
            answer: 1,
            explain: "The science has been steady. The hard part is replacing a century of infrastructure, which is exactly what local action speeds up.",
          },
          {
            q: "“Honestly, does one school changing anything actually matter?”",
            options: [
              "No, in the end only national governments can really change anything",
              "Yes, but only if every school on Earth does it on the very same day",
              "Yes, local wins spread and push bigger policy along",
              "It matters for morale and school spirit, but not for actual emissions",
            ],
            answer: 2,
            explain: "Nearly every big climate policy started as a local experiment someone could point to.",
          },
          {
            q: "“Is it already too late to bother?”",
            options: [
              "Yes, the damage is done and nothing we do now can change the outcome",
              "No. Every tenth of a degree we avoid spares real harm",
              "Nobody can honestly say either way, the science is far too uncertain",
              "Only if we miss the 2030 deadline exactly as the models predicted",
            ],
            answer: 1,
            explain: "There's no cliff edge where trying stops mattering. Less warming is always less damage.",
          },
        ],
      },
      win: "The toughest room in school, won over. Two seniors ask how to join the club on your way out.",
      partial: "They pushed back hard and you held your ground on most of it. Respect earned.",
    },
  ],

  green_fundraiser: [
    {
      intro:
        "Bake sale committee, final planning meeting. You want to raise the most money with the smallest footprint, and the choices you make here decide both.",
      task: "Make the smart fundraising calls",
      challenge: {
        kind: "quiz",
        questions: [
          {
            q: "How should you serve drinks to keep it green?",
            options: [
              "Individual plastic water bottles, one handed to each visitor",
              "A big dispenser with reusable cups",
              "Cans of soda from a cooler, one per person",
              "Skip drinks entirely, they're more hassle than they're worth",
            ],
            answer: 1,
            explain: "Bulk + reusable cups slashes single-use waste and costs less.",
          },
          {
            q: "Where should the profits go for the most impact here?",
            options: [
              "Tree planting and local clean-energy projects",
              "A well-earned pizza party for the whole committee",
              "Straight into the club savings account, untouched",
              "A big order of branded plastic merch to sell later",
            ],
            answer: 0,
            explain: "Reinvesting in real projects compounds your impact.",
          },
          {
            q: "What's the greenest way to source the baked goods?",
            options: [
              "Home-baked, local, and mostly plant-based",
              "Bulk packaged snacks imported from wherever's cheapest",
              "Catering trays from the fast-food place across town",
              "Whatever costs the least, the footprint isn't the point",
            ],
            answer: 0,
            explain: "Local, plant-forward, low-packaging keeps the footprint tiny.",
          },
        ],
      },
      win: "Sold out by noon, almost no waste, and a fat envelope of cash for your next project.",
      partial: "A tidy profit, though a bit more waste than you'd like. Lesson logged for next time.",
    },
    {
      intro:
        "The bake sale formula is getting stale and the committee wants something bigger this round. Four proposals are on the table. Pick the money-maker that's also genuinely green.",
      task: "Choose this round's fundraiser",
      challenge: {
        kind: "pick",
        options: [
          {
            label: "📱 An e-waste drive, a recycler pays per kilo",
            detail: "People's drawers are full of dead electronics. You get paid, and a pile of toxic waste gets properly recycled. Double win.",
            quality: 1,
          },
          {
            label: "🧸 Raffle off a mountain of donated plastic toys",
            detail: "Cheap to run, but you're literally fundraising with future landfill.",
            quality: 0.3,
          },
          {
            label: "🚗 An all-day car wash in the school parking lot",
            detail: "Decent money, but hundreds of gallons of water and a parking lot of idling cars undercut the message.",
            quality: 0.4,
          },
          {
            label: "🧁 The exact same bake sale as every other year",
            detail: "Reliable, modest, and the committee falls asleep planning it. It works, it just doesn't grow.",
            quality: 0.6,
          },
        ],
      },
      win: "The e-waste drive fills a van and the recycler's check is the biggest the club has ever banked.",
      partial: "The fundraiser made money, just not the splash you wanted. The committee's already plotting the next one.",
    },
  ],
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

/**
 * The challenge for an action's Nth performance. Repeats rotate through the
 * action's variants so doing it again brings a fresh scene.
 */
export function getChallenge(
  actionId: string,
  timesDone = 0,
): StudentChallenge | undefined {
  const variants = STUDENT_CHALLENGES[actionId];
  if (!variants || variants.length === 0) return undefined;
  return variants[timesDone % variants.length];
}
