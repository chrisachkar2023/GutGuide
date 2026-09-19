import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChefHat,
  MapPin,
  NotebookPen,
  ScanLine,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { DailyInsight, DailyInsightSkeleton } from "@/components/home/daily-insight";
import { FoodRow } from "@/components/food/food-card";
import { Sparkline } from "@/components/progress/charts";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Disclaimer, EmptyState, SectionHeading, Stat } from "@/components/ui/misc";
import { ScoreBadge } from "@/components/ui/score-ring";
import { getFoods } from "@/lib/data/foods";
import { RECIPES } from "@/lib/data/recipes";
import { buildDailySeries, patternInsights, toleratedFoods, windowStats } from "@/lib/insights";
import { scoreCombination, scoreFood } from "@/lib/scoring/compatibility";
import { getUserContext } from "@/lib/scoring/context";
import { cn, formatTime, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/log", label: "Log a meal", detail: "Takes about 20 seconds", icon: NotebookPen, tone: "primary" },
  { href: "/search", label: "Look up a food", detail: "See how it fits you", icon: Search, tone: "plain" },
  { href: "/scan", label: "Scan a menu", detail: "Photo or paste text", icon: ScanLine, tone: "plain" },
  { href: "/near-you", label: "Find food near you", detail: "Picks from your history", icon: MapPin, tone: "plain" },
] as const;

const PHASE_COPY: Record<string, string> = {
  remission: "In a stable stretch",
  recovering: "Coming out of a rough patch",
  flare: "Flaring right now",
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const ctx = await getUserContext();
  const { profile, insight, meals, symptoms } = ctx;

  const stats = windowStats(symptoms, meals, 14);
  const series = buildDailySeries(symptoms, meals, 14);
  const tolerated = toleratedFoods(insight, 3, 5);
  const patterns = patternInsights(insight, 3);
  const lastCheckIn = symptoms[0];
  const recentMeals = meals.slice(0, 4);

  const toleratedFoodsFull = getFoods(tolerated.map((t) => t.foodId));
  const scoredTolerated = toleratedFoodsFull.map((food) => ({
    food,
    compat: scoreFood(food, ctx),
  }));

  const recipePick = RECIPES.map((recipe) => ({
    recipe,
    compat: scoreCombination(getFoods(recipe.foodIds), ctx),
  })).sort((a, b) => b.compat.score - a.compat.score)[0];

  return (
    <div className="space-y-10 pb-4">
      {/* Hero */}
      <section className="stagger">
        <Card className="overflow-hidden">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip className="bg-moss-50 text-moss-700 ring-moss-200">
                  {PHASE_COPY[profile.phase] ?? profile.phase}
                </Chip>
                <Chip>Diagnosed {profile.diagnosedYear}</Chip>
              </div>

              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                {greeting()}, {profile.name}.
              </h1>
              <p className="mt-3 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
                Crohn&rsquo;s is personal, so food guidance should be too. GutGuide reads{" "}
                <strong className="font-semibold text-ink">your</strong> meals and symptoms — not a
                universal safe-foods list — to estimate how a food tends to sit with you.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <ButtonLink href="/log">
                  <NotebookPen className="h-4 w-4" aria-hidden />
                  Log a meal
                </ButtonLink>
                <ButtonLink href="/search" variant="secondary">
                  <Search className="h-4 w-4" aria-hidden />
                  Search a food
                </ButtonLink>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <Suspense fallback={<DailyInsightSkeleton />}>
                <DailyInsight />
              </Suspense>
            </div>
          </div>
        </Card>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="sr-only">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "group flex flex-col gap-2 rounded-[var(--radius-xl2)] p-4 transition-all duration-200 hover:-translate-y-0.5",
                  action.tone === "primary"
                    ? "bg-moss-600 text-white shadow-sm shadow-moss-900/20"
                    : "surface",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", action.tone === "primary" ? "text-white/90" : "text-moss-600")}
                  aria-hidden
                />
                <span className="mt-1 text-sm font-semibold leading-tight">{action.label}</span>
                <span
                  className={cn(
                    "text-xs leading-snug",
                    action.tone === "primary" ? "text-white/75" : "text-ink-faint",
                  )}
                >
                  {action.detail}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Two week snapshot */}
      <section>
        <SectionHeading
          title="Your last two weeks"
          description="Pulled from every check-in you logged."
          action={
            <Link
              href="/progress"
              className="inline-flex items-center gap-1 text-sm font-medium text-moss-700 hover:underline"
            >
              Full progress <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
        <Card>
          <CardBody className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Avg pain"
              value={`${stats.avgPain}/10`}
              hint={changeHint(stats.painChange, "lower")}
              tone={stats.avgPain < 3 ? "good" : stats.avgPain > 5 ? "watch" : "neutral"}
            />
            <Stat
              label="Avg energy"
              value={`${stats.avgEnergy}/10`}
              hint={changeHint(stats.energyChange, "higher")}
              tone={stats.avgEnergy > 6 ? "good" : "neutral"}
            />
            <Stat label="Meals logged" value={stats.mealsLogged} hint={`${stats.checkIns} symptom check-ins`} />
            <Stat
              label="Calm days"
              value={stats.easyDays}
              hint={`Best run: ${stats.bestStreak} in a row`}
              tone={stats.easyDays > 6 ? "good" : "neutral"}
            />
            <div className="sm:col-span-2 lg:col-span-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Pain, last 14 days</p>
                <p className="text-xs text-ink-faint">Lower is better</p>
              </div>
              <Sparkline data={series} dataKey="pain" />
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Activity + patterns */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading
            title="Recent activity"
            action={
              <Link href="/log" className="text-sm font-medium text-moss-700 hover:underline">
                Add entry
              </Link>
            }
          />
          <Card>
            <CardBody className="space-y-1 p-3">
              {recentMeals.length === 0 ? (
                <EmptyState
                  title="Nothing logged yet"
                  description="Log your first meal and GutGuide starts learning your patterns straight away."
                  action={<ButtonLink href="/log">Log a meal</ButtonLink>}
                  className="border-0 bg-transparent"
                />
              ) : (
                recentMeals.map((meal) => {
                  const foods = getFoods(meal.foodIds);
                  const compat = scoreCombination(foods, ctx);
                  return (
                    <div key={meal.id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
                      <span
                        aria-hidden
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream-100 text-lg"
                      >
                        {foods[0]?.emoji ?? "🍽️"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{meal.name}</p>
                        <p className="text-xs text-ink-faint">
                          {relativeTime(meal.loggedAt)} · {formatTime(meal.loggedAt)}
                        </p>
                      </div>
                      <ScoreBadge score={compat.score} />
                    </div>
                  );
                })
              )}

              {lastCheckIn && (
                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-cream-100/70 px-3 py-3">
                  <span aria-hidden className="text-lg">
                    📝
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">Last symptom check-in</p>
                    <p className="text-xs text-ink-faint">
                      Pain {lastCheckIn.pain} · Bloating {lastCheckIn.bloating} · Energy {lastCheckIn.energy} ·{" "}
                      {relativeTime(lastCheckIn.loggedAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <SectionHeading
            title="What your log is showing"
            description="Correlations from your own entries, not general advice."
          />
          <Card>
            <CardBody className="space-y-3">
              {patterns.length === 0 ? (
                <EmptyState
                  title="Still gathering data"
                  description="A few more logged meals and symptom check-ins and patterns start surfacing here."
                  className="border-0 bg-transparent"
                />
              ) : (
                patterns.map((pattern) => (
                  <div
                    key={pattern.traitId}
                    className="flex items-start gap-3 rounded-2xl bg-cream-100/60 p-3.5"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        pattern.direction === "watch" ? "bg-clay-100 text-clay-600" : "bg-moss-100 text-moss-700",
                      )}
                    >
                      {pattern.direction === "watch" ? (
                        <TrendingUp className="h-4 w-4" aria-hidden />
                      ) : (
                        <TrendingDown className="h-4 w-4" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {pattern.label}{" "}
                        <span className="font-normal text-ink-soft">
                          {pattern.direction === "watch"
                            ? `lines up with +${pattern.delta} more discomfort`
                            : `lines up with ${Math.abs(pattern.delta)} less discomfort`}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        Across {pattern.mealsWith} meals that included it. {pattern.blurb}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Foods working for you */}
      <section>
        <SectionHeading
          title="Working well for you lately"
          description="Ranked by how your check-ins looked afterwards."
          action={
            <Link href="/search" className="text-sm font-medium text-moss-700 hover:underline">
              Browse all foods
            </Link>
          }
        />
        <Card>
          <CardBody className="p-3">
            {scoredTolerated.length === 0 ? (
              <EmptyState
                title="No clear favourites yet"
                description="Once a food shows up a few times in your log, it will appear here."
                className="border-0 bg-transparent"
              />
            ) : (
              <div className="space-y-0.5">
                {scoredTolerated.map(({ food, compat }) => (
                  <FoodRow key={food.id} food={food} compat={compat} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Cook tonight */}
      {recipePick && (
        <section>
          <SectionHeading title="Something to cook tonight" description="Chosen against your history and preferences." />
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
              <span
                aria-hidden
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream-100 text-3xl"
              >
                {recipePick.recipe.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-semibold text-ink">{recipePick.recipe.title}</h3>
                  <ScoreBadge score={recipePick.compat.score} />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{recipePick.recipe.blurb}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Chip>{recipePick.recipe.minutes} min</Chip>
                  <Chip>Serves {recipePick.recipe.servings}</Chip>
                  {recipePick.recipe.tags.slice(0, 2).map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
              </div>
              <ButtonLink href={`/cook/${recipePick.recipe.slug}`} className="sm:shrink-0">
                <ChefHat className="h-4 w-4" aria-hidden />
                Cook it
              </ButtonLink>
            </div>
          </Card>
        </section>
      )}

      <Disclaimer className="px-1" />
    </div>
  );
}

function changeHint(change: number, better: "higher" | "lower"): string {
  if (Math.abs(change) < 0.2) return "About the same as before";
  const improved = better === "lower" ? change < 0 : change > 0;
  const arrow = change > 0 ? "↑" : "↓";
  return `${arrow} ${Math.abs(change).toFixed(1)} vs the two weeks before — ${improved ? "better" : "worse"}`;
}
