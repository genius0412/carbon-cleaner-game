/**
 * dataBlanks.ts
 * ------------------------------------------------------------------
 * The DATA-BLANK registry. EVERY number shown to the player as a real
 * fact, realistic cost, or real climate impact is registered here as a
 * numbered blank — never invented inline.
 *
 * In the UI these render as a <DataChip id={n} /> amber pill reading
 * [FILL IN #NNN] until the human supplies the real, cited value.
 *
 * To "fill in" a blank: set `value` (and `source`). When `value` is
 * non-null the chip renders the real number with the given unit/format.
 *
 * The /sources page and DATA_TO_FILL.md auto-aggregate from this file.
 * ------------------------------------------------------------------
 */

export interface DataBlank {
  /** Stable id, also the display number (e.g. 7 -> [FILL IN #007]). */
  id: number;
  /** Short human label for the to-do checklist. */
  label: string;
  /** Unit / format the human should supply (e.g. "USD", "kg CO2/yr"). */
  unit: string;
  /** Where in the app this number appears. */
  location: string;
  /**
   * The real value, once filled in. null = still a blank.
   * Stored as a number OR a preformatted string for ranges like "1.1-1.5".
   */
  value: number | string | null;
  /** Citation for the value (MLA-style). Empty until filled. */
  source: string;
}

/** Format an id as a zero-padded #NNN tag. */
export function blankTag(id: number): string {
  return `#${String(id).padStart(3, "0")}`;
}

// Keyed by id for O(1) lookup from <DataChip />.
export const DATA_BLANKS: Record<number, DataBlank> = {
  // ---- Home / About: global + local climate framing ----
  1: {
    id: 1,
    label: "Current global atmospheric CO2 concentration",
    unit: "ppm",
    location: "Home > climate context, About > global framing",
    value: 432,
    source:
      "Pro Oxygen. \"Daily CO2.\" CO2.Earth, https://www.co2.earth/daily-co2. Accessed 5 June 2026.",
  },
  2: {
    id: 2,
    label: "Global average temperature rise since pre-industrial era",
    unit: "deg C",
    location: "Home > climate context, About",
    value: null,
    source: "",
  },
  3: {
    id: 3,
    label: "Annual global CO2 emissions from fossil fuels",
    unit: "gigatonnes CO2/yr",
    location: "About > global framing",
    value: null,
    source: "",
  },
  4: {
    id: 4,
    label: "Sea level rise observed since 1900",
    unit: "cm",
    location: "About > impacts",
    value: null,
    source: "",
  },
  5: {
    id: 5,
    label: "Share of U.S. emissions from transportation",
    unit: "%",
    location: "About > local framing, How to Play",
    value: null,
    source: "",
  },
  6: {
    id: 6,
    label: "Average per-capita CO2 emissions (United States)",
    unit: "tonnes CO2/person/yr",
    location: "About > local framing",
    value: null,
    source: "",
  },
  7: {
    id: 7,
    label: "Number of U.S. communities affected by extreme heat annually",
    unit: "count or %",
    location: "About > local impacts",
    value: null,
    source: "",
  },

  // ---- Shop / Infrastructure realistic costs & impacts ----
  20: {
    id: 20,
    label: "Cost to convert municipal streetlights to LED (per fixture)",
    unit: "USD/fixture",
    location: "Shop > LED Streetlight Conversion",
    value: null,
    source: "",
  },
  21: {
    id: 21,
    label: "CO2 reduction from LED streetlight conversion (county scale)",
    unit: "tonnes CO2/yr",
    location: "Shop > LED Streetlight Conversion",
    value: null,
    source: "",
  },
  22: {
    id: 22,
    label: "CO2 saved per rider shifting from car to public bus",
    unit: "kg CO2/yr/rider",
    location: "Shop > Expanded Public Bus Routes",
    value: null,
    source: "",
  },
  23: {
    id: 23,
    label: "CO2 avoided by commercial recycling program",
    unit: "tonnes CO2/yr",
    location: "Shop > Mandatory Commercial Recycling",
    value: null,
    source: "",
  },
  24: {
    id: 24,
    label: "Cost to install rooftop solar per public building",
    unit: "USD/building",
    location: "Shop > Solar Panels on Public Buildings",
    value: null,
    source: "",
  },
  25: {
    id: 25,
    label: "CO2 offset by a mature urban tree per year",
    unit: "kg CO2/yr/tree",
    location: "Shop > Urban Tree Planting, Tree Planting panel",
    value: null,
    source: "",
  },
  26: {
    id: 26,
    label: "CO2 reduction from green building codes (new construction)",
    unit: "% reduction vs baseline",
    location: "Shop > Green Building Code",
    value: null,
    source: "",
  },
  27: {
    id: 27,
    label: "CO2 saved by electrifying a municipal vehicle fleet",
    unit: "tonnes CO2/yr",
    location: "Shop > Electric County Fleet",
    value: null,
    source: "",
  },
  28: {
    id: 28,
    label: "Efficiency gain from smart grid energy management",
    unit: "% grid loss reduction",
    location: "Shop > Smart Grid Energy Management",
    value: null,
    source: "",
  },
  29: {
    id: 29,
    label: "CO2 captured per direct-air-capture scrubber unit",
    unit: "tonnes CO2/yr/unit",
    location: "Shop > Atmospheric Carbon Scrubber Array",
    value: null,
    source: "",
  },
  30: {
    id: 30,
    label: "CO2 captured per algae bioreactor",
    unit: "tonnes CO2/yr/reactor",
    location: "Shop > Algae Bio-Reactor Carbon Sinks",
    value: null,
    source: "",
  },
  31: {
    id: 31,
    label: "CO2 avoided by geothermal district heating",
    unit: "tonnes CO2/yr",
    location: "Shop > Geothermal District Heating",
    value: null,
    source: "",
  },
  32: {
    id: 32,
    label: "CO2 saved by autonomous electric transit vs private cars",
    unit: "tonnes CO2/yr",
    location: "Shop > Autonomous Electric Transit Pods",
    value: null,
    source: "",
  },
  33: {
    id: 33,
    label: "Energy output of a vertical-axis wind turbine",
    unit: "kWh/yr/turbine",
    location: "Shop > Vertical Wind Turbine Neighborhoods",
    value: null,
    source: "",
  },
  34: {
    id: 34,
    label: "CO2 reduction from carbon-negative concrete vs Portland cement",
    unit: "% per tonne",
    location: "Shop > Carbon-Negative Concrete Initiative",
    value: null,
    source: "",
  },

  // ---- Bills realistic impacts ----
  40: {
    id: 40,
    label: "Plastic waste reduction from single-use plastic ban",
    unit: "tonnes/yr",
    location: "Bills > Ban on Single-Use Plastics",
    value: null,
    source: "",
  },
  41: {
    id: 41,
    label: "Typical revenue from a local carbon tax",
    unit: "USD/yr",
    location: "Bills > Carbon Tax on Local Businesses",
    value: null,
    source: "",
  },
  42: {
    id: 42,
    label: "Energy savings from mandatory home energy audits",
    unit: "% household energy",
    location: "Bills > Mandatory Home Energy Audits",
    value: null,
    source: "",
  },
  43: {
    id: 43,
    label: "Emissions from gas-powered lawn equipment (per hour of use)",
    unit: "kg CO2/hr",
    location: "Bills > Gas-Powered Lawn Equipment Ban",
    value: null,
    source: "",
  },

  // ---- Civic-action: representative & local data ----
  60: {
    id: 60,
    label: "Local representative contact info (state/district lookup)",
    unit: "name + office + email",
    location: "Civic Action > Representative Lookup",
    value: null,
    source: "",
  },
  61: {
    id: 61,
    label: "Climate statistic surfaced to letter writers (fact pool)",
    unit: "varies (see letterFacts.ts)",
    location: "Civic Action > Letter Builder (older students)",
    value: null,
    source: "",
  },
};

/** All blanks as an ordered array (by id). */
export function allBlanks(): DataBlank[] {
  return Object.values(DATA_BLANKS).sort((a, b) => a.id - b.id);
}

/** Blanks that still need a human-supplied value. */
export function unfilledBlanks(): DataBlank[] {
  return allBlanks().filter((b) => b.value === null);
}

/** Distinct, non-empty sources for the bibliography. */
export function aggregatedSources(): { source: string; blankIds: number[] }[] {
  const map = new Map<string, number[]>();
  for (const b of allBlanks()) {
    if (b.source && b.source.trim()) {
      const arr = map.get(b.source) ?? [];
      arr.push(b.id);
      map.set(b.source, arr);
    }
  }
  return [...map.entries()]
    .map(([source, blankIds]) => ({ source, blankIds }))
    .sort((a, b) => a.source.localeCompare(b.source));
}
