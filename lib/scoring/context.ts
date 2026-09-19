import "server-only";
import { cache } from "react";
import { getMeals, getProfile, getSymptoms } from "@/lib/data/repository";
import { analyzeHistory } from "@/lib/scoring/history";
import type { ScoringContext } from "@/lib/scoring/compatibility";
import type { MealLog, SymptomLog } from "@/lib/types";

export type UserContext = ScoringContext & {
  meals: MealLog[];
  symptoms: SymptomLog[];
};

/**
 * Assembles everything the scorer needs. Cached per request so a page that
 * scores fifty foods only reads the log once.
 */
export const getUserContext = cache(async (): Promise<UserContext> => {
  const [profile, meals, symptoms] = await Promise.all([
    getProfile(),
    getMeals(120),
    getSymptoms(120),
  ]);
  const insight = analyzeHistory(meals, symptoms);
  return { profile, insight, meals, symptoms };
});
