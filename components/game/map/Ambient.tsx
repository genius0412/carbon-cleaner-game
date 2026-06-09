"use client";

/**
 * Ambient.tsx
 * Map-wide passive life: a few translucent clouds drifting across the sky, each
 * casting a faint shadow that tracks with it. Pure CSS animation (cloud-drift)
 * so it never re-runs in JS and is stilled by prefers-reduced-motion.
 */

const CLOUDS = [
  { y: 40, scale: 1.1, dur: 64, delay: 0, opacity: 0.16 },
  { y: 150, scale: 0.8, dur: 52, delay: -22, opacity: 0.12 },
  { y: 95, scale: 1.4, dur: 80, delay: -48, opacity: 0.1 },
];

function CloudShape() {
  return (
    <g fill="#eaf6f1">
      <ellipse cx={0} cy={0} rx={34} ry={16} />
      <ellipse cx={-26} cy={6} rx={22} ry={12} />
      <ellipse cx={26} cy={6} rx={24} ry={12} />
    </g>
  );
}

export function Ambient() {
  return (
    <g className="pointer-events-none">
      {CLOUDS.map((c, i) => (
        <g
          key={i}
          className="cloud-drift"
          style={{ animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
        >
          {/* soft moving shadow on the land below */}
          <g transform={`translate(0 ${c.y + 230}) scale(${c.scale})`} opacity={0.06}>
            <ellipse cx={0} cy={0} rx={40} ry={10} fill="#000" />
          </g>
          {/* the cloud itself */}
          <g transform={`translate(0 ${c.y}) scale(${c.scale})`} opacity={c.opacity}>
            <CloudShape />
          </g>
        </g>
      ))}
    </g>
  );
}
