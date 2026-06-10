"use client";

import { useState } from "react";
import { DATA_BLANKS } from "@/lib/config/dataBlanks";

/**
 * DataChip renders a real-world data point. Hover/tap reveals what the number
 * is and its source. Unfilled values render as a neutral "—".
 */
export function DataChip({ id, suffix }: { id: number; suffix?: string }) {
  const [open, setOpen] = useState(false);
  const blank = DATA_BLANKS[id];

  if (!blank) return <span>—</span>;

  const filled = blank.value !== null && blank.value !== "";

  return (
    <span className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={
          filled
            ? "cursor-help font-semibold text-cyan underline decoration-dotted underline-offset-2"
            : "cursor-help rounded-md border border-amber/50 bg-amber/20 px-1.5 py-0.5 text-xs font-semibold text-amber"
        }
      >
        {filled ? (
          <>
            {blank.value}
            {blank.unit ? `${blank.unit.startsWith("%") ? "" : " "}${blank.unit}` : ""}
            {suffix ?? ""}
          </>
        ) : (
          "—"
        )}
      </button>
      {open && (
        <span className="absolute bottom-full left-0 z-50 mb-1 w-64 rounded-lg border border-amber/30 bg-charcoal p-2.5 text-left text-[11px] leading-snug text-fog shadow-xl">
          <span className="block font-semibold text-amber">{blank.label}</span>
          {filled && blank.source ? (
            <span className="mt-1 block text-mist">Source: {blank.source}</span>
          ) : (
            <span className="mt-1 block text-mist">Source coming soon.</span>
          )}
        </span>
      )}
    </span>
  );
}
