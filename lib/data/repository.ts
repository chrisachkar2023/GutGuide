import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { guestData } from "@/lib/data/guest-store";
import type { ActiveUser } from "@/lib/auth/session";
import type { MealLog, SymptomLog, UserProfile } from "@/lib/types";

/**
 * One data layer, two backings.
 *
 * Signed-in accounts read and write Postgres. Guests read and write an
 * in-memory copy of the sample history that disappears with the process.
 * Every caller goes through `ActiveUser`, so neither path can leak into the
 * other.
 */

function sinceDate(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const warned = new Set<string>();
function warnOnce(scope: string, error: unknown) {
  if (warned.has(scope)) return;
  warned.add(scope);
  console.warn(`[gutguide] ${scope} failed:`, error instanceof Error ? error.message : error);
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export async function getProfile(actor: ActiveUser): Promise<UserProfile> {
  if (actor.kind === "guest") return guestData(actor.id).profile;

  const db = getDb();
  if (!db) throw new Error("Signed-in users require a database.");

  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, actor.id)).limit(1);
  if (!row) throw new Error("That account no longer exists.");

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

export async function getMeals(actor: ActiveUser, days = 120): Promise<MealLog[]> {
  const cutoff = sinceDate(days).getTime();

  if (actor.kind === "guest") {
    return guestData(actor.id)
      .meals.filter((m) => new Date(m.loggedAt).getTime() >= cutoff)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  }

  const db = getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(schema.mealLogs)
      .where(
        and(eq(schema.mealLogs.userId, actor.id), gte(schema.mealLogs.loggedAt, sinceDate(days))),
      )
      .orderBy(desc(schema.mealLogs.loggedAt));

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
  } catch (error) {
    warnOnce("getMeals", error);
    return [];
  }
}

export async function getSymptoms(actor: ActiveUser, days = 120): Promise<SymptomLog[]> {
  const cutoff = sinceDate(days).getTime();

  if (actor.kind === "guest") {
    return guestData(actor.id)
      .symptoms.filter((s) => new Date(s.loggedAt).getTime() >= cutoff)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  }

  const db = getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(schema.symptomLogs)
      .where(
        and(
          eq(schema.symptomLogs.userId, actor.id),
          gte(schema.symptomLogs.loggedAt, sinceDate(days)),
        ),
      )
      .orderBy(desc(schema.symptomLogs.loggedAt));

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
  } catch (error) {
    warnOnce("getSymptoms", error);
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

export type MealInput = Omit<MealLog, "id" | "userId" | "loggedAt"> & { loggedAt?: string };

export async function addMeal(actor: ActiveUser, input: MealInput): Promise<MealLog> {
  const meal: MealLog = {
    id: newId("meal"),
    userId: actor.id,
    name: input.name,
    foodIds: input.foodIds,
    portion: input.portion,
    notes: input.notes,
    source: input.source ?? "manual",
    loggedAt: input.loggedAt ?? new Date().toISOString(),
  };

  if (actor.kind === "guest") {
    guestData(actor.id).meals.unshift(meal);
    return meal;
  }

  const db = getDb();
  if (!db) throw new Error("Signed-in users require a database.");

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
}

export type SymptomInput = Omit<SymptomLog, "id" | "userId" | "loggedAt"> & { loggedAt?: string };

export async function addSymptom(actor: ActiveUser, input: SymptomInput): Promise<SymptomLog> {
  const entry: SymptomLog = {
    id: newId("symptom"),
    userId: actor.id,
    pain: input.pain,
    bloating: input.bloating,
    energy: input.energy,
    urgency: input.urgency,
    notes: input.notes,
    loggedAt: input.loggedAt ?? new Date().toISOString(),
  };

  if (actor.kind === "guest") {
    guestData(actor.id).symptoms.unshift(entry);
    return entry;
  }

  const db = getDb();
  if (!db) throw new Error("Signed-in users require a database.");

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
}

export async function updateProfile(
  actor: ActiveUser,
  patch: Partial<UserProfile>,
): Promise<UserProfile> {
  const current = await getProfile(actor);
  const next: UserProfile = { ...current, ...patch, id: current.id };

  if (actor.kind === "guest") {
    guestData(actor.id).profile = next;
    return next;
  }

  const db = getDb();
  if (!db) throw new Error("Signed-in users require a database.");

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
    .where(eq(schema.users.id, actor.id));

  return next;
}
