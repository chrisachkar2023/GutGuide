import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Award, TrendingDown, TrendingUp } from "lucide-react";
import { MealVolumeChart, SymptomTrendChart } from "@/components/progress/charts";
import { RangeTabs } from "@/components/progress/range-tabs";
import { TrendSummary, TrendSummarySkeleton } from "@/components/progress/trend-summary";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Disclaimer, EmptyState, SectionHeading, Stat } from "@/components/ui/misc";
import {
  achievements,
  buildDailySeries,
  patternInsights,
  toleratedFoods,
  triggerCandidates,
  windowStats,
} from "@/lib/insights";
import { getUserContext } from "@/lib/scoring/context";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My progress",
  description: "Symptom trends, tolerated foods and patterns drawn from your own log.",
};

export const dynamic = "force-dynamic";

const ALLOWED_RANGES = [14, 30, 90];

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const days = ALLOWED_RANGES.includes(Number(range)) ? Number(range) : 30;

  const ctx = await getUserContext();
  const { profile, insight, meals, symptoms } = ctx;

  const stats = windowStats(symptoms, meals, days);
  const series = buildDailySeries(symptoms, meals, days);
  const tolerated = toleratedFoods(insight, 3, 8);
  const triggers = triggerCandidates(insight, 3, 6);
  const patterns = patternInsights(insight, 6);
  const earned = achievements(stats, insight, meals);
  const hasData = stats.checkIns > 0;

  return (
    <div className="space-y-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">My progress</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Everything here comes from what {profile.name} logged. These are correlations worth noticing
            and bringing to a care team — not conclusions.
          </p>
        </div>
        <RangeTabs active={days} />
      </header>

      {!hasData ? (
        <EmptyState
          title="No check-ins in this window"
          description="Log how you are feeling a few times and your trends will start filling in here."
          action={<ButtonLink href="/log?tab=symptoms">Log a check-in</ButtonLink>}
        />
      ) : (
        <>
          {/* Overview */}
          <section>
            <SectionHeading title="Overview" />
            <Card>
              <CardBody className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat
                    label="Avg pain"
                    value={`${stats.avgPain}/10`}
                    hint={deltaHint(stats.painChange, "lower")}
                    tone={stats.avgPain < 3 ? "good" : stats.avgPain > 5 ? "watch" : "neutral"}
                  />
                  <Stat
                    label="Avg bloating"
                    value={`${stats.avgBloating}/10`}
                    hint={deltaHint(stats.bloatingChange, "lower")}
                    tone={stats.avgBloating < 3 ? "good" : stats.avgBloating > 5 ? "watch" : "neutral"}
                  />
                  <Stat
                    label="Avg energy"
                    value={`${stats.avgEnergy}/10`}
                    hint={deltaHint(stats.energyChange, "higher")}
                    tone={stats.avgEnergy > 6 ? "good" : "neutral"}
                  />
                  <Stat
                    label="Calm days"
                    value={`${stats.easyDays}/${days}`}
                    hint={`Best run: ${stats.bestStreak} in a row`}
                    tone={stats.easyDays / days > 0.4 ? "good" : "neutral"}
                  />
                </div>

                <Suspense fallback={<TrendSummarySkeleton />}>
                  <TrendSummary
                    name={profile.name}
                    stats={stats}
                    topTolerated={tolerated.slice(0, 4).map((t) => t.name)}
                    topWatch={patterns.filter((p) => p.direction === "watch").slice(0, 3).map((p) => p.label)}
                  />
                </Suspense>
              </CardBody>
            </Card>
          </section>

          {/* Symptom trends */}
          <section>
            <SectionHeading
              title="Symptom trends"
              description="Daily averages across your check-ins. Tap a label to hide a line."
            />
            <Card>
              <CardBody>
                <SymptomTrendChart data={series} />
              </CardBody>
            </Card>
          </section>

          {/* Food insights */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div>
              <SectionHeading
                title="Sitting well with you"
                description={`Logged at least 3 times in the last ${days} days.`}
              />
              <Card className="h-[calc(100%-3.25rem)]">
                <CardBody className="p-3">
                  {tolerated.length === 0 ? (
                    <EmptyState
                      title="Not enough repeats yet"
                      description="Foods appear here once you have logged them a few times."
                      className="border-0 bg-transparent"
                    />
                  ) : (
                    <ul>
                      {tolerated.map((item) => (
                        <li key={item.foodId}>
                          <Link
                            href={`/search/${item.foodId}`}
                            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-black/[0.035]"
                          >
                            <span
                              aria-hidden
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-moss-50 text-lg"
                            >
                              {item.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                              <p className="text-xs text-ink-faint">
                                {item.timesLogged} meals · avg discomfort {item.avgDiscomfort}/10
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-moss-50 px-2.5 py-1 text-xs font-semibold text-moss-700 ring-1 ring-inset ring-moss-200">
                              {Math.round(item.goodRate * 100)}% easy
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>

            <div>
              <SectionHeading
                title="Worth keeping an eye on"
                description="Followed by more discomfort than your usual day."
              />
              <Card className="h-[calc(100%-3.25rem)]">
                <CardBody className="p-3">
                  {triggers.length === 0 ? (
                    <EmptyState
                      title="Nothing standing out"
                      description="No food in your log is consistently followed by a rougher stretch. That is a good place to be."
                      className="border-0 bg-transparent"
                    />
                  ) : (
                    <ul>
                      {triggers.map((item) => (
                        <li key={item.foodId}>
                          <Link
                            href={`/search/${item.foodId}`}
                            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-black/[0.035]"
                          >
                            <span
                              aria-hidden
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay-50 text-lg"
                            >
                              {item.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                              <p className="text-xs text-ink-faint">
                                {item.timesLogged} meals · avg discomfort {item.avgDiscomfort}/10 vs your{" "}
                                {insight.baseline.toFixed(1)} baseline
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-clay-50 px-2.5 py-1 text-xs font-semibold text-clay-600 ring-1 ring-inset ring-clay-200">
                              watch
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="px-3 pb-1 pt-3 text-xs text-ink-faint">
                    Meals contain several foods at once, so these are candidates to test — not confirmed
                    triggers.
                  </p>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* Patterns */}
          <section>
            <SectionHeading
              title="Characteristics, not just foods"
              description="Comparing your average discomfort with and without each characteristic."
            />
            <Card>
              <CardBody className="grid gap-3 sm:grid-cols-2">
                {patterns.length === 0 ? (
                  <p className="text-sm text-ink-soft">Not enough overlapping meals yet to compare.</p>
                ) : (
                  patterns.map((pattern) => (
                    <div key={pattern.traitId} className="flex items-start gap-3 rounded-2xl bg-cream-100/60 p-3.5">
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                          pattern.direction === "watch"
                            ? "bg-clay-100 text-clay-600"
                            : "bg-moss-100 text-moss-700",
                        )}
                      >
                        {pattern.direction === "watch" ? (
                          <TrendingUp className="h-4 w-4" aria-hidden />
                        ) : (
                          <TrendingDown className="h-4 w-4" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{pattern.label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                          {pattern.direction === "watch"
                            ? `+${pattern.delta} discomfort on average across ${pattern.mealsWith} meals.`
                            : `${Math.abs(pattern.delta)} less discomfort on average across ${pattern.mealsWith} meals.`}{" "}
                          {pattern.blurb}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </section>

          {/* Meals + achievements */}
          <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <SectionHeading title="Meals logged" description={`${stats.mealsLogged} in the last ${days} days.`} />
              <Card>
                <CardBody>
                  <MealVolumeChart data={series} />
                </CardBody>
              </Card>
            </div>
            <div>
              <SectionHeading title="Milestones" />
              <Card>
                <CardBody className="space-y-3">
                  {earned.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                          item.earned ? "bg-moss-100 text-moss-700" : "bg-black/[0.05] text-ink-faint",
                        )}
                      >
                        <Award className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            item.earned ? "text-ink" : "text-ink-soft",
                          )}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-ink-faint">{item.detail}</p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                          <div
                            className={cn("h-full rounded-full", item.earned ? "bg-moss-500" : "bg-moss-300")}
                            style={{ width: `${Math.round(item.progress * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </section>
        </>
      )}

      <Disclaimer className="px-1" />
    </div>
  );
}

function deltaHint(change: number, better: "higher" | "lower"): string {
  if (Math.abs(change) < 0.2) return "Steady versus the window before";
  const improved = better === "lower" ? change < 0 : change > 0;
  return `${change > 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)} versus the window before — ${improved ? "better" : "worse"}`;
}
