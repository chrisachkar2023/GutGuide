# GutGuide :)

**Crohn's is personal, so food guidance should be personal too.**

Most food advice for Crohn's disease arrives as a universal "safe foods" list. It does not work,
because tolerance varies enormously between people — the rice that settles one person's gut is
beside the point for someone whose problem is dairy. GutGuide throws the universal list out and
learns from one person's own meals and symptom check-ins instead.

Built for SteelHacks 2026.

---

## What it does

| | |
|---|---|
| **Home** | A read on your week, recent activity, the patterns your log is showing, and one-tap logging. |
| **Search food** | 60+ foods and meals with ingredients, nutrition, characteristics, and a compatibility estimate calculated for *you* — plus your own history with each one. |
| **Menu scanner** | Photograph or paste a restaurant menu. Gemini extracts the dishes and infers the ingredients menus never list (the butter in the sauce, the onion in the base), then every dish is ranked against your history. |
| **Food near you** | Nearby restaurants ranked by their best realistic order for you, not by how "healthy" they are. Uses your real location when you share it. |
| **Cook** | Recipes ordered by fit, with a hands-free guided mode that reads each step aloud and runs the timers, so you are not wiping your hands to scroll. |
| **My progress** | Pain, bloating and energy over time; foods sitting well; candidates worth watching; characteristic-level patterns; meals logged; milestones. |

Every estimate is framed as an estimate. GutGuide never claims a food will or will not cause a flare.

---

## How the personalization actually works

The compatibility score is not a lookup table. For each food it runs
[`lib/scoring/compatibility.ts`](lib/scoring/compatibility.ts) over four layers, strongest first:

1. **Your own history with that exact food.** Each logged meal is linked to the symptom check-ins in
   the following 14 hours ([`lib/scoring/history.ts`](lib/scoring/history.ts)), which classifies the
   meal as easy, mixed or rough.
2. **Patterns learned from your log.** Once a food characteristic (lactose, insoluble fiber, fried,
   low residue…) appears in at least six meals, GutGuide compares your average discomfort *with* it
   against *without* it, and uses that personal delta instead of the generic weight.
3. **General food characteristics** from [`lib/data/traits.ts`](lib/data/traits.ts), used only as a
   fallback where your log has nothing to say yet.
4. **Your profile** — stated preferences, watch list, and whether you are in remission, recovering,
   or flaring.

The result carries a confidence level and a signed factor breakdown, so the interface can show the
arithmetic rather than a black-box number. Two users can search the same food and get very different
scores, which is the entire point.

---

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. **No configuration is needed** — the app boots on a seeded demo profile
("Riley") with 120 days of deterministic meal and symptom history, so every screen is fully
populated and interactive out of the box.

### Optional integrations

Copy `.env.example` to `.env.local` and fill in whichever you want. Each one degrades gracefully:

| Variable | Unlocks | Without it |
|---|---|---|
| `DATABASE_URL` | Persistent logging to Postgres / Tiger Data | Writes go to an in-memory store |
| `GEMINI_API_KEY` | Menu photo reading, model-written explanations and summaries | Deterministic local explanations from the same data |
| `ELEVENLABS_API_KEY` | Spoken guided cooking | The browser's own speech synthesis |

```bash
npm run db:setup   # migrate, promote log tables to hypertables, seed demo history
```

### Checks

```bash
npm run check      # typecheck + lint
npm run build      # production build
```

---

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL · Drizzle ORM ·
Recharts · Gemini API · ElevenLabs · Vercel.

### Layout

```
app/                     routes — home, search, scan, near-you, cook, progress, log
  api/scan               menu extraction + scoring endpoint
  api/voice              ElevenLabs text-to-speech proxy
components/              UI primitives and feature components
lib/
  data/                  food catalog, traits, restaurants, recipes, demo history
  db/                    Drizzle schema and lazy client
  scoring/               history analysis + the compatibility engine
  ai/                    Gemini wrappers, explanations, menu parsing
  insights.ts            trends, tolerated foods, trigger candidates, milestones
drizzle/                 generated SQL migrations
scripts/setup-db.ts      migrate + hypertable + seed
```

### Tiger Data

`meal_logs` and `symptom_logs` are append-only time series keyed on `(id, logged_at)` so they can be
promoted to TimescaleDB hypertables — `npm run db:setup` does this automatically when the extension
is present and falls back to plain Postgres tables when it is not. Every query in the app is a
time-bounded range scan over the user's own window, which is exactly the access pattern hypertables
are built for.

---

## A note on safety

GutGuide is a pattern-spotting tool, not a clinician. It surfaces correlations from a single
person's log — correlations that meals of several foods at once make inherently noisy. It is
designed to give someone better questions to bring to their care team, and it says so on every
screen. It does not diagnose, does not advise on treatment, and does not predict flares.
