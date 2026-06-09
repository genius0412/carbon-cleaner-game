/**
 * iso.ts
 * Framework-agnostic isometric math for the city-builder map. The 15 regions
 * live on a 5x3 grid (gx 0..4, gy 0..2) projected with a standard 2:1 iso
 * transform into the SVG's 1000x700 viewBox. Pure functions only, no React.
 */

import type { Terrain } from "@/lib/engine/types";
import { TERRAIN_COLORS } from "@/lib/engine/regions";

/** Diamond tile footprint. 2:1 ratio is what makes it read as isometric. */
export const TILE_W = 150;
export const TILE_H = 75;
/** Vertical thickness of the tile slab (the visible "depth" walls). */
export const SLAB_H = 24;

/** Grid extent (5 cols x 3 rows = 15 regions). */
export const GRID_COLS = 5;
export const GRID_ROWS = 3;

/** Offset that centers the diamond inside the 1000x700 viewBox. */
export const ORIGIN_X = 425;
export const ORIGIN_Y = 170;

export interface Pt {
  x: number;
  y: number;
}

/** Project a grid cell to the center of its tile's top face (screen coords). */
export function tileCenter(gx: number, gy: number): Pt {
  return {
    x: ORIGIN_X + (gx - gy) * (TILE_W / 2),
    y: ORIGIN_Y + (gx + gy) * (TILE_H / 2),
  };
}

/** The four corners of a tile's top diamond face. */
export function tileCorners(gx: number, gy: number) {
  const c = tileCenter(gx, gy);
  return {
    top: { x: c.x, y: c.y - TILE_H / 2 },
    right: { x: c.x + TILE_W / 2, y: c.y },
    bottom: { x: c.x, y: c.y + TILE_H / 2 },
    left: { x: c.x - TILE_W / 2, y: c.y },
  };
}

const p = (pt: Pt) => `${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;

/** Path for the diamond top face. */
export function tileTopPath(gx: number, gy: number): string {
  const k = tileCorners(gx, gy);
  return `M ${p(k.top)} L ${p(k.right)} L ${p(k.bottom)} L ${p(k.left)} Z`;
}

/** Front-left side wall (left corner → bottom corner, extruded down by SLAB_H). */
export function tileLeftFacePath(gx: number, gy: number): string {
  const k = tileCorners(gx, gy);
  return `M ${p(k.left)} L ${p(k.bottom)} L ${p({ x: k.bottom.x, y: k.bottom.y + SLAB_H })} L ${p({
    x: k.left.x,
    y: k.left.y + SLAB_H,
  })} Z`;
}

/** Front-right side wall (bottom corner → right corner, extruded down). */
export function tileRightFacePath(gx: number, gy: number): string {
  const k = tileCorners(gx, gy);
  return `M ${p(k.bottom)} L ${p(k.right)} L ${p({ x: k.right.x, y: k.right.y + SLAB_H })} L ${p({
    x: k.bottom.x,
    y: k.bottom.y + SLAB_H,
  })} Z`;
}

/**
 * Painter's-algorithm sort key: tiles with a larger (gx + gy) are nearer the
 * camera and must be drawn later so they overlap the ones behind them.
 */
export function paintKey(gx: number, gy: number): number {
  return gx + gy;
}

/** Darken a hex color toward black by `amount` (0..1). Used for slab walls. */
export function shade(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Lighten a hex color toward white by `amount` (0..1). Used for highlights. */
export function tint(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  const r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * amount);
  const g = Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * amount);
  const b = Math.round((n & 255) + (255 - (n & 255)) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Per-terrain face colors (top + the two darker side walls). */
export function terrainFaces(terrain: Terrain) {
  const base = TERRAIN_COLORS[terrain];
  return {
    top: base,
    left: shade(base, 0.18),
    right: shade(base, 0.32),
  };
}
