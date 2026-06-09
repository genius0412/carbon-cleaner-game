"use client";

/**
 * IsoTile.tsx
 * One isometric terrain slab (top diamond + two shaded side walls) plus a
 * terrain-specific decoration drawn on the top face. The top face is the
 * clickable hit area for opening the region's build panel.
 */

import { memo, useState } from "react";
import type { Region, Terrain } from "@/lib/engine/types";
import {
  tileTopPath,
  tileLeftFacePath,
  tileRightFacePath,
  tileCenter,
  terrainFaces,
  tint,
  TILE_W,
} from "@/lib/map/iso";

const f = (n: number) => n.toFixed(1);

/* ---- per-terrain decorations, drawn in a frame centered on the tile ---- */

function Trees() {
  const tree = (x: number, y: number, s: number) => (
    <g key={`${x},${y}`} transform={`translate(${x} ${y}) scale(${s})`} className="sway">
      <rect x={-1.5} y={-2} width={3} height={9} rx={1} fill="#5b4327" />
      <path d="M 0 -22 L 9 -4 L -9 -4 Z" fill="#2f7d4f" />
      <path d="M 0 -16 L 11 2 L -11 2 Z" fill="#266b43" />
    </g>
  );
  return (
    <g>
      {tree(-22, 6, 0.85)}
      {tree(14, 12, 1)}
      {tree(-2, -8, 0.7)}
      {tree(30, -2, 0.8)}
    </g>
  );
}

function Mountains() {
  const peak = (x: number, y: number, s: number) => (
    <g key={`${x},${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 -34 L 22 6 L -22 6 Z" fill="#6b7886" />
      <path d="M 0 -34 L 8 -18 L -8 -18 Z" fill="#eef4f7" />
      <path d="M 0 -34 L 22 6 L 0 6 Z" fill="#55626f" />
    </g>
  );
  return (
    <g>
      {peak(-14, 8, 1)}
      {peak(18, 12, 0.8)}
      {peak(2, -2, 0.66)}
    </g>
  );
}

function Plains() {
  return (
    <g stroke="#6aa85b" strokeWidth={2} strokeLinecap="round" opacity={0.8}>
      <path className="sway" d="M -26 8 q 2 -8 4 -10" />
      <path className="sway" d="M -10 14 q 2 -8 4 -10" />
      <path className="sway" d="M 12 10 q 2 -8 4 -10" />
      <path className="sway" d="M 28 4 q 2 -8 4 -10" />
      <path className="sway" d="M 0 -2 q 2 -8 4 -10" />
    </g>
  );
}

function Farmland() {
  const rows = [-18, -9, 0, 9, 18];
  return (
    <g>
      {rows.map((o) => (
        <line
          key={o}
          x1={-TILE_W / 2 + 24 + o}
          y1={Math.abs(o) / 2}
          x2={TILE_W / 2 - 24 + o}
          y2={Math.abs(o) / 2}
          stroke="#9c7d2f"
          strokeWidth={2.4}
          opacity={0.6}
        />
      ))}
    </g>
  );
}

function UrbanBlocks() {
  const block = (x: number, y: number, h: number) => (
    <g key={`${x},${y}`} transform={`translate(${x} ${y})`}>
      <path d={`M ${f(-8)} 0 L 0 4 L 0 ${f(4 - h)} L ${f(-8)} ${f(-h)} Z`} fill="#5c636b" />
      <path d={`M 0 4 L 8 0 L 8 ${f(-h)} L 0 ${f(4 - h)} Z`} fill="#474d54" />
      <path d={`M ${f(-8)} ${f(-h)} L 0 ${f(4 - h)} L 8 ${f(-h)} L 0 ${f(-h - 4)} Z`} fill="#6b727a" />
    </g>
  );
  return (
    <g>
      {block(-18, 8, 16)}
      {block(4, 12, 24)}
      {block(22, 2, 14)}
      {block(-2, -6, 20)}
    </g>
  );
}

function Coast() {
  // shimmering water sits on top of the tile's sand-toned slab
  return (
    <g>
      <path
        className="water-shimmer"
        d={`M 0 ${f(-18)} L ${f(34)} 0 L 0 ${f(18)} L ${f(-34)} 0 Z`}
        fill="#3fb6cf"
      />
      <path
        className="water-shimmer"
        d={`M 0 ${f(-9)} L ${f(18)} 0 L 0 ${f(9)} L ${f(-18)} 0 Z`}
        fill="#7fe0ee"
        opacity={0.5}
        style={{ animationDelay: "1.2s" }}
      />
    </g>
  );
}

const DECOR: Record<Terrain, () => React.ReactElement | null> = {
  forest: Trees,
  mountains: Mountains,
  plains: Plains,
  farmland: Farmland,
  urban: UrbanBlocks,
  coast: Coast,
};

function IsoTileImpl({
  region,
  gx,
  gy,
  built,
  onSelect,
}: {
  region: Region;
  gx: number;
  gy: number;
  built: boolean;
  onSelect: (region: Region) => void;
}) {
  const [hover, setHover] = useState(false);
  const { terrain } = region;
  const faces = terrainFaces(terrain);
  const c = tileCenter(gx, gy);
  const topFill = terrain === "coast" ? "#c8b486" : faces.top; // sand under coastal water
  const Decor = DECOR[terrain];

  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(region)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {/* side walls (depth) */}
      <path d={tileLeftFacePath(gx, gy)} fill={faces.left} />
      <path d={tileRightFacePath(gx, gy)} fill={faces.right} />
      {/* top face */}
      <path
        d={tileTopPath(gx, gy)}
        fill={hover ? tint(topFill, 0.12) : topFill}
        stroke={built ? "#3ddc84" : "rgba(255,255,255,0.12)"}
        strokeWidth={built ? 2 : 1}
      />
      {/* terrain decoration, anchored at tile center */}
      <g transform={`translate(${f(c.x)} ${f(c.y)})`}>{Decor ? <Decor /> : null}</g>
      {/* region name tag on the back edge of the tile */}
      <text
        x={c.x}
        y={c.y - 30}
        textAnchor="middle"
        className="pointer-events-none select-none"
        fontSize={11}
        fontWeight={600}
        fill="#eafff5"
        opacity={hover ? 1 : 0.72}
        style={{ paintOrder: "stroke", stroke: "rgba(3,12,10,0.7)", strokeWidth: 3 }}
      >
        {region.name}
      </text>
    </g>
  );
}

export const IsoTile = memo(IsoTileImpl);
