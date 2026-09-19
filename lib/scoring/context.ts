import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getMeals, getProfile, getSymptoms } from "@/lib/data/repository";
import { analyzeHistory } from "@/lib/scoring/history";
import { getSessionFromServerCookie } from "@/lib/session";
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
  const cookieStore = await cookies();
  const session = getSessionFromServerCookie(cookieStore.get("gutguide-session")?.value ?? null);
  const userId = session.userId ?? "demo-user";

  const [profile, meals, symptoms] = await Promise.all([
    getProfile(userId),
    getMeals(120, userId),
    getSymptoms(120, userId),
  ]);

  const nextProfile = session.mode === "demo" ? profile : { ...profile, id: userId, name: session.label || profile.name };
  const insight = analyzeHistory(meals, symptoms);
  return { profile: nextProfile, insight, meals, symptoms };
});
