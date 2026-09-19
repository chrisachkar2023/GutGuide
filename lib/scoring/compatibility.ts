import { TRAITS } from "@/lib/data/traits";
import type { HistoryInsight } from "@/lib/scoring/history";
import { EMPTY_INSIGHT } from "@/lib/scoring/history";
import type {
  Compatibility,
  DietaryRestriction,
  Food,
  ScoreBand,
  ScoreFactor,
  TraitId,
  UserProfile,
} from "@/lib/types";

export type ScoringContext = {
  profile: UserProfile;
  insight: HistoryInsight;
};

const RESTRICTION_TRAITS: Record<DietaryRestriction, TraitId[]> = {
  "lactose-free": ["lactose"],
  "gluten-free": ["gluten"],
  "low-fodmap": ["high-fodmap"],
  "nut-free": ["seeds-nuts"],
  "low-residue": ["insoluble-fiber", "high-fiber"],
  vegetarian: [],
  vegan: ["lactose"],
};

const MEAT_WORDS = ["chicken", "beef", "pork", "turkey", "salmon", "tuna", "shrimp", "fish", "sausage", "steak", "bacon", "patty", "anchov"];
const ANIMAL_WORDS = [...MEAT_WORDS, "milk", "cream", "butter", "cheese", "egg", "yogurt", "honey", "mozzarella", "parmesan", "crema"];

const BASE_SCORE = 66;

/** How hard the current phase leans on risk factors. */
const PHASE_RISK: Record<UserProfile["phase"], number> = {
  remission: 0.78,
  recovering: 1,
  flare: 1.35,
};

function restrictionConflicts(food: Food, profile: UserProfile): string[] {
  const conflicts: string[] = [];
  const ingredients = food.ingredients.join(" ").toLowerCase();

  for (const restriction of profile.restrictions) {
    if (restriction === "vegetarian" && MEAT_WORDS.some((w) => ingredients.includes(w))) {
      conflicts.push("Contains meat or fish, and you eat vegetarian");
      continue;
    }
    if (restriction === "vegan" && ANIMAL_WORDS.some((w) => ingredients.includes(w))) {
      conflicts.push("Contains animal products, and you eat vegan");
      continue;
    }
    const traits = RESTRICTION_TRAITS[restriction] ?? [];
    const hit = traits.find((t) => food.traits.includes(t));
    if (hit) {
      conflicts.push(`${TRAITS[hit].label} conflicts with your ${restriction.replace(/-/g, " ")} preference`);
    }
  }
  return conflicts;
}

function bandFor(score: number): ScoreBand {
  if (score >= 78) return "gentle";
  if (score >= 60) return "usually-ok";
  if (score >= 40) return "go-slow";
  return "caution";
}

export const BAND_META: Record<ScoreBand, { label: string; blurb: string }> = {
  gentle: { label: "Usually gentle for you", blurb: "This lines up well with what has been working." },
  "usually-ok": { label: "Often works out", blurb: "A reasonable choice based on what you have logged." },
  "go-slow": { label: "Worth easing into", blurb: "Mixed signals — a smaller portion is a fairer test." },
  caution: { label: "Approach with care", blurb: "Several things here have lined up with rough days for you." },
};

function headlineFor(band: ScoreBand, food: Food, hasHistory: boolean): string {
  const name = food.name.toLowerCase();
  switch (band) {
    case "gentle":
      return hasHistory
        ? `${food.name} has sat well with you before.`
        : `${food.name} shares a lot with the foods that work for you.`;
    case "usually-ok":
      return hasHistory
        ? `Your log on ${name} is mostly positive.`
        : `Nothing in ${name} stands out as a problem for your pattern.`;
    case "go-slow":
      return `${food.name} is a mixed picture for you — worth a small portion first.`;
    default:
      return `${food.name} overlaps with several of your rougher days.`;
  }
}

/**
 * Produces a personalized compatibility estimate.
 *
 * Deliberately conservative: the user's own logged history carries the most
 * weight, general food traits only nudge, and the output is always framed as an
 * estimate. Nothing here predicts a flare.
 */
export function scoreFood(food: Food, ctx: ScoringContext): Compatibility {
  const { profile, insight } = ctx;
  const riskScale = PHASE_RISK[profile.phase];
  const factors: ScoreFactor[] = [];
  let score = BASE_SCORE;

  // 1. The user's own history with this exact food — the strongest signal.
  const history = insight.foodHistory.get(food.id);
  const hasHistory = Boolean(history && history.timesLogged > 0);
  if (history && history.timesLogged > 0) {
    const times = history.timesLogged;
    const goodRate = history.good / times;
    const roughRate = history.rough / times;
    const confidence = Math.min(1, times / 4);
    const impact = (goodRate * 16 - roughRate * 34) * confidence;
    score += impact;
    factors.push({
      kind: "history",
      label: `You have logged this ${times} ${times === 1 ? "time" : "times"}`,
      detail:
        roughRate > goodRate
          ? `${history.rough} of those were followed by a rough stretch.`
          : `${history.good} of those were followed by an easy stretch.`,
      impact: round(impact),
    });
  }

  // 2. Trait patterns, learned from the log where there is enough of it.
  let traitTotal = 0;
  for (const traitId of food.traits) {
    const meta = TRAITS[traitId];
    if (!meta) continue;
    const stat = insight.traitStats.get(traitId);

    if (stat && stat.mealsWith >= 6 && Math.abs(stat.delta) > 0.45) {
      const impact = clampRange(-stat.delta * 6.5, -16, 7) * (stat.delta > 0 ? riskScale : 1);
      traitTotal += impact;
      factors.push({
        kind: "pattern",
        label: meta.label,
        detail:
          stat.delta > 0
            ? `Meals with ${meta.label.toLowerCase()} averaged ${stat.avgWith.toFixed(1)}/10 discomfort versus ${stat.avgWithout.toFixed(1)} without.`
            : `Meals with ${meta.label.toLowerCase()} averaged ${stat.avgWith.toFixed(1)}/10 discomfort versus ${stat.avgWithout.toFixed(1)} without — a good sign.`,
        impact: round(impact),
      });
      continue;
    }

    const impact = meta.tone === "watch" ? -meta.weight * 8 * riskScale : meta.weight * 5;
    traitTotal += impact;
    factors.push({
      kind: "trait",
      label: meta.label,
      detail: meta.blurb,
      impact: round(impact),
    });
  }
  score += clampRange(traitTotal, -42, 14);

  // 3. Traits the user explicitly told us to watch.
  const watched = food.traits.filter((t) => profile.watchTraits.includes(t));
  if (watched.length > 0) {
    const impact = -Math.min(16, watched.length * 6) * riskScale;
    score += impact;
    factors.push({
      kind: "profile",
      label: `On your watch list: ${watched.map((t) => TRAITS[t].label).join(", ")}`,
      detail: "You flagged these when you set up your profile.",
      impact: round(impact),
    });
  }

  // 4. Hard preferences.
  const conflicts = restrictionConflicts(food, profile);
  if (conflicts.length > 0) {
    score = Math.min(score, 34) - (conflicts.length - 1) * 4;
    factors.push({
      kind: "profile",
      label: "Conflicts with your preferences",
      detail: conflicts.join(". "),
      impact: -20,
    });
  }

  // 5. Where the user is right now.
  if (profile.phase === "flare" && food.traits.some((t) => TRAITS[t]?.tone === "watch")) {
    score -= 6;
    factors.push({
      kind: "profile",
      label: "You marked yourself as flaring",
      detail: "Risk factors count for more while things are already inflamed.",
      impact: -6,
    });
  } else if (profile.phase === "remission" && !conflicts.length) {
    score += 4;
    factors.push({
      kind: "profile",
      label: "You are in a stable stretch",
      detail: "A good window for carefully testing foods you have been avoiding.",
      impact: 4,
    });
  }

  score = Math.round(clampRange(score, 5, 96));
  const band = bandFor(score);

  const traitEvidence = food.traits.reduce(
    (sum, t) => sum + Math.min(insight.traitStats.get(t)?.mealsWith ?? 0, 30),
    0,
  );
  const dataPoints = (history?.timesLogged ?? 0) * 4 + traitEvidence;
  const confidence: Compatibility["confidence"] =
    hasHistory && (history?.timesLogged ?? 0) >= 3 ? "high" : dataPoints >= 25 ? "medium" : "low";

  const tips = [...food.prepTips];
  if (band === "go-slow" || band === "caution") {
    tips.unshift("Try a small portion alongside something that reliably works for you.");
  }

  factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return {
    score,
    band,
    headline: headlineFor(band, food, hasHistory),
    confidence,
    dataPoints,
    factors: factors.slice(0, 6),
    restrictionConflicts: conflicts,
    tips: tips.slice(0, 3),
  };
}

export function scoreFoods(foods: Food[], ctx: ScoringContext): Map<string, Compatibility> {
  return new Map(foods.map((food) => [food.id, scoreFood(food, ctx)]));
}

/** Combines several foods into a single estimate, weighted toward the worst. */
export function scoreCombination(foods: Food[], ctx: ScoringContext): Compatibility {
  const scores = foods.map((food) => scoreFood(food, ctx));
  if (scores.length === 0) {
    return {
      score: BASE_SCORE,
      band: "usually-ok",
      headline: "Not enough detail to estimate.",
      confidence: "low",
      dataPoints: 0,
      factors: [],
      restrictionConflicts: [],
      tips: [],
    };
  }
  const min = Math.min(...scores.map((s) => s.score));
  const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const score = Math.round(min * 0.6 + avg * 0.4);
  const factors = scores
    .flatMap((s) => s.factors)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);

  return {
    score,
    band: bandFor(score),
    headline: BAND_META[bandFor(score)].blurb,
    confidence: scores.some((s) => s.confidence === "high") ? "medium" : "low",
    dataPoints: scores.reduce((sum, s) => sum + s.dataPoints, 0),
    factors,
    restrictionConflicts: [...new Set(scores.flatMap((s) => s.restrictionConflicts))],
    tips: [...new Set(scores.flatMap((s) => s.tips))].slice(0, 3),
  };
}

export const EMPTY_CONTEXT_INSIGHT = EMPTY_INSIGHT;

function clampRange(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function round(v: number) {
  return Math.round(v * 10) / 10;
}
