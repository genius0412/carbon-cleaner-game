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
}: {
  onSelect: (type: CharacterType) => void;
}) {
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
        Each role experiences Verdana differently. Pick the one that fits you.
      </motion.p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {roles.map((r, i) => (
          <motion.button
            key={r.type}
            onClick={() => onSelect(r.type)}
            className="text-left"
            initial={{ opacity: 0, y: 60, rotateX: -25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.15, type: "spring", stiffness: 180, damping: 18 }}
            whileHover={{ y: -8, scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{ transformPerspective: 1000 }}
          >
            <Card className="h-full transition-colors hover:border-leaf/40 hover:glow-leaf">
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
            </Card>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
