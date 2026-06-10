/**
 * Balance lint: in quiz and pick challenges the correct/best option must not
 * be the longest one, or players can win by always picking the longest text.
 * Run: npx tsx scripts/check-answer-lengths.ts
 */
import { STUDENT_CHALLENGES } from "../lib/challenges/studentChallenges.ts";

let bad = 0;
let total = 0;
for (const [id, variants] of Object.entries(STUDENT_CHALLENGES)) {
  variants.forEach((v, vi) => {
    const c = v.challenge;
    if (c.kind === "quiz") {
      c.questions.forEach((q, qi) => {
        total++;
        const lens = q.options.map((o) => o.length);
        if (lens[q.answer] === Math.max(...lens)) {
          bad++;
          console.log(`LONGEST IS CORRECT: quiz ${id} v${vi} q${qi} lens=${lens.join("/")} answer=${q.answer}`);
        }
      });
    }
    if (c.kind === "pick") {
      total++;
      const best = c.options.reduce((m, o, i) => (o.quality > c.options[m].quality ? i : m), 0);
      const lens = c.options.map((o) => o.label.length);
      if (lens[best] === Math.max(...lens)) {
        bad++;
        console.log(`LONGEST IS CORRECT: pick ${id} v${vi} lens=${lens.join("/")} best=${best}`);
      }
    }
  });
}
console.log(`${bad} of ${total} questions still have the longest option as the answer`);
if (bad > 0) process.exit(1);
