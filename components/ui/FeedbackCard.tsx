"use client";

import { Button } from "./Button";

/**
 * FeedbackCard — the mission-briefing card shown after each purchase/bill.
 * Affirms the climate benefit + names the tradeoff. Time stays paused while
 * it's visible (caller controls the pause).
 */
export interface FeedbackData {
  title: string;
  message: string;
  ok: boolean;
}

export function FeedbackCard({
  data,
  onDismiss,
}: {
  data: FeedbackData | null;
  onDismiss: () => void;
}) {
  if (!data) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] flex justify-center p-4">
      <div
        className={`glass w-full max-w-xl rounded-2xl border-l-4 p-5 ${
          data.ok ? "border-l-leaf glow-leaf" : "border-l-danger"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{data.ok ? "🛰️" : "⚠️"}</span>
          <div className="flex-1">
            <p className="font-display text-sm font-semibold text-fog">
              {data.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-mist">
              {data.message}
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={onDismiss}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
