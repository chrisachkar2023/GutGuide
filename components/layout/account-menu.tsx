"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

export function AccountMenu({
  name,
  email,
  isGuest,
}: {
  name: string;
  email?: string;
  isGuest: boolean;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (name.trim()[0] ?? "?").toUpperCase();

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full text-sm font-semibold transition-colors",
          isGuest
            ? "bg-cream-200 text-ink-soft hover:bg-cream-300"
            : "bg-moss-600/10 text-moss-700 hover:bg-moss-600/20",
        )}
      >
        {isGuest ? <User className="h-4.5 w-4.5" aria-hidden /> : initial}
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl"
        >
          <div className="border-b border-black/5 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">
              {isGuest ? "Guest session" : name}
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-faint">
              {isGuest ? "Nothing here is saved" : email}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-ink-soft transition-colors hover:bg-black/[0.035] hover:text-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {isGuest ? "Leave guest mode" : "Sign out"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
