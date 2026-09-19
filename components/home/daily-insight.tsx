import { Sparkles } from "lucide-react";
import { dailyInsight } from "@/lib/ai/explain";
import { getUserContext } from "@/lib/scoring/context";
import { patternInsights, toleratedFoods } from "@/lib/insights";
import { AiBadge, Skeleton } from "@/components/ui/misc";
import { relativeTime } from "@/lib/utils";

export function DailyInsightSkeleton() {
  return (
    <div className="rounded-2xl bg-white/60 p-4 ring-1 ring-inset ring-black/5">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-3.5 w-full" />
      <Skeleton className="mt-2 h-3.5 w-11/12" />
      <Skeleton className="mt-2 h-3.5 w-2/3" />
    </div>
  );
}

/** Streamed in separately so the hero renders instantly even if Gemini is slow. */
export async function DailyInsight() {
  const { profile, insight, meals } = await getUserContext();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const lastMeal = meals[0];
  const explanation = await dailyInsight({
    name: profile.name,
    phase: profile.phase,
    recentDiscomfort: insight.recentDiscomfort,
    lastMeal: lastMeal?.name,
    lastMealAt: lastMeal ? relativeTime(lastMeal.loggedAt) : undefined,
    easyFoods: toleratedFoods(insight).slice(0, 4).map((f) => f.name),
    watchPatterns: patternInsights(insight)
      .filter((p) => p.direction === "watch")
      .slice(0, 3)
      .map((p) => p.label),
    loggedToday: meals.filter((m) => new Date(m.loggedAt) >= todayStart).length,
  });

  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-inset ring-black/5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-moss-500" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Today&rsquo;s read on your week
        </span>
        <span className="ml-auto">
          <AiBadge source={explanation.source} />
        </span>
      </div>
      <p className="text-[0.95rem] leading-relaxed text-ink-soft">{explanation.text}</p>
    </div>
  );
}
