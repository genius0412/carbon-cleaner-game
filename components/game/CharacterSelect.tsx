"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import type { CharacterType } from "@/lib/engine/types";

const roles: {
  type: CharacterType;
  icon: string;
  title: string;
  age: string;
  desc: string;
  perks: string[];
}[] = [
  {
    type: "mayor",
    icon: "🏛️",
    title: "Mayor",
    age: "Full powers",
    desc: "The complete toolset: build infrastructure, found research corporations, pass legislation, and plant trees.",
    perks: ["$2M starting budget", "Shop · Research · Bills · Trees", "The full strategy loop"],
  },
  {
    type: "student_older",
    icon: "🎓",
    title: "Student (14–18)",
    age: "Older student",
    desc: "Limited budget and local actions. You make real change through advocacy. You can write your own letter from data and submit proof.",
    perks: ["Smaller budget", "Local actions only", "Write your own letter for a big boost"],
  },
  {
    type: "student_younger",
    icon: "📚",
    title: "Student (9–14)",
    age: "Younger student",
    desc: "Simplified play. Assemble a letter by dragging pre-written sentence blocks into order, then send it for real.",
    perks: ["Simplified interactions", "Drag-and-drop letter builder", "Real-world action boost"],
  },
];

export function CharacterSelect({
  onSelect,
  allowedRoles,
}: {
  onSelect: (type: CharacterType) => void;
  /** When set, only these roles are offered (e.g. a class restricts choices). */
  allowedRoles?: CharacterType[] | null;
}) {
  // A class restriction is active only when the teacher picked a non-empty
  // subset. Roles outside that subset are shown but LOCKED (not removed), so
  // students can see the full set and understand what the teacher disabled.
  const restricted = !!(allowedRoles && allowedRoles.length > 0);
  const isLocked = (type: CharacterType) =>
    restricted && !allowedRoles!.includes(type);
  return (
    <div className="mx-auto max-w-5xl">
      <motion.h1
        className="text-center font-display text-4xl font-semibold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Choose your role
      </motion.h1>
      <motion.p
        className="mt-3 text-center text-mist"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {restricted
          ? "Your teacher locked some roles for this class. Pick one of the available roles below."
          : "Each role experiences the county differently. Pick the one that fits you."}
      </motion.p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {roles.map((r, i) => {
          const locked = isLocked(r.type);
          return (
            <motion.button
              key={r.type}
              onClick={() => !locked && onSelect(r.type)}
              disabled={locked}
              aria-disabled={locked}
              title={locked ? "Disabled by your teacher" : undefined}
              className={`text-left ${locked ? "cursor-not-allowed" : ""}`}
              initial={{ opacity: 0, y: 60, rotateX: -25, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.15, type: "spring", stiffness: 180, damping: 18 }}
              whileHover={locked ? undefined : { y: -8, scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 22 } }}
              whileTap={locked ? undefined : { scale: 0.98, transition: { duration: 0.1 } }}
              style={{ transformPerspective: 1000 }}
            >
              <Card
                className={`relative h-full overflow-hidden transition-colors ${
                  locked
                    ? "border-white/8"
                    : "hover:border-leaf/40 hover:glow-leaf"
                }`}
              >
                {/* Locked overlay: chains + padlock + reason. Sits above the
                    (dimmed) card content and ignores pointer events. */}
                {locked && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-night/75 backdrop-grayscale">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-night/90 text-3xl shadow-lg">
                      🔒
                    </div>
                    <p className="max-w-[85%] text-center text-xs font-medium text-fog">
                      Disabled by your teacher
                    </p>
                  </div>
                )}

                <div className={locked ? "opacity-40" : ""}>
                  <motion.div
                    className="text-4xl"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 260 }}
                  >
                    {r.icon}
                  </motion.div>
                  <h3 className="mt-3 font-display text-xl font-semibold text-fog">{r.title}</h3>
                  <p className="text-xs uppercase tracking-wide text-cyan">{r.age}</p>
                  <p className="mt-3 text-sm text-mist">{r.desc}</p>
                  <ul className="mt-4 space-y-1 text-xs text-fog/80">
                    {r.perks.map((p) => (
                      <li key={p}>✓ {p}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
