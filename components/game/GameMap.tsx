"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameState, Region } from "@/lib/engine/types";
import { TERRAIN_COLORS } from "@/lib/engine/regions";
import { infraById } from "@/lib/engine/content";
import { Button } from "@/components/ui/Button";

/**
 * Pan-and-zoom cartoon SVG map. Drag to pan, scroll or buttons to zoom.
 * Scroll-to-zoom is bound with a NON-PASSIVE native listener so it never
 * scrolls the page behind it. Clicking a region opens its panel (auto-pause).
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
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Non-passive wheel handler: zoom the map without scrolling the page.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const z = Math.max(0.6, Math.min(3.2, zoomRef.current - e.deltaY * 0.0016));
      setZoom(z);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

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

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden rounded-2xl border border-leaf/12 bg-[#081210]"
    >
      {/* zoom controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(3.2, z + 0.3))}>＋</Button>
        <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.6, z - 0.3))}>－</Button>
        <Button size="sm" variant="ghost" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>⟲</Button>
      </div>

      <div className="absolute left-3 top-3 z-10 rounded-lg bg-night/60 px-3 py-1.5 text-xs text-mist backdrop-blur">
        Drag to pan · scroll to zoom · click a region to act
      </div>

      <svg
        viewBox="0 0 1000 700"
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <defs>
          <radialGradient id="sea" cx="50%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#0d2420" />
            <stop offset="100%" stopColor="#06110f" />
          </radialGradient>
        </defs>
        <g
          transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
          style={{ transition: dragging.current ? "none" : "transform 0.18s ease-out" }}
        >
          <rect x={-400} y={-400} width={1800} height={1500} fill="url(#sea)" />
          {game.regions.map((r, idx) => {
            const built = r.builtInfraId ? infraById(r.builtInfraId) : null;
            return (
              <g
                key={r.id}
                onClick={() => {
                  if (!moved.current) onRegionClick(r);
                }}
                className="cursor-pointer"
              >
                <motion.path
                  d={r.path}
                  fill={TERRAIN_COLORS[r.terrain]}
                  fillOpacity={0.85}
                  stroke={built ? "#3ddc84" : "rgba(255,255,255,0.18)"}
                  strokeWidth={built ? 3 : 1.5}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03, duration: 0.4 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  whileHover={{ fillOpacity: 1 }}
                />
                <text x={r.cx} y={r.cy - 4} textAnchor="middle" className="pointer-events-none select-none" fontSize={13} fontWeight={600} fill="#eafff5">
                  {r.name}
                </text>
                <text x={r.cx} y={r.cy + 14} textAnchor="middle" className="pointer-events-none select-none" fontSize={10} fill="rgba(234,255,245,0.7)">
                  {r.terrain}
                </text>
                {built && (
                  <motion.text
                    x={r.cx}
                    y={r.cy + 42}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fontSize={28}
                    initial={{ scale: 0, y: r.cy + 20, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16 }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  >
                    {built.icon}
                  </motion.text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
