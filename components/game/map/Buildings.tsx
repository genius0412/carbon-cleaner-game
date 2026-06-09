"use client";

/**
 * Buildings.tsx
 * One bespoke isometric structure per infrastructure id, composed from the
 * shared isoPrimitives kit. Each is authored in a local frame whose origin is
 * the ground anchor. BuildingBase adds the contact shadow + platform and the
 * spring pop-in; a slow CSS bob keeps every structure gently alive. Continuous
 * motion uses CSS classes (see globals.css) so it never re-runs in JS.
 */

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { IsoBox, IsoRoof, IsoShadow, Platform, Post } from "./isoPrimitives";

const f = (n: number) => n.toFixed(1);

/** Shared wrapper: shadow + platform + spring pop-in + idle bob. */
function BuildingBase({ children }: { children: ReactNode }) {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 16 }}
      style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}
    >
      <IsoShadow rx={26} />
      <Platform rx={24} />
      <g className="iso-bob" transform="translate(0 -7)">
        {children}
      </g>
    </motion.g>
  );
}

/* ---------------------------------------------------------------- buildings */

function StreetLights() {
  const lamp = (x: number) => (
    <g key={x} transform={`translate(${x} 0)`}>
      <Post h={20} w={2} color="#5a6b63" />
      <circle cx={0} cy={-22} r={3.4} fill="#f5b942" className="iso-glow" />
      <circle cx={0} cy={-22} r={6} fill="#f5b942" opacity={0.25} className="iso-glow" />
    </g>
  );
  return (
    <g>
      {lamp(-14)}
      {lamp(0)}
      {lamp(14)}
    </g>
  );
}

function BusRoutes() {
  return (
    <g>
      <path d={`M ${f(-26)} 0 L 0 ${f(13)} L ${f(26)} 0 L 0 ${f(-13)} Z`} fill="#33403d" />
      <path d="M -20 0 L 0 10 L 20 0" stroke="#f5b942" strokeWidth={1.6} strokeDasharray="4 4" fill="none" opacity={0.7} />
      <g className="vehicle-shuttle">
        <IsoBox rx={9} h={9} color="#f0c23d" />
        <rect x={-5} y={-9} width={10} height={4} fill="#bfe9ff" opacity={0.8} />
      </g>
    </g>
  );
}

function Recycling() {
  return (
    <g>
      <IsoBox rx={18} h={16} color="#3f8a5c" />
      <g transform="translate(0 -26)">
        <circle r={9} fill="#0d1413" opacity={0.5} />
        <g className="iso-spin-slow">
          <path d="M 0 -7 L 4 -1 L -4 -1 Z" fill="#3ddc84" />
          <path d="M 6 3.5 L 1 6 L 3 0 Z" fill="#3ddc84" />
          <path d="M -6 3.5 L -3 0 L -1 6 Z" fill="#3ddc84" />
        </g>
      </g>
    </g>
  );
}

function SolarPanels() {
  const panel = (x: number, y: number) => (
    <g key={`${x},${y}`} transform={`translate(${x} ${y})`}>
      <path d="M -11 0 L 0 5 L 11 -5 L 0 -10 Z" fill="#15314a" />
      <path d="M -11 0 L 0 5 L 11 -5 L 0 -10 Z" fill="#2f6fb0" opacity={0.55} />
      <path className="glint-sweep" d="M -8 -1 L -2 1.5 L 9 -4 L 3 -6.5 Z" fill="#bfe6ff" />
    </g>
  );
  return (
    <g>
      {panel(-12, 8)}
      {panel(12, 8)}
      {panel(0, 0)}
    </g>
  );
}

function TreeCluster() {
  const tree = (x: number, y: number, s: number) => (
    <g key={`${x},${y}`} transform={`translate(${x} ${y}) scale(${s})`} className="sway">
      <rect x={-2} y={-3} width={4} height={12} rx={1.5} fill="#5b4327" />
      <path d="M 0 -28 L 11 -4 L -11 -4 Z" fill="#3a9a62" />
      <path d="M 0 -20 L 13 4 L -13 4 Z" fill="#2f7d4f" />
    </g>
  );
  return (
    <g>
      {tree(-12, 6, 0.9)}
      {tree(12, 8, 1)}
      {tree(0, -4, 0.75)}
    </g>
  );
}

function GreenBuilding() {
  return (
    <g>
      <IsoBox rx={15} h={40} color="#4a9e86" />
      {/* lit windows */}
      <g fill="#bfe6ff" opacity={0.65}>
        <rect x={-9} y={-34} width={3} height={4} />
        <rect x={-3} y={-31} width={3} height={4} />
        <rect x={-9} y={-24} width={3} height={4} />
        <rect x={-3} y={-21} width={3} height={4} />
      </g>
      {/* slowly rotating crane arm */}
      <g transform="translate(0 -44)">
        <Post h={10} w={2} color="#c9883a" />
        <g className="iso-spin-slow">
          <rect x={-22} y={-1.2} width={44} height={2.4} fill="#e0a24a" />
          <rect x={20} y={-1} width={2} height={10} fill="#e0a24a" />
        </g>
      </g>
    </g>
  );
}

function EvFleet() {
  const ev = (x: number) => (
    <g key={x} transform={`translate(${x} 4)`}>
      <IsoBox rx={8} h={7} color="#3fd6e0" />
      <rect x={-4} y={-7} width={8} height={3} fill="#0d1413" opacity={0.5} />
    </g>
  );
  return (
    <g>
      <IsoBox rx={20} h={14} color="#46606b" />
      {ev(-9)}
      {ev(9)}
      <circle cx={0} cy={-20} r={3} fill="#3ddc84" className="iso-glow" />
    </g>
  );
}

function SmartGrid() {
  const pylon = (x: number) => (
    <g key={x} transform={`translate(${x} 0)`}>
      <path d={`M -6 4 L 0 -26 L 6 4 Z`} fill="none" stroke="#7b8a86" strokeWidth={2} />
      <line x1={-4} y1={-8} x2={4} y2={-8} stroke="#7b8a86" strokeWidth={1.4} />
    </g>
  );
  return (
    <g>
      {pylon(-16)}
      {pylon(16)}
      <line x1={-16} y1={-24} x2={16} y2={-24} stroke="#3fd6e0" strokeWidth={1.4} opacity={0.6} />
      <g transform="translate(0 -24)">
        <circle r={2.6} fill="#3fd6e0" className="energy-pulse" />
      </g>
    </g>
  );
}

function Scrubbers() {
  const tower = (x: number, base: number) => (
    <g key={x} transform={`translate(${x} 0)`}>
      <IsoBox rx={9} h={30} color="#8a9aa3" />
      <ellipse cx={0} cy={-30} rx={9} ry={4.5} fill="#aab8bf" />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={0}
          cy={-32}
          r={5}
          fill="#dfe9ee"
          className="steam-rise"
          style={{ animationDelay: `${base + i * 0.9}s` }}
        />
      ))}
    </g>
  );
  return (
    <g>
      {tower(-11, 0)}
      {tower(11, 0.6)}
    </g>
  );
}

function Algae() {
  const tank = (x: number) => (
    <g key={x} transform={`translate(${x} 0)`}>
      <IsoBox rx={11} h={14} color="#3f8a5c" />
      <ellipse cx={0} cy={-14} rx={11} ry={5.5} fill="#6fd08a" />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={i * 3 - 3}
          cy={-15}
          r={1.8}
          fill="#cffadb"
          className="bubble-rise"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}
    </g>
  );
  return (
    <g>
      {tank(-12)}
      {tank(12)}
    </g>
  );
}

function Geothermal() {
  const vent = (x: number, d: string) => (
    <g key={x} transform={`translate(${x} 0)`}>
      <IsoBox rx={8} h={18} color="#6d5a72" />
      <ellipse cx={0} cy={-18} rx={8} ry={4} fill="#8a7690" />
      <circle cx={0} cy={-20} r={5} fill="#f5b942" opacity={0.5} className="steam-rise" style={{ animationDelay: d }} />
    </g>
  );
  return (
    <g>
      {vent(-10, "0s")}
      {vent(11, "1s")}
    </g>
  );
}

function TransitPods() {
  return (
    <g>
      {/* elevated track */}
      <g transform="translate(0 -16)">
        <path d={`M ${f(-26)} 0 L 0 ${f(13)} L ${f(26)} 0`} fill="none" stroke="#4a606b" strokeWidth={3} />
        <Post x={-20} y={20} h={20} color="#4a606b" />
        <Post x={20} y={20} h={20} color="#4a606b" />
      </g>
      <g className="vehicle-shuttle" transform="translate(0 -16)">
        <ellipse cx={0} cy={0} rx={9} ry={5} fill="#3fd6e0" />
        <ellipse cx={0} cy={-1.5} rx={6} ry={2.5} fill="#bfeef3" opacity={0.8} />
      </g>
    </g>
  );
}

function WindTurbine() {
  return (
    <g>
      <Post h={42} w={3} color="#d6dee0" />
      <g transform="translate(0 -42)">
        <circle r={2.6} fill="#aeb9bc" />
        <g className="iso-spin">
          {[0, 120, 240].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d="M 0 0 L 2.2 -22 L -2.2 -22 Z" fill="#eef4f5" />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}

function GreenConcrete() {
  return (
    <g>
      <IsoBox rx={18} h={18} color="#7d8a86" />
      <IsoRoof rx={18} baseH={18} roofH={8} color="#7d8a86" />
      {/* conveyor with advancing blocks */}
      <g transform="translate(14 6)">
        <rect x={-4} y={-2} width={20} height={3} fill="#4a524f" transform="skewX(-30)" />
        {[0, 1].map((i) => (
          <rect
            key={i}
            x={0}
            y={-5}
            width={4}
            height={4}
            fill="#cdb89a"
            className="vehicle-shuttle"
            style={{ animationDelay: `${i * 1.2}s` }}
          />
        ))}
      </g>
    </g>
  );
}

function Generic({ icon }: { icon: string }) {
  return (
    <g>
      <IsoBox rx={16} h={16} color="#4a606b" />
      <text x={0} y={-20} textAnchor="middle" fontSize={18} className="select-none">
        {icon}
      </text>
    </g>
  );
}

/** infra id → structure component. */
const REGISTRY: Record<string, () => ReactNode> = {
  led_streetlights: StreetLights,
  bus_routes: BusRoutes,
  recycling: Recycling,
  solar_public: SolarPanels,
  tree_initiative: TreeCluster,
  green_building: GreenBuilding,
  ev_fleet: EvFleet,
  smart_grid: SmartGrid,
  scrubbers: Scrubbers,
  algae: Algae,
  geothermal: Geothermal,
  transit_pods: TransitPods,
  wind: WindTurbine,
  green_concrete: GreenConcrete,
};

/** Render the structure for an infra id at a tile center (caller translates). */
export function Building({ infraId, icon }: { infraId: string; icon: string }) {
  const Structure = REGISTRY[infraId];
  return <BuildingBase>{Structure ? <Structure /> : <Generic icon={icon} />}</BuildingBase>;
}
