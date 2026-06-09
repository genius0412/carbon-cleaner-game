/**
 * letterContent.ts
 * Content for the Civic Action letter builder.
 *
 * - REP_DIRECTORY: a small, editable STUB dataset for representative lookup.
 *   Do NOT fetch unreliable live data. The human can expand this JSON, and
 *   real contact details are DATA BLANK #060.
 * - SENTENCE_BLOCKS: pre-written blocks for the younger (drag-and-drop) flow.
 * - FACT_POOL: climate facts/statistics for the older (compose) flow. The
 *   actual numbers are DATA BLANK #061, the framing sentences are ours.
 */

export interface Representative {
  office: string;
  name: string; // [FILL IN] until human supplies
  email: string; // [FILL IN]
  address: string; // how to address them
}

export interface RepEntry {
  town: string;
  reps: Representative[];
}

/** Stub directory, match is case-insensitive substring on town. */
export const REP_DIRECTORY: RepEntry[] = [
  {
    town: "Example Town",
    reps: [
      {
        office: "City Council Member",
        name: "[FILL IN #060, name]",
        email: "[FILL IN #060, email]",
        address: "Dear Council Member [Last Name],",
      },
      {
        office: "State Representative",
        name: "[FILL IN #060, name]",
        email: "[FILL IN #060, email]",
        address: "Dear Representative [Last Name],",
      },
      {
        office: "Mayor's Office",
        name: "[FILL IN #060, name]",
        email: "[FILL IN #060, email]",
        address: "Dear Mayor [Last Name],",
      },
    ],
  },
];

/** Generic fallback shown when a town isn't in the directory. */
export const GENERIC_REPS: Representative[] = [
  {
    office: "Your City Council Member",
    name: "[FILL IN #060, look up at your city's website]",
    email: "[FILL IN #060, official email]",
    address: "Dear Council Member [Last Name],",
  },
  {
    office: "Your State Representative",
    name: "[FILL IN #060, find via your state legislature site]",
    email: "[FILL IN #060, official email]",
    address: "Dear Representative [Last Name],",
  },
];

export function lookupReps(town: string): Representative[] {
  const q = town.trim().toLowerCase();
  if (!q) return [];
  const match = REP_DIRECTORY.find((e) => e.town.toLowerCase().includes(q) || q.includes(e.town.toLowerCase()));
  return match ? match.reps : GENERIC_REPS;
}

/** Drag-and-drop sentence blocks for younger students. */
export interface SentenceBlock {
  id: string;
  role: "greeting" | "intro" | "fact" | "ask" | "closing";
  text: string;
}

export const SENTENCE_BLOCKS: SentenceBlock[] = [
  { id: "g1", role: "greeting", text: "Dear Representative," },
  { id: "i1", role: "intro", text: "My name is [your name] and I am a student who cares about our community." },
  { id: "i2", role: "intro", text: "I am writing to you today because I am worried about climate change." },
  { id: "f1", role: "fact", text: "Burning fossil fuels adds carbon dioxide to the air, which makes the planet warmer." },
  { id: "f2", role: "fact", text: "Warmer temperatures cause stronger storms, droughts, and rising seas that hurt families." },
  { id: "f3", role: "fact", text: "Trees, clean energy, and public transit can all help lower our carbon pollution." },
  { id: "a1", role: "ask", text: "Please support more solar panels and clean energy in our town." },
  { id: "a2", role: "ask", text: "Please help protect parks and plant more trees where we live." },
  { id: "a3", role: "ask", text: "I am asking you to make climate action a priority this year." },
  { id: "c1", role: "closing", text: "Thank you for listening to a young person who wants a healthy future." },
  { id: "c2", role: "closing", text: "Sincerely, [your name]" },
];

/** Fact pool for older students; numbers are DATA BLANK #061. */
export interface ClimateFact {
  id: string;
  text: string; // includes a [FILL IN #061] chip placeholder marker {{blank}}
}

export const FACT_POOL: ClimateFact[] = [
  { id: "fp1", text: "Atmospheric CO₂ has risen to roughly {{blank}} ppm, a level not seen in human history." },
  { id: "fp2", text: "Global average temperatures have already climbed about {{blank}} above pre-industrial levels." },
  { id: "fp3", text: "Transportation accounts for nearly {{blank}} of emissions in the United States, making local transit choices powerful." },
  { id: "fp4", text: "The average American emits about {{blank}} of CO₂ each year, far above the global average." },
  { id: "fp5", text: "Sea levels have risen about {{blank}} since 1900, threatening coastal communities like ours." },
  { id: "fp6", text: "Each year, extreme heat affects {{blank}} communities, straining health systems and budgets." },
];

/** Deterministic-ish random pick of `n` facts based on a seed string. */
export function pickFacts(seed: string, n = 3): ClimateFact[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const pool = [...FACT_POOL];
  const out: ClimateFact[] = [];
  while (out.length < n && pool.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    const idx = h % pool.length;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
