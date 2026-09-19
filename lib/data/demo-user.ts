import { FOODS, getFood } from "@/lib/data/foods";
import type { MealLog, Portion, SymptomLog, UserProfile } from "@/lib/types";

export const DEMO_USER_ID = "demo-user";

export const DEMO_PROFILE: UserProfile = {
  id: DEMO_USER_ID,
  name: "Riley",
  diagnosedYear: 2019,
  phase: "recovering",
  restrictions: ["lactose-free"],
  watchTraits: ["lactose", "insoluble-fiber", "seeds-nuts", "fried"],
  favoriteCuisines: ["Japanese", "Mediterranean", "Vietnamese"],
  dislikes: ["Olives", "Blue cheese"],
  goal: "Eat out with friends again without planning my whole week around it.",
};

/* ------------------------------------------------------------------ *
 * Deterministic demo history.
 *
 * Generated from a fixed seed so every run of the demo tells the same
 * story: Riley reacts to lactose and abrasive fiber, does well on soft
 * low-residue meals, and came out of a rough stretch about two months
 * ago. Same shape as what the database returns.
 * ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hidden "ground truth" the app is meant to discover from the logs. */
const TRAIT_IMPACT: Record<string, number> = {
  lactose: 3.4,
  "insoluble-fiber": 2.9,
  "seeds-nuts": 2.6,
  fried: 1.9,
  "high-fat": 1.1,
  spicy: 1.4,
  "high-fodmap": 0.9,
  alcohol: 1.6,
  carbonated: 0.6,
  caffeine: 0.7,
  "sugar-alcohol": 1.8,
  raw: 0.8,
  "low-residue": -1.0,
  "easily-digested": -1.1,
  "cooked-soft": -0.7,
  "soluble-fiber": -0.6,
  hydrating: -0.5,
  "low-fodmap": -0.4,
};

const BREAKFASTS: string[][] = [
  ["oatmeal", "ripe-banana"],
  ["scrambled-eggs", "sourdough-bread"],
  ["greek-yogurt", "blueberries"],
  ["rice-cakes", "peanut-butter"],
  ["oatmeal", "applesauce"],
  ["scrambled-eggs", "white-rice"],
  ["coffee", "sourdough-bread"],
];

const LUNCHES: string[][] = [
  ["grilled-chicken", "white-rice", "steamed-carrots"],
  ["chicken-noodle-soup"],
  ["salmon-roll"],
  ["burrito-bowl"],
  ["canned-tuna", "saltine-crackers"],
  ["poke-bowl"],
  ["kale-salad", "grilled-chicken"],
  ["margherita-pizza"],
  ["chicken-shawarma"],
];

const DINNERS: string[][] = [
  ["baked-salmon", "mashed-potato", "green-beans"],
  ["ground-turkey", "rice-noodles", "zucchini"],
  ["congee", "grilled-chicken"],
  ["white-pasta", "grilled-chicken", "olive-oil"],
  ["butter-chicken", "white-rice"],
  ["cheeseburger-fries"],
  ["pad-thai"],
  ["firm-tofu", "white-rice", "sauteed-spinach"],
  ["shrimp", "rice-noodles", "steamed-carrots"],
  ["ribeye-steak", "mashed-potato"],
];

const SNACKS: string[][] = [
  ["saltine-crackers"],
  ["ripe-banana"],
  ["pretzels"],
  ["almonds"],
  ["protein-bar"],
  ["popcorn"],
  ["ice-cream"],
  ["peppermint-tea"],
  ["rice-cakes", "peanut-butter"],
];

const MEAL_NAMES: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function titleFor(slot: string, foodIds: string[]): string {
  const names = foodIds.map((id) => getFood(id)?.name ?? id);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} + ${names[names.length - 1]}`
    .replace(/^(.{44}).+$/, "$1…")
    || MEAL_NAMES[slot];
}

const DAYS = 120;
const MS_DAY = 86_400_000;

type Generated = { meals: MealLog[]; symptoms: SymptomLog[] };

function generate(nowMs: number): Generated {
  const rand = mulberry32(20260919);
  const meals: MealLog[] = [];
  const symptoms: SymptomLog[] = [];
  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);

  for (let dayOffset = DAYS - 1; dayOffset >= 0; dayOffset--) {
    const dayStart = startOfToday.getTime() - dayOffset * MS_DAY;

    // A rough stretch roughly two months back, easing as it gets recent.
    const flareBump = dayOffset > 55 && dayOffset < 78 ? 2.4 : 0;
    const recoveryTrend = (1 - (DAYS - dayOffset) / DAYS) * 1.6;

    const slots: [string, string[][], number][] = [
      ["breakfast", BREAKFASTS, 8],
      ["lunch", LUNCHES, 12.5],
      ["dinner", DINNERS, 19],
    ];
    if (rand() < 0.55) slots.push(["snack", SNACKS, 15.5]);

    let dayTriggerLoad = 0;

    for (const [slot, pool, hour] of slots) {
      if (rand() < 0.08) continue; // not every meal gets logged, like real life
      const foodIds = pick(rand, pool);
      const minutes = Math.floor(rand() * 50);
      const loggedAt = new Date(dayStart + hour * 3_600_000 + minutes * 60_000);
      if (loggedAt.getTime() > nowMs) continue;

      const portion: Portion = rand() < 0.18 ? "small" : rand() < 0.88 ? "regular" : "large";
      const portionWeight = portion === "small" ? 0.6 : portion === "large" ? 1.35 : 1;

      for (const id of foodIds) {
        const food = getFood(id);
        if (!food) continue;
        for (const t of food.traits) {
          dayTriggerLoad += (TRAIT_IMPACT[t] ?? 0) * portionWeight * 0.55;
        }
      }

      meals.push({
        id: `meal-${meals.length + 1}`,
        userId: DEMO_USER_ID,
        name: titleFor(slot, foodIds),
        foodIds,
        loggedAt: loggedAt.toISOString(),
        portion,
        source: "manual",
      });
    }

    // One evening symptom check-in per day, plus an occasional midday one.
    const checkIns = rand() < 0.3 ? [13, 21] : [21];
    for (const hour of checkIns) {
      const loggedAt = new Date(dayStart + hour * 3_600_000 + Math.floor(rand() * 40) * 60_000);
      if (loggedAt.getTime() > nowMs) continue;

      const noise = () => (rand() - 0.5) * 2.2;
      const base = 1.5 + flareBump + recoveryTrend;
      const load = dayTriggerLoad * (hour === 13 ? 0.45 : 1);

      const pain = clamp(base + load * 0.42 + noise());
      const bloating = clamp(base + load * 0.55 + noise());
      const urgency = clamp(base * 0.8 + load * 0.38 + noise());
      const energy = clamp(8.2 - (pain + bloating) * 0.42 - flareBump * 0.5 + noise());

      symptoms.push({
        id: `symptom-${symptoms.length + 1}`,
        userId: DEMO_USER_ID,
        loggedAt: loggedAt.toISOString(),
        pain,
        bloating,
        energy,
        urgency,
      });
    }
  }

  return { meals, symptoms };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v * 10) / 10));
}

let cache: { key: string; data: Generated } | null = null;

/** Demo history, regenerated at most once per hour so "today" stays fresh. */
export function demoHistory(): Generated {
  const now = Date.now();
  const key = String(Math.floor(now / 3_600_000));
  if (!cache || cache.key !== key) {
    cache = { key, data: generate(now) };
  }
  return cache.data;
}

export const ALL_FOOD_IDS = FOODS.map((f) => f.id);
