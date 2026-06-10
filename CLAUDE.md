# Carbon Cleaner

A climate-strategy game built as an AP World History civic-action project. Next.js 16 + React 19 + Tailwind 4 + Zustand + Supabase. The simulation engine is pure TypeScript in `lib/engine/` (no React imports there).

## Writing player-facing text

Every string a player can see must read like a person wrote it.

- No em dashes. Use commas, periods, or parentheses.
- Don't lead with colons ("The catch: ...") or stack label-colon fragments. Write sentences.
- Don't reach for bullet lists in prose. Lists are for genuinely enumerable things (stats, controls), not for explaining ideas.
- Ban filler transitions like "not only that", "what's more", "furthermore".
- Never show developer-facing copy. No file names, table names, "Supabase", "schema", "data blanks", "[FILL IN]", or instructions meant for whoever maintains the site. Error messages say what the player can do, not what broke internally.
- Keep it short. If a sentence works without a clause, drop the clause.

## Game facts that copy and code must respect

- The world is the player's own fictional U.S. county. They name it (the field is still called `cityName` in code and `city_name` in the DB, display copy says county). Story dialogue uses the `{county}` placeholder, substituted in `nextStoryBeat`.
- Carbon impacts are always shown in the gauge's unit, ppm/mo, via `gainCut()` in `components/game/impact.ts`. Never percentages.
- Winning means holding effective carbon gain at or below zero for `GAME.netZeroHoldMonths` (12) consecutive months before 2050. Copy that explains winning must include the hold.
- Story beat triggers must be monotonic (once true, stays true). Use `monthsElapsed()` comparisons, never exact year/month windows, or skip-year jumps over them.

## Balance

Mayor mode is meant to be hard, student mode attainable with steady effort. Tuning lives in `lib/config/gameConstants.ts`, `lib/engine/content.ts`, and `lib/engine/studentActions.ts`. After touching any of it, run:

```
npx tsx scripts/sim-test.ts
```

It asserts a strong mayor bot wins but never before 2034, a diligent student wins by 2046 but never before 2029, and a letter-only student loses. Don't change those targets without being asked.

When adding or editing challenge content in `lib/challenges/studentChallenges.ts`, also run `npx tsx scripts/check-answer-lengths.ts`. It fails if any quiz or pick challenge has its correct answer as the longest option (players learn to just pick the longest text).

## Tooling

- Package manager is pnpm (`pnpm add ...`). npm fails on this repo.
- `npx tsc --noEmit` to typecheck. `next lint` is broken under Next 16.
- Supabase schema is `supabase/schema.sql`, written to be re-runnable. One-time migrations for the live DB go in `supabase/` as small standalone `.sql` files with a comment saying when to run them.
