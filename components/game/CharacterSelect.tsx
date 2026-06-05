"use client";

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
      <h1 className="text-center font-display text-4xl font-semibold">
        Choose your role
      </h1>
      <p className="mt-3 text-center text-mist">
        Each role experiences Verdana differently. Pick the one that fits you.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {roles.map((r) => (
          <button key={r.type} onClick={() => onSelect(r.type)} className="text-left">
            <Card className="h-full transition-all hover:-translate-y-1 hover:border-leaf/40 hover:glow-leaf">
              <div className="text-4xl">{r.icon}</div>
              <h3 className="mt-3 font-display text-xl font-semibold text-fog">{r.title}</h3>
              <p className="text-xs uppercase tracking-wide text-cyan">{r.age}</p>
              <p className="mt-3 text-sm text-mist">{r.desc}</p>
              <ul className="mt-4 space-y-1 text-xs text-fog/80">
                {r.perks.map((p) => (
                  <li key={p}>✓ {p}</li>
                ))}
              </ul>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
