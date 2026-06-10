/**
 * letterContent.ts
 * Content for the Civic Action letter builder.
 *
 * - REP_DIRECTORY / GENERIC_REPS: guidance for representative lookup. We do
 *   NOT ship fabricated contact data, students look up (or enter) their own
 *   real official's details instead.
 * - SENTENCE_BLOCKS: pre-written blocks for the younger (drag-and-drop) flow.
 * - FACT_POOL: climate facts for the older (compose) flow; each fact cites a
 *   real, numbered DATA BLANK via `blankId`.
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

/**
 * We don't ship fabricated contact data. The directory is intentionally empty,
 * so every lookup returns the guidance entries below, which point students to
 * their own real officials.
 */
export const REP_DIRECTORY: RepEntry[] = [];

/** Guidance shown for any town: how to find your own real representatives. */
export const GENERIC_REPS: Representative[] = [
  {
    office: "Your City Council Member",
    name: "Look them up on your city or county website",
    email: "Use the official contact address listed there",
    address: "Dear Council Member [Last Name],",
  },
  {
    office: "Your State Representative",
    name: "Find them via your state legislature's website",
    email: "Use the official contact address listed there",
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

/** Fact pool for older students; each fact's number is a cited DATA BLANK. */
export interface ClimateFact {
  id: string;
  /** The {{blank}} marker is rendered as <DataChip id={blankId} />. */
  blankId: number;
  text: string;
}

export const FACT_POOL: ClimateFact[] = [
  { id: "fp1", blankId: 1, text: "Atmospheric CO₂ has risen to roughly {{blank}}, a level not seen in human history." },
  { id: "fp2", blankId: 2, text: "Global average temperatures have already climbed about {{blank}} above pre-industrial levels." },
  { id: "fp3", blankId: 5, text: "Transportation accounts for nearly {{blank}} of emissions in the United States, making local transit choices powerful." },
  { id: "fp4", blankId: 6, text: "The average American has a carbon footprint of about {{blank}}, far above the global average." },
  { id: "fp5", blankId: 4, text: "Sea levels have risen about {{blank}} since 1900, putting millions of people in coastal communities at risk." },
  { id: "fp6", blankId: 7, text: "Each year, extreme heat puts about {{blank}} of the U.S. population at risk, straining health systems and budgets." },
  { id: "fp7", blankId: 61, text: "A typical U.S. household emits about {{blank}} of CO₂ each year, so local choices add up fast." },
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
