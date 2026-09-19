import { Sparkles } from "lucide-react";
import { summarizeTrends } from "@/lib/ai/explain";
import { AiBadge, Skeleton } from "@/components/ui/misc";
import type { WindowStats } from "@/lib/insights";

export function TrendSummarySkeleton() {
  return (
    <div className="rounded-2xl bg-moss-50/70 p-5">
      <Skeleton className="h-3 w-40 bg-moss-200/50" />
      <Skeleton className="mt-3 h-4 w-full bg-moss-200/50" />
      <Skeleton className="mt-2 h-4 w-11/12 bg-moss-200/50" />
      <Skeleton className="mt-2 h-4 w-3/4 bg-moss-200/50" />
    </div>
  );
}

export async function TrendSummary({
  name,
  stats,
  topTolerated,
  topWatch,
}: {
  name: string;
  stats: WindowStats;
  topTolerated: string[];
  topWatch: string[];
}) {
  const summary = await summarizeTrends({
    name,
    days: stats.days,
    mealsLogged: stats.mealsLogged,
    avgPain: stats.avgPain,
    avgBloating: stats.avgBloating,
    avgEnergy: stats.avgEnergy,
    painChange: stats.painChange,
    energyChange: stats.energyChange,
    topTolerated,
    topWatch,
    bestStreak: stats.bestStreak,
  });

  return (
    <div className="rounded-2xl bg-moss-50/70 p-5 ring-1 ring-inset ring-moss-100">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-moss-600" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide text-moss-700">
          Your {stats.days}-day summary
        </span>
        <span className="ml-auto">
          <AiBadge source={summary.source} />
        </span>
      </div>
      <p className="text-[1rem] leading-relaxed text-ink-soft">{summary.text}</p>
    </div>
  );
}
