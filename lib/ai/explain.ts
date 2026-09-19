import "server-only";
import { BAND_META } from "@/lib/scoring/compatibility";
import { generateText, isGeminiEnabled } from "@/lib/ai/gemini";
import type { Compatibility, Food, FoodHistory, UserProfile } from "@/lib/types";

export type Explanation = {
  text: string;
  source: "gemini" | "local";
};

function localExplanation(food: Food, compat: Compatibility, history?: FoodHistory): string {
  const parts: string[] = [];
  parts.push(compat.headline);

  if (history && history.timesLogged > 0) {
    parts.push(
      `Across ${history.timesLogged} logged ${history.timesLogged === 1 ? "meal" : "meals"}, ${history.good} sat easily and ${history.rough} were followed by a rough stretch.`,
    );
  }

  const top = compat.factors.filter((f) => f.kind !== "history").slice(0, 2);
  if (top.length > 0) {
    parts.push(top.map((f) => `${f.label.toLowerCase()} — ${f.detail.replace(/\.$/, "")}`).join("; ") + ".");
  }

  if (compat.restrictionConflicts.length > 0) {
    parts.push(compat.restrictionConflicts.join(". ") + ".");
  }

  parts.push(
    compat.confidence === "high"
      ? "Confidence is decent here because you have logged this food a few times."
      : "This is an estimate from limited data — logging it again sharpens it.",
  );

  return parts.join(" ");
}

/**
 * Turns the scorer's factor breakdown into something readable. Gemini writes it
 * when a key is configured; otherwise a deterministic template does, so the
 * explanation is never missing during a demo.
 */
export async function explainCompatibility(
  food: Food,
  compat: Compatibility,
  profile: UserProfile,
  history?: FoodHistory,
): Promise<Explanation> {
  const fallback = localExplanation(food, compat, history);
  if (!isGeminiEnabled()) return { text: fallback, source: "local" };

  const factorLines = compat.factors
    .map((f) => `- ${f.label} (${f.impact > 0 ? "+" : ""}${f.impact} points): ${f.detail}`)
    .join("\n");

  const historyLine = history
    ? `Logged ${history.timesLogged} times: ${history.good} easy, ${history.mixed} mixed, ${history.rough} rough.`
    : "No personal history with this food yet.";

  const prompt = `Explain a personalized food compatibility estimate to ${profile.name}.

Food: ${food.name} (${food.summary})
Ingredients: ${food.ingredients.join(", ")}
Estimate: ${compat.score}/100 — "${BAND_META[compat.band].label}"
Confidence: ${compat.confidence}
${historyLine}
Their current phase: ${profile.phase}
Their stated preferences: ${profile.restrictions.join(", ") || "none"}

What drove the estimate:
${factorLines}

Write 2-4 short sentences addressed to them directly. Lead with the single biggest driver.
Name at least one concrete number from the data above. If confidence is low, say what would improve it.
Do not repeat the score itself. Do not add a disclaimer sentence — the interface already shows one.`;

  const text = await generateText({ prompt, maxOutputTokens: 260, temperature: 0.55 });
  return text ? { text, source: "gemini" } : { text: fallback, source: "local" };
}

export type TrendFacts = {
  name: string;
  days: number;
  mealsLogged: number;
  avgPain: number;
  avgBloating: number;
  avgEnergy: number;
  painChange: number;
  energyChange: number;
  topTolerated: string[];
  topWatch: string[];
  bestStreak: number;
};

function localTrendSummary(facts: TrendFacts): string {
  const direction =
    facts.painChange < -0.4 ? "easing" : facts.painChange > 0.4 ? "climbing" : "holding steady";
  const bits = [
    `Over the last ${facts.days} days your pain scores are ${direction} (${facts.avgPain.toFixed(1)}/10 average) and energy sits around ${facts.avgEnergy.toFixed(1)}/10.`,
  ];
  if (facts.topTolerated.length > 0) {
    bits.push(`${facts.topTolerated.slice(0, 3).join(", ")} have been consistently easy days for you.`);
  }
  if (facts.topWatch.length > 0) {
    bits.push(`${facts.topWatch.slice(0, 2).join(" and ")} show up more often before your rougher days — worth watching, not necessarily cutting.`);
  }
  bits.push(`You logged ${facts.mealsLogged} meals in that window.`);
  return bits.join(" ");
}

export async function summarizeTrends(facts: TrendFacts): Promise<Explanation> {
  const fallback = localTrendSummary(facts);
  if (!isGeminiEnabled()) return { text: fallback, source: "local" };

  const prompt = `Summarize ${facts.name}'s last ${facts.days} days of Crohn's food and symptom tracking.

Meals logged: ${facts.mealsLogged}
Average pain: ${facts.avgPain.toFixed(1)}/10 (change vs earlier in the window: ${facts.painChange.toFixed(1)})
Average bloating: ${facts.avgBloating.toFixed(1)}/10
Average energy: ${facts.avgEnergy.toFixed(1)}/10 (change: ${facts.energyChange.toFixed(1)})
Longest run of easy days: ${facts.bestStreak}
Foods that lined up with easy days: ${facts.topTolerated.join(", ") || "not enough data"}
Patterns that lined up with rough days: ${facts.topWatch.join(", ") || "not enough data"}

Write 3-4 sentences. Open with the clearest trend. Cite two specific numbers.
Name one thing that is working and one pattern worth watching, phrased as an observation rather than an instruction.
End with one small, concrete suggestion for the coming week.`;

  const text = await generateText({ prompt, maxOutputTokens: 300, temperature: 0.6 });
  return text ? { text, source: "gemini" } : { text: fallback, source: "local" };
}

export type DailyInsightFacts = {
  name: string;
  phase: string;
  recentDiscomfort: number;
  lastMeal?: string;
  lastMealAt?: string;
  easyFoods: string[];
  watchPatterns: string[];
  loggedToday: number;
};

export async function dailyInsight(facts: DailyInsightFacts): Promise<Explanation> {
  const fallback =
    facts.recentDiscomfort > 4.5
      ? `The past week has been bumpier than usual. Soft, low-residue meals like ${facts.easyFoods[0] ?? "congee"} tend to be your steadier days — worth leaning on them for a few meals.`
      : `Things have been reasonably settled this week. ${facts.easyFoods.slice(0, 2).join(" and ") || "Your usual staples"} keep showing up on your easy days, and a stable stretch is a fair time to test one new food at a time.`;

  if (!isGeminiEnabled()) return { text: fallback, source: "local" };

  const prompt = `Write today's one-paragraph insight for ${facts.name}.

Current phase: ${facts.phase}
Average discomfort over the past week: ${facts.recentDiscomfort.toFixed(1)}/10
Meals logged today: ${facts.loggedToday}
Last meal: ${facts.lastMeal ?? "none logged"}
Foods on their easy days: ${facts.easyFoods.join(", ") || "not enough data yet"}
Patterns on their rough days: ${facts.watchPatterns.join(", ") || "not enough data yet"}

Two or three sentences, warm and specific, addressed to them. Mention one concrete food or pattern by name.
No greeting, no sign-off, no medical advice.`;

  const text = await generateText({ prompt, maxOutputTokens: 200, temperature: 0.7 });
  return text ? { text, source: "gemini" } : { text: fallback, source: "local" };
}
