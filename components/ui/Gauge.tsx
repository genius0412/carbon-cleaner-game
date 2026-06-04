interface GaugeProps {
  label: string;
  value: string;
  /** 0..1 fill for the bar; omit for text-only gauges. */
  fill?: number;
  tone?: "leaf" | "cyan" | "amber" | "danger" | "neutral";
  hint?: string;
}

const toneColor: Record<NonNullable<GaugeProps["tone"]>, string> = {
  leaf: "var(--color-leaf)",
  cyan: "var(--color-cyan)",
  amber: "var(--color-amber)",
  danger: "var(--color-danger)",
  neutral: "var(--color-mist)",
};

export function Gauge({ label, value, fill, tone = "leaf", hint }: GaugeProps) {
  const color = toneColor[tone];
  return (
    <div className="glass rounded-xl px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-mist">
          {label}
        </span>
        <span className="font-display text-sm font-semibold" style={{ color }}>
          {value}
        </span>
      </div>
      {fill !== undefined && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(0, Math.min(1, fill)) * 100}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
      )}
      {hint && <p className="mt-1 text-[10px] text-mist/80">{hint}</p>}
    </div>
  );
}
