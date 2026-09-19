import { getFood } from "@/lib/data/foods";
import { TRAITS } from "@/lib/data/traits";
import { average, type HistoryInsight, type TraitStat } from "@/lib/scoring/history";
import type { MealLog, SymptomLog, TraitId } from "@/lib/types";

export type DayPoint = {
  date: string;
  label: string;
  pain: number | null;
  bloating: number | null;
  energy: number | null;
  urgency: number | null;
  meals: number;
};

const MS_DAY = 86_400_000;

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** One point per calendar day, including days with no check-in (null). */
export function buildDailySeries(symptoms: SymptomLog[], meals: MealLog[], days: number): DayPoint[] {
  const symptomsByDay = new Map<string, SymptomLog[]>();
  for (const s of symptoms) {
    const key = dayKey(s.loggedAt);
    const list = symptomsByDay.get(key) ?? [];
    list.push(s);
    symptomsByDay.set(key, list);
  }

  const mealsByDay = new Map<string, number>();
  for (const m of meals) {
    const key = dayKey(m.loggedAt);
    mealsByDay.set(key, (mealsByDay.get(key) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const points: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * MS_DAY);
    const key = date.toISOString().slice(0, 10);
    const entries = symptomsByDay.get(key) ?? [];
    points.push({
      date: key,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      pain: entries.length ? round(average(entries.map((e) => e.pain))) : null,
      bloating: entries.length ? round(average(entries.map((e) => e.bloating))) : null,
      energy: entries.length ? round(average(entries.map((e) => e.energy))) : null,
      urgency: entries.length ? round(average(entries.map((e) => e.urgency))) : null,
      meals: mealsByDay.get(key) ?? 0,
    });
  }
  return points;
}

export type WindowStats = {
  days: number;
  mealsLogged: number;
  checkIns: number;
  avgPain: number;
  avgBloating: number;
  avgEnergy: number;
  /** Change versus the preceding window of the same length. Negative is better for pain. */
  painChange: number;
  bloatingChange: number;
  energyChange: number;
  easyDays: number;
  bestStreak: number;
};

export function windowStats(symptoms: SymptomLog[], meals: MealLog[], days: number): WindowStats {
  const now = Date.now();
  const cutoff = now - days * MS_DAY;
  const prevCutoff = now - days * 2 * MS_DAY;

  const inWindow = symptoms.filter((s) => new Date(s.loggedAt).getTime() >= cutoff);
  const previous = symptoms.filter((s) => {
    const t = new Date(s.loggedAt).getTime();
    return t >= prevCutoff && t < cutoff;
  });
  const mealsInWindow = meals.filter((m) => new Date(m.loggedAt).getTime() >= cutoff);

  const avgPain = average(inWindow.map((s) => s.pain));
  const avgBloating = average(inWindow.map((s) => s.bloating));
  const avgEnergy = average(inWindow.map((s) => s.energy));

  const series = buildDailySeries(inWindow, mealsInWindow, days);
  let easyDays = 0;
  let streak = 0;
  let bestStreak = 0;
  for (const point of series) {
    const calm = point.pain !== null && point.pain < 3 && (point.bloating ?? 0) < 3.5;
    if (calm) {
      easyDays += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else if (point.pain !== null) {
      streak = 0;
    }
  }

  return {
    days,
    mealsLogged: mealsInWindow.length,
    checkIns: inWindow.length,
    avgPain: round(avgPain),
    avgBloating: round(avgBloating),
    avgEnergy: round(avgEnergy),
    painChange: round(avgPain - average(previous.map((s) => s.pain))),
    bloatingChange: round(avgBloating - average(previous.map((s) => s.bloating))),
    energyChange: round(avgEnergy - average(previous.map((s) => s.energy))),
    easyDays,
    bestStreak,
  };
}

export type ToleratedFood = {
  foodId: string;
  name: string;
  emoji: string;
  timesLogged: number;
  goodRate: number;
  avgDiscomfort: number;
};

/** Foods with enough of a track record to say something about, best first. */
export function toleratedFoods(insight: HistoryInsight, min = 3, limit = 8): ToleratedFood[] {
  return rankFoods(insight, min)
    .filter((f) => f.goodRate >= 0.55)
    .sort((a, b) => b.goodRate - a.goodRate || b.timesLogged - a.timesLogged)
    .slice(0, limit);
}

export function triggerCandidates(insight: HistoryInsight, min = 3, limit = 6): ToleratedFood[] {
  return rankFoods(insight, min)
    .filter((f) => f.avgDiscomfort > insight.baseline + 0.6)
    .sort((a, b) => b.avgDiscomfort - a.avgDiscomfort)
    .slice(0, limit);
}

function rankFoods(insight: HistoryInsight, min: number): ToleratedFood[] {
  const out: ToleratedFood[] = [];
  for (const history of insight.foodHistory.values()) {
    if (history.timesLogged < min) continue;
    const food = getFood(history.foodId);
    if (!food) continue;
    out.push({
      foodId: history.foodId,
      name: food.name,
      emoji: food.emoji,
      timesLogged: history.timesLogged,
      goodRate: history.good / history.timesLogged,
      avgDiscomfort: round(average(history.entries.map((e) => e.discomfort))),
    });
  }
  return out;
}

export type PatternInsight = {
  traitId: TraitId;
  label: string;
  blurb: string;
  mealsWith: number;
  delta: number;
  direction: "watch" | "helps";
};

/** Traits whose presence moves the user's average discomfort most. */
export function patternInsights(insight: HistoryInsight, limit = 5): PatternInsight[] {
  const stats: TraitStat[] = [...insight.traitStats.values()].filter((s) => s.mealsWith >= 6);
  return stats
    .filter((s) => Math.abs(s.delta) >= 0.4)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit)
    .map((s) => ({
      traitId: s.traitId,
      label: TRAITS[s.traitId]?.label ?? s.traitId,
      blurb: TRAITS[s.traitId]?.blurb ?? "",
      mealsWith: s.mealsWith,
      delta: round(s.delta),
      direction: s.delta > 0 ? "watch" : "helps",
    }));
}

export type Achievement = {
  id: string;
  title: string;
  detail: string;
  earned: boolean;
  progress: number;
};

export function achievements(stats: WindowStats, insight: HistoryInsight, meals: MealLog[]): Achievement[] {
  const distinctFoods = new Set(meals.flatMap((m) => m.foodIds)).size;
  const loggedDays = new Set(meals.map((m) => dayKey(m.loggedAt))).size;

  return [
    {
      id: "streak",
      title: "Three calm days in a row",
      detail: `Best run this month: ${stats.bestStreak} ${stats.bestStreak === 1 ? "day" : "days"}`,
      earned: stats.bestStreak >= 3,
      progress: Math.min(1, stats.bestStreak / 3),
    },
    {
      id: "consistency",
      title: "Two weeks of logging",
      detail: `${loggedDays} days with at least one meal logged`,
      earned: loggedDays >= 14,
      progress: Math.min(1, loggedDays / 14),
    },
    {
      id: "variety",
      title: "Twenty foods tracked",
      detail: `${distinctFoods} different foods in your history`,
      earned: distinctFoods >= 20,
      progress: Math.min(1, distinctFoods / 20),
    },
    {
      id: "pattern",
      title: "First pattern found",
      detail: `${insight.traitStats.size} food characteristics have enough data to compare`,
      earned: patternInsights(insight).length > 0,
      progress: Math.min(1, patternInsights(insight).length / 1),
    },
  ];
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
