/**
 * regions.ts
 * The cartoon SVG map of the player's county. Regions are simple blob
 * paths laid out on a 1000x700 viewBox. Terrain drives infrastructure
 * efficiency modifiers (see engine.applyTerrain).
 *
 * Art is intentionally flat/friendly, not realistic geography.
 */

import type { Region, Terrain } from "./types";

interface RegionSeed {
  id: string;
  name: string;
  terrain: Terrain;
  cx: number;
  cy: number;
  /** Isometric grid cell (col 0..4, row 0..2). 5x3 = 15 regions. */
  gx: number;
  gy: number;
}

// Hand-placed regions across the viewBox. Friendly invented place names.
// gx/gy lay the regions onto a contiguous 5x3 isometric landmass.
const SEEDS: RegionSeed[] = [
  { id: "r1", name: "Frostpeak Range", terrain: "mountains", cx: 160, cy: 120, gx: 0, gy: 0 },
  { id: "r2", name: "Cedar Hollow", terrain: "forest", cx: 360, cy: 110, gx: 1, gy: 0 },
  { id: "r3", name: "Goldwheat Flats", terrain: "plains", cx: 560, cy: 120, gx: 2, gy: 0 },
  { id: "r4", name: "Saltmarsh Bay", terrain: "coast", cx: 820, cy: 130, gx: 3, gy: 0 },
  { id: "r5", name: "Ironforge District", terrain: "urban", cx: 250, cy: 300, gx: 4, gy: 0 },
  { id: "r6", name: "Capitol District", terrain: "urban", cx: 480, cy: 300, gx: 0, gy: 1 },
  { id: "r7", name: "Sunmeadow Acres", terrain: "farmland", cx: 690, cy: 300, gx: 1, gy: 1 },
  { id: "r8", name: "Tidewater Harbor", terrain: "coast", cx: 880, cy: 320, gx: 2, gy: 1 },
  { id: "r9", name: "Granite Bluffs", terrain: "mountains", cx: 140, cy: 470, gx: 3, gy: 1 },
  { id: "r10", name: "Whisperwood", terrain: "forest", cx: 360, cy: 490, gx: 4, gy: 1 },
  { id: "r11", name: "Riverbend Fields", terrain: "farmland", cx: 560, cy: 500, gx: 0, gy: 2 },
  { id: "r12", name: "Coral Cove", terrain: "coast", cx: 800, cy: 510, gx: 1, gy: 2 },
  { id: "r13", name: "Highland Mesa", terrain: "plains", cx: 250, cy: 620, gx: 2, gy: 2 },
  { id: "r14", name: "Maplewick Town", terrain: "urban", cx: 480, cy: 620, gx: 3, gy: 2 },
  { id: "r15", name: "Greenhaven Vale", terrain: "forest", cx: 700, cy: 620, gx: 4, gy: 2 },
];

/** Build a soft rounded-blob path centered at (cx, cy). */
function blob(cx: number, cy: number, r = 78): string {
  // a wobbly hexagon-ish blob for friendliness
  const pts: [number, number][] = [
    [cx - r, cy - r * 0.2],
    [cx - r * 0.45, cy - r],
    [cx + r * 0.5, cy - r * 0.9],
    [cx + r, cy - r * 0.1],
    [cx + r * 0.55, cy + r * 0.85],
    [cx - r * 0.5, cy + r],
  ];
  const [first, ...rest] = pts;
  const segs = rest
    .map((p, i) => {
      const prev = i === 0 ? first : rest[i - 1];
      const mx = (prev[0] + p[0]) / 2;
      const my = (prev[1] + p[1]) / 2;
      return `Q ${prev[0].toFixed(0)} ${prev[1].toFixed(0)} ${mx.toFixed(0)} ${my.toFixed(0)}`;
    })
    .join(" ");
  return `M ${first[0]} ${first[1]} ${segs} Q ${rest[rest.length - 1][0]} ${rest[rest.length - 1][1]} ${first[0]} ${first[1]} Z`;
}

export function buildRegions(): Region[] {
  return SEEDS.map((s) => ({
    id: s.id,
    name: s.name,
    terrain: s.terrain,
    cx: s.cx,
    cy: s.cy,
    path: blob(s.cx, s.cy),
    gx: s.gx,
    gy: s.gy,
    builtInfraId: null,
  }));
}

export const TERRAIN_COLORS: Record<Terrain, string> = {
  mountains: "#5b6b7a",
  forest: "#2f7d4f",
  plains: "#7bbf6a",
  coast: "#3aa0b8",
  urban: "#7a7f88",
  farmland: "#c2a14b",
};

export const TERRAIN_LABELS: Record<Terrain, string> = {
  mountains: "Mountains",
  forest: "Forest",
  plains: "Plains",
  coast: "Coast",
  urban: "Urban",
  farmland: "Farmland",
};
