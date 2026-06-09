"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";

/**
 * FeedbackCard, the mission-briefing card shown after each purchase/bill.
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
  return (
    <AnimatePresence>
      {data && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex justify-center p-4">
          <motion.div
            className={`pointer-events-auto w-full max-w-xl rounded-2xl border border-white/10 border-l-4 bg-charcoal/95 p-5 shadow-2xl backdrop-blur-md ${
              data.ok ? "border-l-leaf glow-leaf" : "border-l-danger"
            }`}
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <div className="flex items-start gap-3">
              <motion.span
                className="text-2xl"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.08, type: "spring", stiffness: 300 }}
              >
                {data.ok ? "🛰️" : "⚠️"}
              </motion.span>
              <div className="flex-1">
                <p className={`font-display text-base font-semibold ${data.ok ? "text-leaf" : "text-danger"}`}>
                  {data.title}
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-fog">{data.message}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={onDismiss}>
                Continue
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
