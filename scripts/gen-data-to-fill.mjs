// Generates DATA_TO_FILL.md from lib/config/dataBlanks.ts.
// Usage: node scripts/gen-data-to-fill.mjs
// Parses the source file with a light regex so it needs no TS toolchain.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = readFileSync(join(root, "lib/config/dataBlanks.ts"), "utf8");

// Extract each blank object literal.
const blanks = [];
const objRe = /(\d+):\s*\{([\s\S]*?)\},/g;
let m;
while ((m = objRe.exec(src))) {
  const body = m[2];
  const get = (key) => {
    const r = new RegExp(key + ':\\s*"((?:[^"\\\\]|\\\\.)*)"');
    const mm = body.match(r);
    return mm ? mm[1] : "";
  };
  const valM = body.match(/value:\s*(null|"[^"]*"|[\d.]+)/);
  const value = valM ? valM[1] : "null";
  blanks.push({
    id: Number(m[1]),
    label: get("label"),
    unit: get("unit"),
    location: get("location"),
    source: get("source"),
    filled: value !== "null",
  });
}
blanks.sort((a, b) => a.id - b.id);

const tag = (id) => `#${String(id).padStart(3, "0")}`;
const lines = [];
lines.push("# DATA_TO_FILL — Carbon Cleaner");
lines.push("");
lines.push(
  "Every **real-world** number in the game is a numbered DATA BLANK. Until you fill it in, the UI shows an amber `[FILL IN #NNN]` pill. To fill one in, open `lib/config/dataBlanks.ts`, set the blank's `value` and `source`, and it will render the real number everywhere and appear on the `/sources` page automatically.",
);
lines.push("");
lines.push(
  "> Game-balance constants (budgets, support %, timelines, etc.) are NOT blanks — they live in `lib/config/gameConstants.ts` and are pre-set.",
);
lines.push("");
const done = blanks.filter((b) => b.filled).length;
lines.push(`**Progress: ${done} / ${blanks.length} filled in.**`);
lines.push("");
lines.push("## Checklist");
lines.push("");
for (const b of blanks) {
  lines.push(
    `- [${b.filled ? "x" : " "}] ${tag(b.id)} — ${b.label} (${b.unit}) — used in: ${b.location} — SOURCE: ${b.source || "____"}`,
  );
}
lines.push("");
writeFileSync(join(root, "DATA_TO_FILL.md"), lines.join("\n"));
console.log(`Wrote DATA_TO_FILL.md with ${blanks.length} blanks (${done} filled).`);
