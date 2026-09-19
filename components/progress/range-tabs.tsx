"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const RANGES = [14, 30, 90];

export function RangeTabs({ active }: { active: number }) {
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div aria-label="Time range" className="inline-flex rounded-full bg-cream-100 p-1">
      {RANGES.map((days) => {
        const next = new URLSearchParams(params.toString());
        next.set("range", String(days));
        return (
          <Link
            key={days}
            aria-current={active === days ? "page" : undefined}
            href={`${pathname}?${next.toString()}`}
            scroll={false}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              active === days ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink",
            )}
          >
            {days}d
          </Link>
        );
      })}
    </div>
  );
}
