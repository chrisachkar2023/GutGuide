# GutGuide :)

**Crohn's is personal, so food guidance should be personal too.**

GutGuide is a personalized food-tracking app for people with Crohn's disease. Instead of relying on universal "safe food" lists, it learns from each user's own meals, symptoms, and patterns to estimate which foods may work better for them.

Built for **SteelHacks 2026**.

---

## What It Does

| Feature           | Description                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Home**          | View weekly trends, recent activity, personalized insights, and quickly log meals or symptoms.                                      |
| **Search Food**   | Browse 60+ foods and meals with ingredients, nutrition, characteristics, personal history, and a compatibility estimate.            |
| **Menu Scanner**  | Upload or paste a restaurant menu. Gemini identifies dishes, estimates hidden ingredients, and ranks options based on your history. |
| **Food Near You** | Find nearby restaurants ranked by the best realistic meal option for you.                                                           |
| **Cook**          | Browse personalized recipes and use a hands-free guided cooking mode with spoken steps and timers.                                  |
| **My Progress**   | Track pain, bloating, energy, tolerated foods, possible triggers, patterns, meals logged, and milestones.                           |

GutGuide always presents compatibility as an **estimate**, never as a guarantee that a food will or will not cause symptoms.

---

## How Personalization Works

GutGuide calculates food compatibility using four main factors:

1. **Your history with the exact food**
   Meals are compared with symptom check-ins from the following 14 hours.

2. **Patterns from your own logs**
   GutGuide learns whether characteristics like lactose, fried foods, insoluble fiber, or low-residue foods tend to affect you.

3. **General food characteristics**
   Used as a fallback when there is not enough personal history yet.

4. **Your profile**
   Includes preferences, foods you are watching, and whether you are in remission, recovering, or flaring.

Each result includes a **confidence level** and factor breakdown so users can understand why a food received its score.

---

## Running It

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

No configuration is required. GutGuide launches with a seeded demo profile containing **120 days of meal and symptom history**, so every feature can be tested immediately.

### Optional Integrations

Copy `.env.example` to `.env.local` and add any integrations you want:

| Variable             | Adds                                        |
| -------------------- | ------------------------------------------- |
| `DATABASE_URL`       | Persistent PostgreSQL / Tiger Data storage  |
| `GEMINI_API_KEY`     | Menu scanning and AI-generated explanations |
| `ELEVENLABS_API_KEY` | AI-powered guided cooking voice             |

Without these integrations, GutGuide automatically falls back to in-memory storage, local explanations, and browser speech synthesis.

### Additional Commands

```bash
npm run db:setup
npm run check
npm run build
```

---

## Tech Stack

**Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL / Tiger Data · Gemini API · ElevenLabs · DigitalOcean**

---

## Safety

GutGuide is a **pattern-spotting tool, not a medical professional**.

It identifies correlations in a user's food and symptom history to help them better understand their patterns and ask more informed questions of their care team.

GutGuide does **not** diagnose conditions, recommend treatments, or predict Crohn's flares.
