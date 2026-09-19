export type AppSessionMode = "demo" | "guest" | "logged-in";

export type AppSession = {
  mode: AppSessionMode;
  label: string;
  userId: string;
};

export const DEFAULT_SESSION: AppSession = {
  mode: "demo",
  label: "Riley",
  userId: "demo-user",
};

const SESSION_COOKIE_NAME = "gutguide-session";
const SESSION_STORAGE_KEY = "gutguide-session";

function normalizeSession(value: Partial<AppSession> | null | undefined): AppSession {
  if (!value || typeof value.label !== "string") return DEFAULT_SESSION;

  return {
    mode: value.mode === "guest" || value.mode === "logged-in" ? value.mode : "demo",
    label: value.label,
    userId: value.userId ?? DEFAULT_SESSION.userId,
  };
}

export function getSessionFromStorage(): AppSession {
  if (typeof window === "undefined") return DEFAULT_SESSION;

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSession>;
      return normalizeSession(parsed);
    }
    const cookieValue = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));
    if (!cookieValue) return DEFAULT_SESSION;
    const parsed = JSON.parse(decodeURIComponent(cookieValue.split("=").slice(1).join("="))) as Partial<AppSession>;
    return normalizeSession(parsed);
  } catch {
    return DEFAULT_SESSION;
  }
}

export function getSessionFromCookie(cookieValue?: string | null): AppSession {
  if (!cookieValue) return DEFAULT_SESSION;

  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue)) as Partial<AppSession>;
    return normalizeSession(parsed);
  } catch {
    return DEFAULT_SESSION;
  }
}

export function setSessionInStorage(session: AppSession): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    if (session.mode === "logged-in") {
      const encoded = encodeURIComponent(JSON.stringify(session));
      document.cookie = `${SESSION_COOKIE_NAME}=${encoded}; path=/; max-age=31536000; sameSite=lax`;
    } else {
      document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; sameSite=lax`;
    }
  } catch {
    // Ignore storage quota or private-mode issues.
  }
}

export function clearSessionInStorage(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; sameSite=lax`;
  } catch {
    // Ignore storage errors.
  }
}

export function getSessionCookieValue(): string | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));
  return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE_NAME.length + 1)) : null;
}

export function getSessionFromServerCookie(cookieValue?: string | null): AppSession {
  return getSessionFromCookie(cookieValue);
}
