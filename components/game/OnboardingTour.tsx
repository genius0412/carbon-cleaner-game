"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface Step {
  /** 1 = essentials (cannot be skipped), 2 = extra tips (skippable). */
  part: 1 | 2;
  selector?: string; // element to spotlight; omit for a centered step
  title: string;
  body: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 10;

/**
 * A skippable, spotlighted onboarding tour. It dims the screen and highlights
 * real UI elements (by [data-tour] attribute) with an opaque explainer card.
 */
export function OnboardingTour({
  open,
  cityName,
  onClose,
}: {
  open: boolean;
  cityName: string;
  onClose: () => void;
}) {
  const steps: Step[] = useMemo(
    () => [
      // ---- Part 1: the essentials (cannot be skipped) ----
      {
        part: 1,
        title: "Welcome, change-maker",
        body: `Your mission: guide ${cityName} to net-zero before the year 2100. First, the essentials, then a few optional tips you can skip.`,
      },
      {
        part: 1,
        selector: '[data-tour="gauges"]',
        title: "Your four vital signs",
        body: "Carbon Gain (per month): drive this to zero to win. Carbon: your current level, don't let it hit the cap. Support: keep people on your side or you lose the power to act. Budget: what you can spend.",
      },
      {
        part: 1,
        selector: '[data-tour="map"]',
        title: "Build & take action",
        body: "Click any region on the map to build clean energy and infrastructure. Terrain matters, match projects to the land. This is how you bend the carbon curve.",
      },
      {
        part: 1,
        selector: '[data-tour="actions"]',
        title: "More actions unlock over time",
        body: "Tree planting, research, bills, and civic action live here. Most start locked, they unlock as your story unfolds, so check back when a new chapter appears.",
      },
      {
        part: 1,
        selector: '[data-tour="controls"]',
        title: "Control the clock",
        body: "Pause or play time, change the speed, and fast-forward (skip a month or a year) here. Time also auto-pauses whenever you open a panel, so you can plan without rushing.",
      },
      // ---- Part 2: extra tips (skippable) ----
      {
        part: 2,
        selector: '[data-tour="clock"]',
        title: "Time is always flowing",
        body: "When unpaused, every month your built projects shift the climate. Watch the date climb toward 2100.",
      },
      {
        part: 2,
        title: "Extras",
        body: "Join a class to put your city on a live scoreboard, and replay this tour anytime from the “?” button.",
      },
      {
        part: 2,
        title: "You're ready 🌍",
        body: `Reach net-zero and put ${cityName} on the map. Good luck!`,
      },
    ],
    [cityName],
  );

  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Reset to the first step each time the tour opens.
  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  const step = steps[i];

  // Track the spotlight target's position (follows layout shifts/resize).
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      if (!step?.selector) {
        setRect(null);
        return;
      }
      const el = document.querySelector(step.selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
    };
    measure();
    const interval = setInterval(measure, 200);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, step]);

  if (!open) return null;

  const last = i === steps.length - 1;
  // Part 1 is mandatory: only part-2 steps expose a skip/close affordance.
  const isPart2 = step.part === 2;
  const next = () => (last ? onClose() : setI((n) => n + 1));
  const back = () => setI((n) => Math.max(0, n - 1));

  // Card placement: centered when no target; otherwise above/below the target.
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const spotlight = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;
  const placeBelow = spotlight ? spotlight.top + spotlight.height < vh * 0.6 : true;

  return (
    <div className="fixed inset-0 z-[120]">
      {/* click blocker; full dim only when there's no spotlight */}
      <div
        className={spotlight ? "absolute inset-0" : "absolute inset-0 bg-night/85 backdrop-blur-sm"}
      />

      {/* spotlight hole (the huge box-shadow dims everything outside it) */}
      <AnimatePresence>
        {spotlight && (
          <motion.div
            className="pointer-events-none absolute rounded-2xl border-2 border-leaf"
            initial={false}
            animate={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{
              boxShadow: "0 0 0 9999px rgba(7,11,10,0.86), 0 0 24px rgba(61,220,132,0.45)",
            }}
          />
        )}
      </AnimatePresence>

      {/* explainer card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          className={
            spotlight
              ? "absolute left-1/2 w-[min(92vw,360px)] -translate-x-1/2"
              : "absolute left-1/2 top-1/2 w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2"
          }
          style={
            spotlight
              ? placeBelow
                ? { top: spotlight.top + spotlight.height + 16 }
                : { top: Math.max(16, spotlight.top - 16), transform: "translate(-50%, -100%)" }
              : undefined
          }
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-2xl border border-leaf/30 bg-charcoal p-5 shadow-[0_12px_48px_rgba(0,0,0,0.55)]">
            <p className="text-[10px] font-medium uppercase tracking-widest text-leaf/80">
              Part {step.part} of 2 · {isPart2 ? "Optional tips" : "Essentials"}
            </p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-fog">{step.title}</h3>
              {isPart2 && (
                <button
                  onClick={onClose}
                  className="shrink-0 rounded-full p-1 text-mist transition-colors hover:bg-white/8 hover:text-fog"
                  aria-label="Skip optional tips"
                  title="Skip optional tips"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-mist">{step.body}</p>

            <div className="mt-4 flex items-center justify-between">
              {/* progress dots */}
              <div className="flex gap-1.5">
                {steps.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === i ? "w-4 bg-leaf" : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {i > 0 && (
                  <Button size="sm" variant="ghost" onClick={back}>
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={next}>
                  {last ? "Start playing" : "Next"}
                </Button>
              </div>
            </div>

            {isPart2 ? (
              !last && (
                <button
                  onClick={onClose}
                  className="mt-3 w-full text-center text-[11px] text-mist transition-colors hover:text-fog"
                >
                  Skip the rest
                </button>
              )
            ) : (
              <p className="mt-3 w-full text-center text-[11px] text-mist/70">
                Quick essentials, optional tips come next.
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
