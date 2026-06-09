"use client";

/**
 * isoPrimitives.tsx
 * Small reusable kit for drawing isometric structures in SVG. Everything is
 * authored in a local frame whose origin (0,0) is the ground anchor (the point
 * the structure sits on); +x is right, +y is down/screen. Boxes use a 2:1 iso
 * footprint (ry = rx/2) and lift by `h` pixels. Colors: top lightest, left mid,
 * right darkest, derived from a single base color so the set stays consistent.
 */

import type { ReactNode } from "react";
import { shade, tint } from "@/lib/map/iso";

const f = (n: number) => n.toFixed(1);

/** Soft contact shadow under a structure (flattened diamond). */
export function IsoShadow({ rx, opacity = 0.28 }: { rx: number; opacity?: number }) {
  const ry = rx / 2;
  return (
    <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#000" opacity={opacity} />
  );
}

/**
 * A solid isometric box. `rx` is the half-width of the ground diamond in screen
 * px (right/left corners); `ry` defaults to rx/2 for a true 2:1 look. `h` is the
 * height. Rendered as top + front-left + front-right faces.
 */
export function IsoBox({
  rx,
  ry = rx / 2,
  h,
  color,
  x = 0,
  y = 0,
}: {
  rx: number;
  ry?: number;
  h: number;
  color: string;
  x?: number;
  y?: number;
}) {
  // ground corners
  const gTop = `0 ${f(-ry)}`;
  const gRight = `${f(rx)} 0`;
  const gBottom = `0 ${f(ry)}`;
  const gLeft = `${f(-rx)} 0`;
  // top-face corners (lifted by h)
  const tTop = `0 ${f(-ry - h)}`;
  const tRight = `${f(rx)} ${f(-h)}`;
  const tBottom = `0 ${f(ry - h)}`;
  const tLeft = `${f(-rx)} ${f(-h)}`;

  return (
    <g transform={`translate(${f(x)} ${f(y)})`}>
      {/* front-left wall */}
      <path d={`M ${gLeft} L ${gBottom} L ${tBottom} L ${tLeft} Z`} fill={shade(color, 0.22)} />
      {/* front-right wall */}
      <path d={`M ${gBottom} L ${gRight} L ${tRight} L ${tBottom} Z`} fill={shade(color, 0.38)} />
      {/* top face */}
      <path d={`M ${tTop} L ${tRight} L ${tBottom} L ${tLeft} Z`} fill={color} />
    </g>
  );
}

/** Pyramid/hip roof that caps a box of half-width `rx` standing `baseH` tall. */
export function IsoRoof({
  rx,
  ry = rx / 2,
  baseH,
  roofH,
  color,
  x = 0,
  y = 0,
}: {
  rx: number;
  ry?: number;
  baseH: number;
  roofH: number;
  color: string;
  x?: number;
  y?: number;
}) {
  const apex = `0 ${f(-baseH - roofH)}`;
  const left = `${f(-rx)} ${f(-baseH)}`;
  const right = `${f(rx)} ${f(-baseH)}`;
  const front = `0 ${f(ry - baseH)}`;
  return (
    <g transform={`translate(${f(x)} ${f(y)})`}>
      <path d={`M ${left} L ${front} L ${apex} Z`} fill={shade(color, 0.18)} />
      <path d={`M ${front} L ${right} L ${apex} Z`} fill={shade(color, 0.34)} />
    </g>
  );
}

/** A thin iso platform/base the structure stands on. */
export function Platform({ rx, color = "#2a3330", h = 7 }: { rx: number; color?: string; h?: number }) {
  return <IsoBox rx={rx} h={h} color={color} />;
}

/** A simple vertical post (lamp pole, pylon leg). */
export function Post({ x = 0, y = 0, h, w = 2.4, color = "#3a4440" }: { x?: number; y?: number; h: number; w?: number; color?: string }) {
  return <rect x={x - w / 2} y={y - h} width={w} height={h} rx={w / 2} fill={color} />;
}

/** Highlight tint helper re-exported for building authors. */
export const lighten = tint;
export const darken = shade;

/* --- animation wrappers (thin <g> with a CSS class from globals.css) --- */

export const Bob = ({ children }: { children: ReactNode }) => <g className="iso-bob">{children}</g>;
export const Sway = ({ children }: { children: ReactNode }) => <g className="sway">{children}</g>;
export const Spin = ({ children, slow = false }: { children: ReactNode; slow?: boolean }) => (
  <g className={slow ? "iso-spin-slow" : "iso-spin"}>{children}</g>
);
