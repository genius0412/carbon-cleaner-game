"use client";

import { useRef, useState } from "react";
import type { GameState, Region } from "@/lib/engine/types";
import { TERRAIN_COLORS } from "@/lib/engine/regions";
import { infraById } from "@/lib/engine/content";
import { Button } from "@/components/ui/Button";

/**
 * Pan-and-zoom cartoon SVG map. Drag to pan, scroll or buttons to zoom.
 * Clicking a region calls onRegionClick (which opens its panel + auto-pauses).
 */
export function GameMap({
  game,
  onRegionClick,
}: {
  game: GameState;
  onRegionClick: (region: Region) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    moved.current = false;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const nx = e.clientX - dragging.current.x;
    const ny = e.clientY - dragging.current.y;
    if (Math.abs(nx - pan.x) > 3 || Math.abs(ny - pan.y) > 3) moved.current = true;
    setPan({ x: nx, y: ny });
  };
  const onPointerUp = () => {
    dragging.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.6, Math.min(3, z - e.deltaY * 0.0015)));
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-leaf/12 bg-[#081210]">
      {/* zoom controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(3, z + 0.3))}>＋</Button>
        <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.6, z - 0.3))}>－</Button>
        <Button size="sm" variant="ghost" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>⟲</Button>
      </div>

      <div className="absolute left-3 top-3 z-10 rounded-lg bg-night/60 px-3 py-1.5 text-xs text-mist backdrop-blur">
        Drag to pan · scroll to zoom · click a region to act
      </div>

      <svg
        viewBox="0 0 1000 700"
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {/* friendly background sea */}
          <rect x={-200} y={-200} width={1400} height={1100} fill="#0a1816" />
          {game.regions.map((r) => {
            const built = r.builtInfraId ? infraById(r.builtInfraId) : null;
            return (
              <g
                key={r.id}
                onClick={() => {
                  if (!moved.current) onRegionClick(r);
                }}
                className="cursor-pointer"
              >
                <path
                  d={r.path}
                  fill={TERRAIN_COLORS[r.terrain]}
                  fillOpacity={0.85}
                  stroke={built ? "#3ddc84" : "rgba(255,255,255,0.18)"}
                  strokeWidth={built ? 3 : 1.5}
                  className="transition-all hover:fill-opacity-100"
                />
                <text
                  x={r.cx}
                  y={r.cy - 4}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize={13}
                  fontWeight={600}
                  fill="#eafff5"
                >
                  {r.name}
                </text>
                <text
                  x={r.cx}
                  y={r.cy + 14}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize={10}
                  fill="rgba(234,255,245,0.7)"
                >
                  {r.terrain}
                </text>
                {built && (
                  <text
                    x={r.cx}
                    y={r.cy + 40}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fontSize={26}
                  >
                    {built.icon}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
