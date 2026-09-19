"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { Logo } from "@/components/layout/logo";
import { DEFAULT_SESSION, getSessionFromStorage, setSessionInStorage, type AppSession, type AppSessionMode } from "@/lib/session";
import { cn } from "@/lib/utils";

function createSessionForMode(mode: AppSessionMode, currentLabel: string): AppSession {
  if (mode === "demo") return DEFAULT_SESSION;

  if (mode === "guest") {
    return { mode: "guest", label: "Guest", userId: `guest-${Date.now().toString(36)}` };
  }

  const nextLabel = window.prompt("What should we call you?", currentLabel || "You")?.trim() || currentLabel || "You";
  return {
    mode: "logged-in",
    label: nextLabel,
    userId: `user-${Date.now().toString(36)}`,
  };
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const [session, setSession] = useState<AppSession>(() => getSessionFromStorage());

  const updateSession = (mode: AppSessionMode) => {
    const nextSession = createSessionForMode(mode, session.label);
    setSession(nextSession);
    setSessionInStorage(nextSession);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-cream-50/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="GutGuide home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV_ITEMS.filter((item) => !item.exact).map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-moss-600/10 text-moss-700" : "text-ink-soft hover:bg-black/5 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full bg-cream-100 p-1 md:flex">
            {([
              ["demo", "Demo"],
              ["guest", "Guest"],
              ["logged-in", "Login"],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateSession(mode)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  session.mode === mode ? "bg-moss-600 text-white" : "text-ink-soft hover:bg-black/5",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="hidden rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-ink-soft md:block">
            {session.label}
          </div>
          <Link
            href="/log"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-moss-600 px-4 text-sm font-medium text-white shadow-sm shadow-moss-900/20 transition-colors hover:bg-moss-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Log</span>
            <span className="sr-only sm:hidden">Log a meal or symptoms</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-cream-50/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 px-0.5 py-2.5 transition-colors",
                  active ? "text-moss-700" : "text-ink-faint hover:text-ink-soft",
                )}
              >
                <Icon className="h-[1.3rem] w-[1.3rem]" strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                <span className="truncate text-[0.62rem] font-medium leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
