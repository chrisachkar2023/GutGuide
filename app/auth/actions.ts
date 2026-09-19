"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  accountsEnabled,
  createSession,
  destroySession,
  getActiveUser,
  localAuthenticate,
  localCreateAccount,
  startGuestSession,
} from "@/lib/auth/session";
import { checkPasswordStrength, hashPassword, verifyPassword } from "@/lib/auth/password";
import { DEMO_PROFILE, demoHistory } from "@/lib/data/demo-user";
import { resetGuest } from "@/lib/data/guest-store";
import { getDb, schema } from "@/lib/db";

export type AuthState = { error: string | null };

const AUTH_IDLE: AuthState = { error: null };

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("That does not look like an email address."),
  password: z.string().min(1, "Enter your password."),
});

const signUpSchema = credentials.extend({
  name: z.string().trim().min(1, "What should we call you?").max(60),
  sampleData: z.boolean(),
});

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    sampleData: formData.get("sampleData") === "on",
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check those details." };

  const weak = checkPasswordStrength(parsed.data.password);
  if (weak) return { error: weak };

  const db = getDb();

  try {
    if (db) {
      const [existing] = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, parsed.data.email))
        .limit(1);

      if (existing) return { error: "There is already an account with that email." };

      const userId = `user-${randomBytes(9).toString("base64url")}`;
      await db.insert(schema.users).values({
        id: userId,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        name: parsed.data.name,
        diagnosedYear: new Date().getFullYear(),
        phase: "remission",
        restrictions: [],
        watchTraits: [],
        favoriteCuisines: [],
        dislikes: [],
        goal: "",
      });

      if (parsed.data.sampleData) await seedSampleHistory(userId);
      await createSession(userId);
      redirect("/");
      return AUTH_IDLE;
    }

    const existingLocal = await localAuthenticate(parsed.data.email, parsed.data.password);
    if (existingLocal) {
      return { error: "There is already an account with that email." };
    }

    const userId = await localCreateAccount({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    });

    if (!userId) {
      return { error: "There is already an account with that email." };
    }

    await createSession(userId);
    redirect("/");
    return AUTH_IDLE;
  } catch (error) {
    console.error("[gutguide] sign up failed:", error);
    return { error: "We could not create that account. Try again in a moment." };
  }

  redirect("/");
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check those details." };

  const db = getDb();

  try {
    if (db) {
      const [user] = await db
        .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
        .from(schema.users)
        .where(eq(schema.users.email, parsed.data.email))
        .limit(1);

      const wrong = { error: "That email and password do not match." };
      if (!user) return wrong;
      if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return wrong;

      await createSession(user.id);
      redirect("/");
      return AUTH_IDLE;
    }

    const localUser = await localAuthenticate(parsed.data.email, parsed.data.password);
    if (!localUser) return { error: "That email and password do not match." };

    await createSession(localUser.id);
    redirect("/");
    return AUTH_IDLE;
  } catch (error) {
    console.error("[gutguide] sign in failed:", error);
    return { error: "We could not sign you in. Try again in a moment." };
  }
}

export async function guestAction(): Promise<void> {
  const guestId = await startGuestSession();
  // A brand new guest always starts from a clean copy of the sample history.
  resetGuest(guestId);
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const actor = await getActiveUser();
  if (actor?.kind === "guest") resetGuest(actor.id);
  await destroySession();
  redirect("/login");
}

/** Copies the sample history onto a real account, for people who want to look around first. */
async function seedSampleHistory(userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  const { meals, symptoms } = demoHistory();

  await db
    .update(schema.users)
    .set({
      phase: DEMO_PROFILE.phase,
      restrictions: DEMO_PROFILE.restrictions,
      watchTraits: DEMO_PROFILE.watchTraits,
      favoriteCuisines: DEMO_PROFILE.favoriteCuisines,
      diagnosedYear: DEMO_PROFILE.diagnosedYear,
      goal: DEMO_PROFILE.goal,
    })
    .where(eq(schema.users.id, userId));

  for (let i = 0; i < meals.length; i += 200) {
    await db.insert(schema.mealLogs).values(
      meals.slice(i, i + 200).map((meal) => ({
        id: `${userId}-${meal.id}`,
        userId,
        name: meal.name,
        foodIds: meal.foodIds,
        portion: meal.portion,
        notes: meal.notes ?? null,
        source: meal.source ?? ("manual" as const),
        loggedAt: new Date(meal.loggedAt),
      })),
    );
  }

  for (let i = 0; i < symptoms.length; i += 200) {
    await db.insert(schema.symptomLogs).values(
      symptoms.slice(i, i + 200).map((entry) => ({
        id: `${userId}-${entry.id}`,
        userId,
        pain: entry.pain,
        bloating: entry.bloating,
        energy: entry.energy,
        urgency: entry.urgency,
        notes: entry.notes ?? null,
        loggedAt: new Date(entry.loggedAt),
      })),
    );
  }
}
