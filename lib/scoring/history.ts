import { getFood } from "@/lib/data/foods";
import type {
  FoodHistory,
  FoodHistoryEntry,
  FoodOutcome,
  MealLog,
  SymptomLog,
  TraitId,
} from "@/lib/types";

/** Window after a meal where symptoms are treated as plausibly related. */
const WINDOW_START_H = 1.5;
const WINDOW_END_H = 14;

export type TraitStat = {
  traitId: TraitId;
  mealsWith: number;
  avgWith: number;
  avgWithout: number;
  /** Positive means worse discomfort when this trait is present. */
  delta: number;
};

export type HistoryInsight = {
  foodHistory: Map<string, FoodHistory>;
  traitStats: Map<TraitId, TraitStat>;
  /** Average discomfort across every scored meal — the personal baseline. */
  baseline: number;
  scoredMeals: number;
  recentDiscomfort: number;
};

function outcomeFor(discomfort: number): FoodOutcome {
  if (discomfort < 3) return "good";
  if (discomfort < 5.5) return "mixed";
  return "rough";
}

/**
 * Links each meal to the symptom check-ins that followed it and rolls the
 * result up per food and per trait. This is the evidence the scorer leans on —
 * it is correlation from the user's own log, never a claim about causation.
 */
export function analyzeHistory(meals: MealLog[], symptoms: SymptomLog[]): HistoryInsight {
  const sortedSymptoms = [...symptoms].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
  );
  const symptomTimes = sortedSymptoms.map((s) => new Date(s.loggedAt).getTime());

  const foodHistory = new Map<string, FoodHistory>();
  const withTrait = new Map<TraitId, number[]>();
  const allDiscomfort: number[] = [];
  const perMealTraits: { discomfort: number; traits: Set<TraitId> }[] = [];
  const recent: number[] = [];
  const recentCutoff = Date.now() - 7 * 86_400_000;

  for (const meal of meals) {
    const mealTime = new Date(meal.loggedAt).getTime();
    const from = mealTime + WINDOW_START_H * 3_600_000;
    const to = mealTime + WINDOW_END_H * 3_600_000;

    let worst: number | null = null;
    for (let i = 0; i < symptomTimes.length; i++) {
      const t = symptomTimes[i];
      if (t < from) continue;
      if (t > to) break;
      const s = sortedSymptoms[i];
      const discomfort = Math.max(s.pain, s.bloating, s.urgency * 0.9);
      worst = worst === null ? discomfort : Math.max(worst, discomfort);
    }
    if (worst === null) continue;

    const portionWeight = meal.portion === "small" ? 0.85 : meal.portion === "large" ? 1.1 : 1;
    const discomfort = Math.min(10, worst * portionWeight);
    allDiscomfort.push(discomfort);
    if (mealTime >= recentCutoff) recent.push(discomfort);

    const mealTraits = new Set<TraitId>();
    const entry: FoodHistoryEntry = {
      loggedAt: meal.loggedAt,
      mealName: meal.name,
      outcome: outcomeFor(discomfort),
      discomfort: Math.round(discomfort * 10) / 10,
    };

    for (const foodId of meal.foodIds) {
      const food = getFood(foodId);
      if (!food) continue;
      food.traits.forEach((t) => mealTraits.add(t));

      const existing = foodHistory.get(foodId) ?? {
        foodId,
        timesLogged: 0,
        good: 0,
        mixed: 0,
        rough: 0,
        entries: [],
      };
      existing.timesLogged += 1;
      existing[entry.outcome] += 1;
      existing.entries.push(entry);
      if (!existing.lastLoggedAt || meal.loggedAt > existing.lastLoggedAt) {
        existing.lastLoggedAt = meal.loggedAt;
      }
      foodHistory.set(foodId, existing);
    }

    perMealTraits.push({ discomfort, traits: mealTraits });
    for (const t of mealTraits) {
      const list = withTrait.get(t) ?? [];
      list.push(discomfort);
      withTrait.set(t, list);
    }
  }

  const baseline = average(allDiscomfort);
  const traitStats = new Map<TraitId, TraitStat>();

  for (const [traitId, values] of withTrait) {
    const without = perMealTraits.filter((m) => !m.traits.has(traitId)).map((m) => m.discomfort);
    const avgWith = average(values);
    const avgWithout = average(without);
    traitStats.set(traitId, {
      traitId,
      mealsWith: values.length,
      avgWith,
      avgWithout,
      delta: avgWith - avgWithout,
    });
  }

  // Newest entries first, and keep the list bounded for the UI.
  for (const history of foodHistory.values()) {
    history.entries.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
    history.entries = history.entries.slice(0, 12);
  }

  return {
    foodHistory,
    traitStats,
    baseline,
    scoredMeals: allDiscomfort.length,
    recentDiscomfort: recent.length ? average(recent) : baseline,
  };
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export const EMPTY_INSIGHT: HistoryInsight = {
  foodHistory: new Map(),
  traitStats: new Map(),
  baseline: 0,
  scoredMeals: 0,
  recentDiscomfort: 0,
};
