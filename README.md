# 🌍 Carbon Cleaner

A browser-based **climate-strategy game** built as an AP World History civic-action
project on climate change. Lead a fictional U.S. county (population 100,000) to
**carbon net-zero by 2050**, without losing the public's
trust, by building clean infrastructure, funding research, passing legislation,
planting trees, and taking **real-world civic action**.

Carbon Cleaner is designed around five rubric goals: understanding of climate
change, research & use of real data, a concrete actionable solution, a civic-action
final product, and proper citations.

---

## ✨ Features

- **Full Mayor mode**, Shop (infrastructure), Research Corporations, Bills &
  Legislation, and Tree Planting, with a live simulation loop.
- **Student modes**, younger (drag-and-drop letter builder) and older (compose
  from a randomized fact pool); reduced budget & powers, focused on advocacy.
- **Pan-and-zoom cartoon map**, terrain-typed regions, one infrastructure per
  region, terrain efficiency modifiers.
- **Live game loop**, pause/play, 1×/1.5×/2.5× speed, skip-year, and
  **auto-pause** whenever an action panel is open.
- **Research that retroactively boosts** existing related infrastructure.
- **Civic Action**, representative lookup, letter builder, screenshot proof upload
  with a **lenient AI/keyword plausibility check**, and a big in-game boost.
- **Auth + Guest mode**, email/password via Supabase, or play as a guest with a
  copyable **resume code**. Saves persist to Supabase and localStorage.
- **Classroom**, join by code, **live scoreboard** (finishers first by finish
  time, then by lowest carbon gain).
- **Global counter**, "X players have reached net-zero" on the Home page.
- **Downloadable final report (PDF)**, stats, action timeline, civic letter,
  proof screenshot, and MLA bibliography.
- **DATA-BLANK system**, every real-world figure is a numbered, amber
  `[FILL IN #NNN]` chip, tracked in `DATA_TO_FILL.md` and auto-aggregated into the
  `/sources` bibliography.

> The game runs **fully offline** (localStorage) even without Supabase configured,
> Supabase unlocks auth, cross-device saves, classrooms, and the global counter.

---

## 🧱 Tech stack

- **Next.js (App Router) + React + TypeScript**
- **Tailwind CSS v4** (futuristic-eco design system)
- **Supabase**, Auth, Postgres, Realtime/polling, Storage
- **Zustand** for the live game store; **jsPDF** for the report
- Deploy target: **Vercel**

---

## 🚀 Getting started

### 1. Install

```bash
pnpm install      # or npm install
```

### 2. (Optional) Set up Supabase

The game works without this, but Supabase enables accounts, cross-device saves,
classrooms, the global counter, and proof-screenshot storage.

1. Create a project at <https://supabase.com>.
2. In the SQL editor, run the migration in [`supabase/schema.sql`](supabase/schema.sql).
   It creates all tables, Row Level Security policies, the `global_stats` view,
   and the `civic-proof` storage bucket.
3. Copy your project URL and anon key.

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | Supabase public anon key |
| `ANTHROPIC_API_KEY` | optional | AI vision for the civic-action proof check (falls back to keywords) |

Never commit `.env.local`. All secrets live in env vars.

### 4. Run

```bash
pnpm dev
```

Open <http://localhost:3000>.

### 5. Deploy (Vercel)

Push to GitHub, import into Vercel, and add the same environment variables in the
Vercel dashboard. Build command `next build`, output handled automatically.

---

## 📊 Filling in the real data

All real-world numbers are intentionally left blank so they can be backed by
**cited** sources (rubric requirement). To fill one in:

1. Open `lib/config/dataBlanks.ts`.
2. Find the blank by number, set its `value` and MLA-style `source`.
3. The amber `[FILL IN #NNN]` chip in the UI becomes the real number, and the
   citation appears automatically on `/sources` and in the PDF report.

Regenerate the checklist any time:

```bash
node scripts/gen-data-to-fill.mjs
```

See [`DATA_TO_FILL.md`](DATA_TO_FILL.md) for the full to-do list (28 data points).

Team member names/photos (`/team`) and screenshots (`/how-to-play`) also have
`[FILL IN]` placeholders.

---

## 🗂️ Project structure

```
app/                      Next.js App Router pages
  page.tsx                Home (climate context, net-zero counter)
  about/ team/ how-to-play/ sources/   Marketing pages
  login/ signup/          Auth
  play/                   Onboarding + game dashboard orchestrator
  classroom/              Join-by-code live scoreboard
  report/[gameId]/        Final downloadable report
  api/civic-check/        Lenient proof plausibility check
components/
  ui/                     Shared library (Button, Card, Gauge, Modal, Toast, DataChip, FeedbackCard)
  game/                   Dashboard, map, gauges, panels, onboarding, civic action
lib/
  config/                 gameConstants.ts (tunable) + dataBlanks.ts (real data)
  engine/                 Pure simulation core (testable, no UI) + content + regions
  civic/                  Letter builder content + rep lookup stub
  supabase/               Browser + server clients
  saves.ts                Persistence (Supabase + localStorage), guest codes
  store.ts                Zustand live game store + clock loop
  report/pdf.ts           Client-side PDF generation
supabase/schema.sql       Tables, RLS, view, storage bucket
scripts/gen-data-to-fill.mjs   Regenerates DATA_TO_FILL.md
```

The simulation lives entirely in `lib/engine/` (pure functions) so the game logic
is isolated from the UI and easy to reason about or unit-test.

---

## 🎮 How to win

Drive **Carbon Gain/Month to ≤ 0.00 ppm** before December 2050 while keeping at
least minimal public support. You lose if you reach January 2051 without net-zero,
or if atmospheric carbon hits **600 ppm**.

---

Built for a cleaner tomorrow. 🌱
