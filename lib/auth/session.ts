import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export const SESSION_COOKIE = "gg_session";
export const GUEST_COOKIE = "gg_guest";

const SESSION_DAYS = 30;

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

/** Accounts need a database. Without one the app runs guest-only. */
export function accountsEnabled(): boolean {
  return getDb() !== null;
}

export async function createSession(userId: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Cannot create a session without a database.");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await db.insert(schema.sessions).values({ tokenHash: hashToken(token), userId, expiresAt });

  // Opportunistic cleanup, cheap enough to do inline.
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date())).catch(() => {});

  const store = await cookies();
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
  }

  const guestId = store.get(GUEST_COOKIE)?.value;
  if (guestId) return { kind: "guest", id: guestId };

  return null;
});
