You are an expert full-stack engineer and game designer. Build a complete, working, well-organized web application called Carbon Cleaner. Read this entire spec before writing any code, then build it in the phased order given at the end. Prioritize a working product over a feature-complete-but-broken one.
0. Context & what "good" means here
Carbon Cleaner is a browser-based climate-strategy game made as an AP World History civic-action project on climate change. It will be graded on five things, so optimize for all of them:
Understanding of climate change, the site must teach real climate impacts at both a global and local level.
Research & use of data, real, cited numbers presented clearly (see the DATA-BLANK rules in §3).
A concrete solution / proposal, the game's actions are specific, actionable climate interventions tied to data.
Civic action final product, a real-world action layer (letter to a representative) + a downloadable final report that communicates to stakeholders.
Citations, a proper, visible bibliography (NoodleTools-friendly format).
Tone: educational, encouraging, futuristic-but-grounded. Every number a player sees should feel like it could be real.
1. Tech stack & architecture
Framework: Next.js (App Router) + React + TypeScript.
Styling: Tailwind CSS. Mobile-responsive (must be usable on a laptop and a phone).
Backend: Supabase, Auth (email/password + guest), Postgres database, Realtime (for live leaderboards/counts), Storage (screenshot uploads).
Deploy target: Vercel. Put all secrets in environment variables; never hardcode keys. Include a .env.example.
State: React state/Context (or Zustand) for the live game loop; persist to Supabase on a debounced interval and on key actions.
Project hygiene: clear folder structure, commented code, a README.md with setup steps (Supabase project creation, env vars, SQL migration, npm run dev), and the DATA_TO_FILL.md and supabase/schema.sql files.
Keep the game loop in one well-isolated module (e.g. lib/engine/) so the simulation logic is testable and separate from UI.
2. The fictional world
The game is set in a fictional U.S.-style state (default name Verdana, but the player names their own city, see §6). Default starting conditions (these are tunable game constants, NOT real-world data, keep as given unless noted):
Year: January 2026, ends December 2050 (game over Jan 2051).
Population: 100,000.
Starting global CO₂: 430 ppm. Failure threshold: 600 ppm.
Starting Carbon Gain: positive (county is emitting); goal is ≤ 0.00 ppm/month before Dec 2050.
Starting Population Support: 65%.
Starting budget: $2,000,000, plus $1,000,000 at the start of each in-game year (carries over).
3. DATA-BLANK convention (CRITICAL, the human will fill these in)
Two kinds of numbers exist:
Game constants (starting budget, support %, research timelines, support penalties, etc.), use the values given in this spec as-is. Collect them all into one lib/config/gameConstants.ts file with comments so they're easy to tune later.
Real-world data, any figure shown to the player as a real fact or a realistic cost/impact (e.g. cost to install solar, kg CO₂ captured per scrubber, local emissions stats, climate impact facts). Do NOT invent these. Insert a numbered blank instead.
For every real-world blank:
Render it in the UI as a visible chip: a small highlighted pill reading [FILL IN #007] (styled so it's obvious, e.g. amber background) in place of the number.
Define it in lib/config/dataBlanks.ts keyed by number, with: a short label, the unit/format expected, the in-app location, and a source: "" field for a citation.
Append it to DATA_TO_FILL.md as a checklist: [ ] #007, Cost to install rooftop solar per public building (USD), used in Shop > Solar Panels, SOURCE: ____.
At the very end of the build, print the full list of every blank you created so the human has a complete to-do list.
4. Design system, "futuristic eco"
Palette: deep near-black/charcoal base, with eco-green (#3DDC84-ish) and cyan/teal accents, plus a warm amber for warnings/data-blanks. Subtle glows, soft gradients, glassy translucent cards (backdrop blur).
Type: a clean geometric sans for UI (e.g. Inter/Space Grotesk); a slightly techy display font for headings.
Feel: sci-fi command-center meets nature. Rounded cards, thin glowing borders, smooth transitions, gentle particle/grid background on the marketing pages. No clutter; high readability.
Map style: flat, friendly, cartoonish vector art, not realistic geography (see §6.4).
Provide a small shared component library (Button, Card, Gauge, Modal, Toast/FeedbackCard, DataChip).
5. Site map (pages)
Marketing / public
/ Home, what Carbon Cleaner is, why it exists (climate change, global + local framing with cited stats, DATA BLANKS), and who created it (creator/credits). Big "Play" CTA.
/about, deeper explanation of climate change and the project's goals (rubric: understanding + research).
/team Our Team, team member cards (use [FILL IN] name/role/photo placeholders).
/how-to-play, rules, gauges, controls, mode differences, screenshots/GIFs placeholders.
/sources Sources & Bibliography, a clean, citable list of every source behind the game's data, formatted for NoodleTools (MLA-style entries). Auto-pull from the source fields in dataBlanks.ts where possible.
A small global counter visible on Home: "X players have reached net-zero" (live from Supabase, §10).
Auth
/login, /signup, and Guest mode. Guest mode generates a resume code (an opaque string) the player can copy and paste later to restore their save. Show clear copy/save instructions.
Game flow
/play → Character Select → City Naming → Game Dashboard (single-screen).
/classroom, join a class with a code; view the live scoreboard.
/report/[gameId], the final downloadable report.
6. Game, shared core systems (both modes)
6.1 Gauges (always visible)
Year/Month (e.g. "March 2031").
Carbon Gain/Month (ppm change/mo), the key metric.
Current Carbon Amount (ppm), starts 430, fails at 600.
Population Support (0–100%), starts 65%.
Budget ($, in millions).
6.2 Time controls
Pause / Play. Default speed 1 in-game month per real minute.
Speed options: 1x, 1.5x, 2.5x (replace any other speeds).
Skip Forward (jump +1 year).
Auto-pause: time freezes automatically whenever the player is taking an action (a panel/modal is open) and resumes when they close it.
6.3 Win / lose
Win: Carbon Gain/Month ≤ 0.00 at any time before Dec 2050 (with at least minimal governing function intact).
Lose: reach Jan 2051 without net-zero, or Current Carbon Amount hits 600 ppm.
6.4 The map
A pan-and-zoom cartoon SVG map of the fictional state, divided into many labeled regions. Think Google-Maps-lite: drag to pan, scroll/buttons to zoom, but the art is flat and friendly.
Regions have terrain types (mountains, forest, plains, coast, urban, farmland). Terrain affects which infrastructure makes sense (e.g. geothermal/wind favor mountains; solar favors plains; algae/scrubbers favor coast/urban, apply small efficiency modifiers).
One infrastructure per region (hard rule). Clicking a region opens its action panel (which auto-pauses time).
Built infrastructure shows as a small icon on that region.
6.5 Economy & feedback
All costs drawn from the budget; costs shown clearly before purchase.
After every purchase or passed bill, show a Feedback Card: 1–2 sentences, conversational mission-briefing tone, that (a) affirms the climate benefit with a brief educational reason and (b) names the tradeoff (cost / support hit / slow timeline). Time stays paused while it's shown.
6.6 Population support dynamics
Each action applies its support delta immediately.
Passive recovery +0.5%/in-game month if no negative action, capped at 80% without specific positive actions.
< 50%: bills cannot pass.
< 30%: residents undermine progress, apply a small monthly penalty to Carbon Gain/Month.
< 10%: near-paralysis, no bills, research loses momentum, upgrade costs rise.
6.7 Research improves existing infrastructure
In addition to unlocking new tech, completed research should retroactively boost the efficiency of already-built related infrastructure (e.g. Smart Grid research increases output of existing solar). Make this visible to the player.
7. MAYOR mode (full powers)
The Mayor has the complete toolset. Three action categories:
7.1 Infrastructure Upgrades (the Shop)
Each upgrade: name, short description, cost, Carbon Gain/Month delta (e.g. "−0.003 ppm/mo"), Support impact (±%), and a feedback paragraph. Carbon/cost numbers that should be realistic = DATA BLANKS.
Available from start:
County-Wide LED Streetlight Conversion (modest carbon −, slight +support)
Expanded Public Bus Routes (carbon −, slight −support from drivers)
Mandatory Commercial Recycling Program (small carbon −, slight −support)
Solar Panels on Public Buildings (moderate carbon −, modest cost, slight +support)
Urban Tree Planting Initiative (slow offset, strong +support), links to §7.4
Green Building Code for New Construction (long-term −, low immediate, slight −support)
Unlocked by research (see 7.2):
Electric County Fleet · Smart Grid Energy Management · Atmospheric Carbon Scrubber Array · Algae Bio-Reactor Carbon Sinks · Geothermal District Heating Network · Autonomous Electric Transit Pods · Vertical Wind Turbine Neighborhoods · Carbon-Negative Concrete Initiative.
7.2 Research Corporations
Founding cost (one-time), monthly operating cost (passive), timeline (months), then a completion popup + unlock. (These costs/timelines are game constants, keep as given; but any "this reflects real R&D cost" framing = blank.)
Corporation
Founding
Monthly
Timeline
Unlocks
Verdana EV Research Institute
$500k
$10k
24 mo
Electric County Fleet
Smart Infrastructure Lab
$600k
$15k
30 mo
Smart Grid Energy Management
Carbon Capture Authority
$800k
$20k
48 mo
Atmospheric Carbon Scrubber Array
BioSequestration Science Center
$700k
$15k
36 mo
Algae Bio-Reactor Carbon Sinks
Geothermal Futures Institute
$750k
$20k
42 mo
Geothermal District Heating
Advanced Mobility Lab
$900k
$25k
54 mo
Autonomous Electric Transit Pods
Micro-Energy Research Group
$400k
$10k
20 mo
Vertical Wind Turbine Neighborhoods
Green Materials Science Division
$650k
$15k
38 mo
Carbon-Negative Concrete Initiative

7.3 Bills & Legislation
No budget cost, but require support > 50% to pass; carry support penalties. Each: name, description, support requirement, carbon delta, support impact, feedback paragraph.
Ban on Single-Use Plastics (−8%) · Carbon Tax on Local Businesses (−12%, adds funds to budget) · Mandatory Home Energy Audits (−7%) · Gas-Powered Lawn Equipment Ban (−10%) · County-Wide 20mph Speed Limit (−9%) · Mandatory EV Transition by 2060 (−15%, requires EV research) · Zoning Reform for Dense Housing (−5%, slowly recovers) · Industrial Emission Cap & Trade (−14%).
7.4 Tree planting
Plant 10 trees at a time; higher-efficiency trees cost more. (CO₂-per-tree values should reflect reality → consider these DATA BLANKS if the human wants cited figures; defaults given for gameplay.)
Tree (×10)
Cost
CO₂/yr
Spruce
$500
200 kg
Oak
$375
150 kg
Pine
$250
100 kg
Maple
$650
250 kg
Walnut
$400
175 kg

8. STUDENT mode (reduced powers)
Same map/world/economy, but the player is a student with far less money and control. At Character Select, the player picks one of: Student (younger, 9–14), Student (older, 14–18), or Mayor.
Student rules:
Much smaller budget; can take fewer/limited actions (e.g. small-scale local actions, advocacy, school/community initiatives, NOT founding corporations or passing county bills directly).
Students primarily make progress through advocacy and real-world civic action (§9) rather than big purchases.
Younger (9–14): simplified interactions. The letter-writing task is a drag-and-drop exercise, the student assembles a pre-written letter from provided sentence blocks.
Older (14–18): given data, statistics, and sources, then writes their own letter from scratch. They're encouraged/incentivized to take real action and submit proof for a big progress boost.
9. Civic Action system (the rubric centerpiece)
This is the most important feature for grading, make it polished.
Representative lookup: student types their town; the site shows which representative/office to email and how to address them. (Lookup data = DATA BLANKS / a small editable JSON the human fills, or a stubbed example set, do NOT fetch unreliable live data.)
Letter builder:
Younger: drag-and-drop sentence blocks into a coherent letter.
Older: a composer with a panel of climate data, statistics, and source links to draw from. Randomize which facts/sources are surfaced to each student (from a pool) so no two letters are identical.
Real-world action + proof: the student can upload a screenshot of an email they actually sent. A big progress boost is granted on submission.
Lenient AI plausibility check (keep simple): verify the screenshot looks like a believable email about climate change, i.e. it appears to be an email/message addressed to another person and contains climate-related text. Do NOT build a forgery detector. Implement as a lightweight check (e.g. send the image + a short rubric to an AI vision call, or a simple OCR keyword check for an email structure + climate terms). If it passes the loose check, accept it. Store the image in Supabase Storage.
The uploaded proof and the letter are saved and surfaced in the final report (§12).
10. Backend (Supabase), schema & live features
Provide supabase/schema.sql with tables + Row Level Security. Suggested tables:
profiles (id, username, role, created_at)
game_saves (id, user_id nullable, guest_code nullable, mode, character_type, city_name, full game state JSON, carbon_gain, carbon_amount, support, budget, year_month, finished_at nullable, updated_at)
classrooms (id, join_code, name, teacher_id)
classroom_members (classroom_id, game_save_id, city_name)
global_stats (single row or view: total_finished count)
civic_uploads (id, game_save_id, image_path, passed_check, created_at)
Live features (Supabase Realtime, or polling if simpler):
Global finished counter on Home.
Classroom join-by-code → live scoreboard: rank by progress = lowest Carbon Gain/Month (closer to/below zero = better), showing each player's city name. Once a player finishes, finishers are ranked by finish time (first → last) above everyone still playing.
Guest resume: guest saves keyed by guest_code; pasting the code restores the save.
11. Onboarding flow
Intro briefing (a few paragraphs of flavor): who the player is, the state of the world (100k residents, carbon-dependent, 430 ppm), the mandate (net-zero by 2050 without losing public trust), and a quick gauge explainer.
Character Select (Mayor / older student / younger student).
City naming: two spinning randomizer wheels whose results combine into one city name (e.g. wheel A = "New / Port / Mount / Lake…", wheel B = "haven / vale / ridge / shire…"). The player spins until they like the result; no free typing. Provide large word lists on both wheels.
Load the dashboard.
12. Final report (downloadable)
A clean, printable report page that generates a downloadable PDF summarizing the playthrough: city name, mode/character, final stats (carbon gain, ppm, year reached, support), a timeline of key actions taken, the civic-action letter, the uploaded proof screenshot, and the bibliography.
In a classroom, this report is the gradable artifact: students download it and (optionally) upload it back / submit to their teacher. Keep the generation client-side if possible (e.g. print-to-PDF styling or a lightweight PDF lib).
13. Rubric-alignment requirements (do not skip)
Embed real climate context on Home/About with global AND local framing (local = the fictional county standing in for "your community"), all real figures as DATA BLANKS with sources.
Make the solution actionable: every shop/bill/research item has a concrete description of what it does.
Ensure the /sources bibliography is complete and MLA-formatted, auto-aggregated from data-blank sources.
The civic action (letter + proof + report) must clearly "communicate to stakeholders."
14. Build order (phases), build in this sequence
Scaffold: Next.js + Tailwind + Supabase client, env setup, design system components, routing, gameConstants.ts, dataBlanks.ts, DATA_TO_FILL.md.
Game engine: the simulation loop (time, gauges, win/lose, support dynamics) as a standalone module + a temporary debug UI.
Dashboard + map: pan/zoom cartoon SVG, regions, terrain, one-infra-per-region, gauges, time controls (1x/1.5x/2.5x, pause, skip, auto-pause).
Mayor actions: Shop, Research, Bills, Tree planting, Feedback Cards, research-efficiency boosts.
Onboarding: intro briefing, character select, two-wheel city namer.
Auth & saves: signup/login/guest + resume code; Supabase persistence.
Student mode + Civic Action: reduced powers, rep lookup, letter builder (drag-drop vs compose), screenshot upload + lenient AI check.
Live features: global counter, classroom join + live scoreboard.
Final report PDF.
Marketing pages: Home, About, Team, How to Play, Sources.
Polish + responsive pass.
If you run short on time, simplify in this order (don't break the core): make leaderboards/counter poll instead of realtime → stub the AI screenshot check as a simple keyword/OCR pass → use a static example dataset for rep lookup → reduce map to fewer regions. Never cut: a playable Mayor loop, save/resume, and the civic-action letter + report.
15. Acceptance checklist (verify before finishing)
A player can pick a character, name a city via wheels, and play a full Mayor loop that can reach net-zero or lose.
Time controls + auto-pause-on-action work.
Student mode is distinct (less money/power) and the letter + proof flow works with the lenient check.
Auth + guest resume code persist and restore saves via Supabase.
Classroom code → live scoreboard ranks by carbon gain, then finish time.
Global finished counter shows on Home.
Downloadable final report includes stats, letter, proof, bibliography.
All marketing pages exist incl. /sources.
Every real-world number is a [FILL IN #N] chip, logged in DATA_TO_FILL.md, and the full list is printed at the end.
README explains setup; .env.example and supabase/schema.sql included.
When you finish, print the complete DATA_TO_FILL.md checklist so the human knows exactly which numbers and sources to supply.
