import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { DEMO_PROFILE } from "@/lib/data/demo-user";

export const SESSION_COOKIE = "gg_session";
export const GUEST_COOKIE = "gg_guest";

declare global {
  var __gutguideLocalUsers: Map<string, LocalUserRecord> | undefined;
  var __gutguideLocalSessions: Map<string, string> | undefined;
}

const SESSION_DAYS = 30;

type LocalUserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
};

function localUsers(): Map<string, LocalUserRecord> {
  globalThis.__gutguideLocalUsers ??= new Map<string, LocalUserRecord>();
  return globalThis.__gutguideLocalUsers;
}

function localSessions(): Map<string, string> {
  globalThis.__gutguideLocalSessions ??= new Map<string, string>();
  return globalThis.__gutguideLocalSessions;
}

export function localUserById(id: string): LocalUserRecord | undefined {
  for (const user of localUsers().values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function ensureDemoAccount(): Promise<void> {
  const email = "demo@gutguide.app";
  const map = localUsers();
  if (map.has(email)) return;

  map.set(email, {
    id: DEMO_PROFILE.id,
    email,
    name: DEMO_PROFILE.name,
    passwordHash: await hashPassword("gutguide123"),
  });
}

export async function localCreateAccount({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const map = localUsers();
  if (map.has(normalized)) return null;

  const userId = `local-${randomBytes(12).toString("base64url")}`;
  map.set(normalized, {
    id: userId,
    email: normalized,
    name: name.trim(),
    passwordHash: await hashPassword(password),
  });

  return userId;
}

export async function localAuthenticate(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string } | null> {
  await ensureDemoAccount();
  const user = localUsers().get(normalizeEmail(email));
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name };
}

export function resetLocalAuth(): void {
  globalThis.__gutguideLocalUsers = new Map<string, LocalUserRecord>();
  globalThis.__gutguideLocalSessions = new Map<string, string>();
}

/**
 * Who the current request belongs to.
 *
 * A `guest` keeps everything in memory for the life of the server process; a
 * `user` is a real row in Postgres.
 */
export type ActiveUser =
  | { kind: "user"; id: string; email: string; name: string }
  | { kind: "guest"; id: string };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Local auth is always available so users can sign in or create an account in demo mode. */
export function accountsEnabled(): boolean {
  return true;
}

export async function createSession(userId: string): Promise<void> {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const store = await cookies();

  if (!db) {
    localSessions().set(token, userId);
    store.set(SESSION_COOKIE, token, cookieOptions(SESSION_DAYS * 86_400));
    store.delete(GUEST_COOKIE);
    return;
  }

  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await db.insert(schema.sessions).values({ tokenHash: hashToken(token), userId, expiresAt });

  // Opportunistic cleanup, cheap enough to do inline.
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date())).catch(() => {});

  store.set(SESSION_COOKIE, token, cookieOptions(SESSION_DAYS * 86_400));
  store.delete(GUEST_COOKIE);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = getDb();
    if (db) {
      await db
        .delete(schema.sessions)
        .where(eq(schema.sessions.tokenHash, hashToken(token)))
        .catch(() => {});
    } else {
      localSessions().delete(token);
    }
  }

  store.delete(SESSION_COOKIE);
  store.delete(GUEST_COOKIE);
}

export async function startGuestSession(): Promise<string> {
  const guestId = `guest-${randomBytes(12).toString("base64url")}`;
  const store = await cookies();
  store.set(GUEST_COOKIE, guestId, cookieOptions(86_400));
  store.delete(SESSION_COOKIE);
  return guestId;
}

/** Resolves the signed-in account, else a guest, else nobody. Cached per request. */
export const getActiveUser = cache(async (): Promise<ActiveUser | null> => {
  const store = await cookies();

  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = getDb();
    if (db) {
      try {
        const [row] = await db
          .select({
            id: schema.users.id,
            email: schema.users.email,
            name: schema.users.name,
          })
          .from(schema.sessions)
          .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
          .where(
            and(
              eq(schema.sessions.tokenHash, hashToken(token)),
              gt(schema.sessions.expiresAt, new Date()),
            ),
          )
          .limit(1);

        if (row) return { kind: "user", id: row.id, email: row.email, name: row.name };
      } catch (error) {
        console.warn(
          "[gutguide] session lookup failed:",
          error instanceof Error ? error.message : error,
        );
      }
    }

    const localUserId = localSessions().get(token);
    if (localUserId) {
      const localUser = localUserById(localUserId);
      if (localUser) {
        return { kind: "user", id: localUser.id, email: localUser.email, name: localUser.name };
      }
    }
  }

  const guestId = store.get(GUEST_COOKIE)?.value;
  if (guestId) return { kind: "guest", id: guestId };

  return null;
});
