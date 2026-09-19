import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getActiveUser, type ActiveUser } from "@/lib/auth/session";
import { getMeals, getProfile, getSymptoms } from "@/lib/data/repository";
import { analyzeHistory } from "@/lib/scoring/history";
import type { ScoringContext } from "@/lib/scoring/compatibility";
import type { MealLog, SymptomLog } from "@/lib/types";

export type UserContext = ScoringContext & {
  actor: ActiveUser;
  meals: MealLog[];
  symptoms: SymptomLog[];
};

/**
 * Assembles everything the scorer needs for whoever is signed in, and sends
 * anyone who is not to the sign-in screen. Cached per request, so a page that
 * scores fifty foods only reads the log once.
 */
export const getUserContext = cache(async (): Promise<UserContext> => {
  const actor = await getActiveUser();
  if (!actor) redirect("/login");

  const [profile, meals, symptoms] = await Promise.all([
    getProfile(actor),
    getMeals(actor, 120),
    getSymptoms(actor, 120),
  ]);

  return { actor, profile, insight: analyzeHistory(meals, symptoms), meals, symptoms };
});
