import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { DEMO_PROFILE, DEMO_USER_ID, demoHistory } from "@/lib/data/demo-user";
import type { MealLog, SymptomLog, UserProfile } from "@/lib/types";

export { DEMO_USER_ID };

/* ------------------------------------------------------------------ *
 * In-memory fallback store.
 *
 * Seeded from the deterministic demo history. Writes land here whenever
 * DATABASE_URL is not configured, so every flow in the app stays fully
 * interactive without any setup.
 * ------------------------------------------------------------------ */

type MemoryStore = {
  profile: UserProfile;
  meals: MealLog[];
  symptoms: SymptomLog[];
  seededAt: string;
};

declare global {
  var __gutguideStore: MemoryStore | undefined;
}

function memory(): MemoryStore {
  if (!globalThis.__gutguideStore) {
    const { meals, symptoms } = demoHistory();
    globalThis.__gutguideStore = {
      profile: { ...DEMO_PROFILE },
      meals: [...meals],
      symptoms: [...symptoms],
      seededAt: new Date().toISOString(),
    };
  }
  return globalThis.__gutguideStore;
}

function sinceDate(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export async function getProfile(userId = DEMO_USER_ID): Promise<UserProfile> {
  const db = getDb();
  if (db) {
    try {
      const [row] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      if (row) {
        return {
          id: row.id,
          name: row.name,
          diagnosedYear: row.diagnosedYear,
          phase: row.phase,
          restrictions: row.restrictions ?? [],
          watchTraits: row.watchTraits ?? [],
          favoriteCuisines: row.favoriteCuisines ?? [],
          dislikes: row.dislikes ?? [],
          goal: row.goal,
        };
      }
    } catch (error) {
      warnOnce("getProfile", error);
    }
  }
  return memory().profile;
}

export async function getMeals(days = 120, userId = DEMO_USER_ID): Promise<MealLog[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(schema.mealLogs)
        .where(and(eq(schema.mealLogs.userId, userId), gte(schema.mealLogs.loggedAt, sinceDate(days))))
        .orderBy(desc(schema.mealLogs.loggedAt));
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          name: r.name,
          foodIds: r.foodIds ?? [],
          portion: r.portion,
          notes: r.notes ?? undefined,
          source: r.source,
          loggedAt: r.loggedAt.toISOString(),
        }));
      }
    } catch (error) {
      warnOnce("getMeals", error);
    }
  }
  const cutoff = sinceDate(days).getTime();
  return memory()
    .meals.filter((m) => new Date(m.loggedAt).getTime() >= cutoff)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

export async function getSymptoms(days = 120, userId = DEMO_USER_ID): Promise<SymptomLog[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(schema.symptomLogs)
        .where(and(eq(schema.symptomLogs.userId, userId), gte(schema.symptomLogs.loggedAt, sinceDate(days))))
        .orderBy(desc(schema.symptomLogs.loggedAt));
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          pain: r.pain,
          bloating: r.bloating,
          energy: r.energy,
          urgency: r.urgency,
          notes: r.notes ?? undefined,
          loggedAt: r.loggedAt.toISOString(),
        }));
      }
    } catch (error) {
      warnOnce("getSymptoms", error);
    }
  }
  const cutoff = sinceDate(days).getTime();
  return memory()
    .symptoms.filter((s) => new Date(s.loggedAt).getTime() >= cutoff)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

export type MealInput = Omit<MealLog, "id" | "userId" | "loggedAt"> & {
  loggedAt?: string;
  userId?: string;
};

export async function addMeal(input: MealInput): Promise<MealLog> {
  const meal: MealLog = {
    id: newId("meal"),
    userId: input.userId ?? DEMO_USER_ID,
    name: input.name,
    foodIds: input.foodIds,
    portion: input.portion,
    notes: input.notes,
    source: input.source ?? "manual",
    loggedAt: input.loggedAt ?? new Date().toISOString(),
  };

  const db = getDb();
  if (db) {
    try {
      await db.insert(schema.mealLogs).values({
        id: meal.id,
        userId: meal.userId,
        name: meal.name,
        foodIds: meal.foodIds,
        portion: meal.portion,
        notes: meal.notes ?? null,
        source: meal.source ?? "manual",
        loggedAt: new Date(meal.loggedAt),
      });
      return meal;
    } catch (error) {
      warnOnce("addMeal", error);
    }
  }

  memory().meals.unshift(meal);
  return meal;
}

export type SymptomInput = Omit<SymptomLog, "id" | "userId" | "loggedAt"> & {
  loggedAt?: string;
  userId?: string;
};

export async function addSymptom(input: SymptomInput): Promise<SymptomLog> {
  const entry: SymptomLog = {
    id: newId("symptom"),
    userId: input.userId ?? DEMO_USER_ID,
    pain: input.pain,
    bloating: input.bloating,
    energy: input.energy,
    urgency: input.urgency,
    notes: input.notes,
    loggedAt: input.loggedAt ?? new Date().toISOString(),
  };

  const db = getDb();
  if (db) {
    try {
      await db.insert(schema.symptomLogs).values({
        id: entry.id,
        userId: entry.userId,
        pain: entry.pain,
        bloating: entry.bloating,
        energy: entry.energy,
        urgency: entry.urgency,
        notes: entry.notes ?? null,
        loggedAt: new Date(entry.loggedAt),
      });
      return entry;
    } catch (error) {
      warnOnce("addSymptom", error);
    }
  }

  memory().symptoms.unshift(entry);
  return entry;
}

export async function updateProfile(patch: Partial<UserProfile>, userId = DEMO_USER_ID): Promise<UserProfile> {
  const current = await getProfile(userId);
  const next: UserProfile = { ...current, ...patch, id: current.id };

  const db = getDb();
  if (db) {
    try {
      await db
        .update(schema.users)
        .set({
          name: next.name,
          phase: next.phase,
          restrictions: next.restrictions,
          watchTraits: next.watchTraits,
          favoriteCuisines: next.favoriteCuisines,
          dislikes: next.dislikes,
          goal: next.goal,
        })
        .where(eq(schema.users.id, userId));
      return next;
    } catch (error) {
      warnOnce("updateProfile", error);
    }
  }

  memory().profile = next;
  return next;
}

const warned = new Set<string>();
function warnOnce(scope: string, error: unknown) {
  if (warned.has(scope)) return;
  warned.add(scope);
  console.warn(`[gutguide] ${scope} fell back to demo data:`, error instanceof Error ? error.message : error);
}
