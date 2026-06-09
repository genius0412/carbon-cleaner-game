/**
 * content.ts
 * Static game content: infrastructure shop, research corporations, bills,
 * trees. Carbon/cost numbers that should be REALISTIC reference DATA BLANKS
 * (the `dataBlanks` array + amber chips in the UI). Carbon delta values
 * here are gameplay balance constants.
 */

import type {
  InfrastructureDef,
  ResearchDef,
  BillDef,
  TreeDef,
} from "./types";

export const INFRASTRUCTURE: InfrastructureDef[] = [
  // ---- Available from start ----
  {
    id: "led_streetlights",
    name: "County-Wide LED Streetlight Conversion",
    description:
      "Swap every municipal streetlight for efficient LEDs. Cuts grid demand across the county.",
    cost: 180_000,
    carbonDelta: -0.003,
    supportDelta: 2,
    feedback:
      "LEDs use a fraction of the energy of old sodium lamps, an easy win residents notice on their utility bills. Modest carbon savings, and people like brighter, cheaper streets.",
    favoredTerrain: ["urban"],
    requiresResearch: null,
    boostedBy: ["smart_grid"],
    dataBlanks: [20, 21],
    icon: "💡",
  },
  {
    id: "bus_routes",
    name: "Expanded Public Bus Routes",
    description:
      "Add frequent electric-ready bus lines so families can leave the car at home.",
    cost: 320_000,
    carbonDelta: -0.009,
    supportDelta: -2,
    feedback:
      "Every rider who swaps a car commute for the bus removes tailpipe emissions. Some drivers grumble about lane changes, but transit is one of the highest-leverage local levers.",
    favoredTerrain: ["urban", "plains"],
    requiresResearch: null,
    boostedBy: ["transit_pods"],
    dataBlanks: [22],
    icon: "🚌",
  },
  {
    id: "recycling",
    name: "Mandatory Commercial Recycling Program",
    description:
      "Require businesses to sort recyclables, diverting waste from landfill methane.",
    cost: 140_000,
    carbonDelta: -0.004,
    supportDelta: -3,
    feedback:
      "Landfills release methane as waste rots; recycling keeps materials in use and emissions down. Businesses dislike new rules, so expect a small support dip.",
    favoredTerrain: ["urban"],
    requiresResearch: null,
    boostedBy: [],
    dataBlanks: [23],
    icon: "♻️",
  },
  {
    id: "solar_public",
    name: "Solar Panels on Public Buildings",
    description:
      "Cover schools, libraries, and offices with rooftop solar to generate clean power on-site.",
    cost: 450_000,
    carbonDelta: -0.007,
    supportDelta: 3,
    feedback:
      "On-site solar shrinks the county's reliance on fossil power and shields budgets from price spikes. Visible panels signal real action, voters approve.",
    favoredTerrain: ["plains", "urban"],
    requiresResearch: null,
    boostedBy: ["smart_grid"],
    dataBlanks: [24],
    icon: "🔆",
  },
  {
    id: "tree_initiative",
    name: "Urban Tree Planting Initiative",
    description:
      "Launch a county greening program (see the Tree Planting panel to choose species).",
    cost: 90_000,
    carbonDelta: -0.0015,
    supportDelta: 5,
    feedback:
      "Trees pull carbon from the air slowly but steadily, cool neighborhoods, and are wildly popular. The offset is gradual, pair it with faster measures.",
    favoredTerrain: ["forest", "plains", "farmland"],
    requiresResearch: null,
    boostedBy: [],
    dataBlanks: [25],
    icon: "🌳",
  },
  {
    id: "green_building",
    name: "Green Building Code for New Construction",
    description:
      "Require high-efficiency standards on all new builds, pays off over decades.",
    cost: 110_000,
    carbonDelta: -0.005,
    supportDelta: -2,
    feedback:
      "Locking in efficiency at construction time avoids decades of waste. Developers push back on upfront costs, so the support hit is real but the long game is strong.",
    favoredTerrain: ["urban"],
    requiresResearch: null,
    boostedBy: ["green_concrete"],
    dataBlanks: [26],
    icon: "🏗️",
  },

  // ---- Unlocked by research ----
  {
    id: "ev_fleet",
    name: "Electric County Fleet",
    description:
      "Electrify every county-owned vehicle, from buses to maintenance trucks.",
    cost: 700_000,
    carbonDelta: -0.007,
    supportDelta: 1,
    feedback:
      "Public fleets drive predictable routes, perfect for EVs. Eliminating their diesel is a clean, visible commitment that nudges residents toward EVs too.",
    favoredTerrain: ["urban"],
    requiresResearch: "ev_institute",
    boostedBy: ["smart_grid"],
    dataBlanks: [27],
    icon: "🚐",
  },
  {
    id: "smart_grid",
    name: "Smart Grid Energy Management",
    description:
      "Sensors and software that balance load and slash transmission losses, boosts your other clean power.",
    cost: 820_000,
    carbonDelta: -0.006,
    supportDelta: 2,
    feedback:
      "A smart grid wastes less of every clean kilowatt you generate. Research it and your existing solar and EV systems get more efficient automatically.",
    favoredTerrain: ["urban"],
    requiresResearch: "smart_lab",
    boostedBy: [],
    dataBlanks: [28],
    icon: "🔌",
  },
  {
    id: "scrubbers",
    name: "Atmospheric Carbon Scrubber Array",
    description:
      "Direct-air-capture units that pull CO₂ straight from the sky.",
    cost: 1_400_000,
    carbonDelta: -0.014,
    supportDelta: 0,
    feedback:
      "Direct air capture removes carbon that's already up there, the only tool that can take the count down, not just slow it. Energy-hungry and pricey, so power it cleanly.",
    favoredTerrain: ["coast", "urban"],
    requiresResearch: "capture_authority",
    boostedBy: ["smart_grid"],
    dataBlanks: [29],
    icon: "🌀",
  },
  {
    id: "algae",
    name: "Algae Bio-Reactor Carbon Sinks",
    description:
      "Engineered algae tanks that gulp CO₂ and can be harvested for biofuel.",
    cost: 980_000,
    carbonDelta: -0.009,
    supportDelta: 2,
    feedback:
      "Algae captures carbon far faster per acre than trees and yields useful biomass. Coastal and urban water access makes these sites hum.",
    favoredTerrain: ["coast"],
    requiresResearch: "bioseq_center",
    boostedBy: [],
    dataBlanks: [30],
    icon: "🦠",
  },
  {
    id: "geothermal",
    name: "Geothermal District Heating Network",
    description:
      "Tap the earth's heat to warm whole neighborhoods without burning gas.",
    cost: 1_100_000,
    carbonDelta: -0.01,
    supportDelta: 1,
    feedback:
      "Geothermal replaces gas furnaces with steady underground heat, huge winter savings. Mountain geology makes drilling far more productive here.",
    favoredTerrain: ["mountains"],
    requiresResearch: "geothermal_institute",
    boostedBy: [],
    dataBlanks: [31],
    icon: "♨️",
  },
  {
    id: "transit_pods",
    name: "Autonomous Electric Transit Pods",
    description:
      "On-demand self-driving electric pods that make car ownership optional.",
    cost: 1_300_000,
    carbonDelta: -0.011,
    supportDelta: 3,
    feedback:
      "Shared autonomous EVs cut both emissions and traffic, and people love the convenience. They also make your bus network more effective.",
    favoredTerrain: ["urban"],
    requiresResearch: "mobility_lab",
    boostedBy: ["smart_grid"],
    dataBlanks: [32],
    icon: "🛸",
  },
  {
    id: "wind",
    name: "Vertical Wind Turbine Neighborhoods",
    description:
      "Compact vertical-axis turbines that generate power right where people live.",
    cost: 760_000,
    carbonDelta: -0.008,
    supportDelta: 1,
    feedback:
      "Vertical turbines work in gusty, turbulent air that traditional blades can't use, ideal on ridgelines. Distributed power means fewer losses.",
    favoredTerrain: ["mountains", "coast"],
    requiresResearch: "microenergy_group",
    boostedBy: ["smart_grid"],
    dataBlanks: [33],
    icon: "🌬️",
  },
  {
    id: "green_concrete",
    name: "Carbon-Negative Concrete Initiative",
    description:
      "Switch public works to concrete that absorbs more CO₂ than it emits.",
    cost: 890_000,
    carbonDelta: -0.0075,
    supportDelta: 0,
    feedback:
      "Cement is one of the world's biggest emitters; carbon-negative mixes flip that. Every sidewalk and bridge becomes a tiny carbon sink, and it strengthens your building code.",
    favoredTerrain: ["urban"],
    requiresResearch: "green_materials",
    boostedBy: [],
    dataBlanks: [34],
    icon: "🧱",
  },
];

export const RESEARCH: ResearchDef[] = [
  {
    id: "ev_institute",
    name: "Verdana EV Research Institute",
    foundingCost: 500_000,
    monthlyCost: 10_000,
    timelineMonths: 24,
    unlocksInfraId: "ev_fleet",
    description: "Develops the charging and procurement program to electrify the county fleet.",
  },
  {
    id: "smart_lab",
    name: "Smart Infrastructure Lab",
    foundingCost: 600_000,
    monthlyCost: 15_000,
    timelineMonths: 30,
    unlocksInfraId: "smart_grid",
    description: "Builds the sensor + software stack for a self-balancing smart grid.",
  },
  {
    id: "capture_authority",
    name: "Carbon Capture Authority",
    foundingCost: 800_000,
    monthlyCost: 20_000,
    timelineMonths: 48,
    unlocksInfraId: "scrubbers",
    description: "Engineers and sites the county's direct-air-capture scrubber arrays.",
  },
  {
    id: "bioseq_center",
    name: "BioSequestration Science Center",
    foundingCost: 700_000,
    monthlyCost: 15_000,
    timelineMonths: 36,
    unlocksInfraId: "algae",
    description: "Cultivates high-uptake algae strains for carbon-sink bioreactors.",
  },
  {
    id: "geothermal_institute",
    name: "Geothermal Futures Institute",
    foundingCost: 750_000,
    monthlyCost: 20_000,
    timelineMonths: 42,
    unlocksInfraId: "geothermal",
    description: "Maps geology and designs the district geothermal heating network.",
  },
  {
    id: "mobility_lab",
    name: "Advanced Mobility Lab",
    foundingCost: 900_000,
    monthlyCost: 25_000,
    timelineMonths: 54,
    unlocksInfraId: "transit_pods",
    description: "Designs and certifies the autonomous electric transit pod fleet.",
  },
  {
    id: "microenergy_group",
    name: "Micro-Energy Research Group",
    foundingCost: 400_000,
    monthlyCost: 10_000,
    timelineMonths: 20,
    unlocksInfraId: "wind",
    description: "Prototypes neighborhood-scale vertical-axis wind turbines.",
  },
  {
    id: "green_materials",
    name: "Green Materials Science Division",
    foundingCost: 650_000,
    monthlyCost: 15_000,
    timelineMonths: 38,
    unlocksInfraId: "green_concrete",
    description: "Formulates carbon-negative concrete for public works.",
  },
];

export const BILLS: BillDef[] = [
  {
    id: "plastics_ban",
    name: "Ban on Single-Use Plastics",
    description: "Prohibit single-use plastic bags, straws, and foam containers county-wide.",
    supportRequirement: 50,
    carbonDelta: -0.005,
    supportImpact: -8,
    feedback:
      "Less plastic means less petroleum extracted and burned, and cleaner waterways. Some shoppers resist the change, so expect pushback.",
    dataBlanks: [40],
  },
  {
    id: "carbon_tax",
    name: "Carbon Tax on Local Businesses",
    description: "Charge large emitters per tonne of CO₂, funding clean projects.",
    supportRequirement: 50,
    carbonDelta: -0.007,
    supportImpact: -12,
    budgetDelta: 600_000,
    feedback:
      "Pricing carbon makes polluting expensive and clean choices profitable, and it refills your budget. Businesses fight it hard, so support takes a real hit.",
    dataBlanks: [41],
  },
  {
    id: "energy_audits",
    name: "Mandatory Home Energy Audits",
    description: "Require energy audits at point of home sale to flag efficiency upgrades.",
    supportRequirement: 50,
    carbonDelta: -0.006,
    supportImpact: -7,
    feedback:
      "Audits reveal cheap fixes, insulation, sealing, that cut household emissions for years. Homeowners dislike mandates at sale time.",
    dataBlanks: [42],
  },
  {
    id: "lawn_ban",
    name: "Gas-Powered Lawn Equipment Ban",
    description: "Phase out gas mowers and blowers in favor of electric tools.",
    supportRequirement: 50,
    carbonDelta: -0.005,
    supportImpact: -10,
    feedback:
      "Gas lawn equipment is shockingly dirty per hour of use. Landscapers and some homeowners resist, but the air-quality win is immediate.",
    dataBlanks: [43],
  },
  {
    id: "speed_limit",
    name: "County-Wide 20mph Speed Limit",
    description: "Lower urban speed limits to cut fuel burn and save lives.",
    supportRequirement: 50,
    carbonDelta: -0.004,
    supportImpact: -9,
    feedback:
      "Slower city driving burns less fuel and dramatically reduces crashes. Commuters complain about travel time, though.",
    dataBlanks: [],
  },
  {
    id: "ev_mandate",
    name: "Mandatory EV Transition by 2045",
    description: "Require all new vehicle sales to be electric by 2045.",
    supportRequirement: 50,
    carbonDelta: -0.015,
    supportImpact: -15,
    requiresResearch: "ev_institute",
    feedback:
      "A firm deadline gives industry certainty and locks in decades of avoided tailpipe emissions. It's bold, and the support cost reflects that.",
    dataBlanks: [],
  },
  {
    id: "zoning_reform",
    name: "Zoning Reform for Dense Housing",
    description: "Allow walkable, mixed-use density near transit corridors.",
    supportRequirement: 50,
    carbonDelta: -0.007,
    supportImpact: -5,
    slowRecovery: true,
    feedback:
      "Density lets people walk, bike, and ride instead of drive, one of the deepest long-run cuts. Early resistance fades as walkable neighborhoods prove popular.",
    dataBlanks: [],
  },
  {
    id: "cap_trade",
    name: "Industrial Emission Cap & Trade",
    description: "Set a hard emissions cap for industry and let firms trade allowances.",
    supportRequirement: 50,
    carbonDelta: -0.016,
    supportImpact: -14,
    feedback:
      "A shrinking cap guarantees falling industrial emissions while letting the market find the cheapest cuts. Heavy industry lobbies hard against it.",
    dataBlanks: [],
  },
];

export const TREES: TreeDef[] = [
  { id: "spruce", name: "Spruce", costPerBatch: 500, co2PerYearPerTree: 200, dataBlanks: [25] },
  { id: "oak", name: "Oak", costPerBatch: 375, co2PerYearPerTree: 150, dataBlanks: [25] },
  { id: "pine", name: "Pine", costPerBatch: 250, co2PerYearPerTree: 100, dataBlanks: [25] },
  { id: "maple", name: "Maple", costPerBatch: 650, co2PerYearPerTree: 250, dataBlanks: [25] },
  { id: "walnut", name: "Walnut", costPerBatch: 400, co2PerYearPerTree: 175, dataBlanks: [25] },
];

// Lookups
export const infraById = (id: string) => INFRASTRUCTURE.find((i) => i.id === id);
export const researchById = (id: string) => RESEARCH.find((r) => r.id === id);
export const billById = (id: string) => BILLS.find((b) => b.id === id);
export const treeById = (id: string) => TREES.find((t) => t.id === id);
