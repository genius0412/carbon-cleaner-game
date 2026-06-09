"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { GameState, Region } from "@/lib/engine/types";
import { infraById } from "@/lib/engine/content";
import { paintKey, tileCenter, GRID_COLS } from "@/lib/map/iso";
import { IsoTile } from "@/components/game/map/IsoTile";
import { Building } from "@/components/game/map/Buildings";
import { Ambient } from "@/components/game/map/Ambient";
import { Button } from "@/components/ui/Button";

/**
 * Isometric city-builder map. Drag to pan, scroll or buttons to zoom. Scroll-to-
 * zoom uses a NON-PASSIVE native listener so it never scrolls the page behind it.
 * Regions are drawn back-to-front (painter's algorithm); each built region gets a
 * bespoke animated structure. Clicking a tile opens its panel (auto-pause).
 */
export function GameMap({
  game,
  onRegionClick,
}: {
  game: GameState;
  onRegionClick: (region: Region) => void;
}) {
  const MIN_ZOOM = 0.6;
  const MAX_ZOOM = 3.2;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // drag state captured in SVG (viewBox) coordinates so motion tracks the cursor
  const drag = useRef<{ startStage: { x: number; y: number }; panStart: { x: number; y: number } } | null>(null);
  const moved = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const [isDragging, setIsDragging] = useState(false);

  const clamp = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

  /** Convert client (screen) pixels into the SVG's user/viewBox coordinates. */
  const clientToStage = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  /** Zoom so the point under (clientX, clientY) stays fixed on screen. */
  const zoomAt = (clientX: number, clientY: number, nextZoomRaw: number) => {
    const oldZoom = zoomRef.current;
    const newZoom = clamp(nextZoomRaw);
    if (newZoom === oldZoom) return;
    const c = clientToStage(clientX, clientY);
    if (!c) {
      setZoom(newZoom);
      return;
    }
    const k = newZoom / oldZoom;
    setPan((prev) => ({ x: c.x - k * (c.x - prev.x), y: c.y - k * (c.y - prev.y) }));
    setZoom(newZoom);
  };

  /** Snap the view back to the default (centered, 1x) position. */
  const recenter = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  /** Buttons zoom about the center of the visible map. */
  const zoomByButton = (delta: number) => {
    const el = containerRef.current;
    if (!el) {
      setZoom((z) => clamp(z + delta));
      return;
    }
    const r = el.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, zoomRef.current + delta);
  };

  // Non-passive wheel handler: zoom toward the cursor without scrolling the page.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      zoomAt(e.clientX, e.clientY, zoomRef.current - e.deltaY * 0.0016);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const s = clientToStage(e.clientX, e.clientY);
    if (!s) return;
    drag.current = { startStage: s, panStart: pan };
    moved.current = false;
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const cur = clientToStage(e.clientX, e.clientY);
    if (!cur) return;
    const nx = drag.current.panStart.x + (cur.x - drag.current.startStage.x);
    const ny = drag.current.panStart.y + (cur.y - drag.current.startStage.y);
    if (Math.abs(cur.x - drag.current.startStage.x) > 4 || Math.abs(cur.y - drag.current.startStage.y) > 4)
      moved.current = true;
    setPan({ x: nx, y: ny });
  };
  const onPointerUp = () => {
    drag.current = null;
    setIsDragging(false);
  };

  // Stable selection handler so memoized tiles don't re-render on every pan.
  const selectRef = useRef(onRegionClick);
  selectRef.current = onRegionClick;
  const handleSelect = useCallback((region: Region) => {
    if (!moved.current) selectRef.current(region);
  }, []);

  // Normalize grid coords (old saves may predate gx/gy) and sort back-to-front.
  const tiles = game.regions
    .map((r, idx) => ({
      region: r,
      gx: r.gx ?? idx % GRID_COLS,
      gy: r.gy ?? Math.floor(idx / GRID_COLS),
    }))
    .sort((a, b) => paintKey(a.gx, a.gy) - paintKey(b.gx, b.gy));

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden rounded-2xl border border-leaf/12 bg-[#081210]"
    >
      {/* zoom + recenter controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-11 w-11 !p-0 text-2xl font-bold"
            title="Zoom in"
            onClick={() => zoomByButton(0.3)}
          >
            ＋
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-11 w-11 !p-0 text-2xl font-bold"
            title="Zoom out"
            onClick={() => zoomByButton(-0.3)}
          >
            －
          </Button>
        </div>
        <Button size="md" variant="secondary" onClick={recenter} title="Return to the map">
          🗺️ Return to map
        </Button>
      </div>

      <div className="absolute left-3 top-3 z-10 rounded-lg bg-night/60 px-3 py-1.5 text-xs text-mist backdrop-blur">
        Drag to pan · scroll to zoom · click a region to act
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 1000 700"
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <radialGradient id="sea" cx="50%" cy="42%" r="80%">
            <stop offset="0%" stopColor="#0d2420" />
            <stop offset="100%" stopColor="#06110f" />
          </radialGradient>
        </defs>
        <g
          transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
          style={{ transition: isDragging ? "none" : "transform 0.12s ease-out" }}
        >
          <rect x={-400} y={-400} width={1800} height={1500} fill="url(#sea)" />

          {/* land + structures, painted back-to-front */}
          {tiles.map(({ region, gx, gy }) => {
            const built = region.builtInfraId ? infraById(region.builtInfraId) : null;
            const c = tileCenter(gx, gy);
            return (
              <g key={region.id}>
                <IsoTile region={region} gx={gx} gy={gy} built={!!built} onSelect={handleSelect} />
                <g transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`} className="pointer-events-none">
                  <AnimatePresence mode="wait">
                    {built && <Building key={built.id} infraId={built.id} icon={built.icon} />}
                  </AnimatePresence>
                </g>
              </g>
            );
          })}

          {/* drifting clouds + shadows on top, very subtle */}
          <Ambient />
        </g>
      </svg>
    </div>
  );
}
