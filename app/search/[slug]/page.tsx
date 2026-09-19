import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert, Lightbulb, NotebookPen } from "lucide-react";
import { FoodRow } from "@/components/food/food-card";
import { NutritionPanel } from "@/components/food/nutrition-panel";
import {
  ExplanationSkeleton,
  ScoreBreakdown,
  ScoreExplanation,
} from "@/components/food/score-breakdown";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Chip, TraitChip } from "@/components/ui/chip";
import { Disclaimer, SectionHeading } from "@/components/ui/misc";
import { ScoreRing } from "@/components/ui/score-ring";
import { FOODS, getFood } from "@/lib/data/foods";
import { scoreFood } from "@/lib/scoring/compatibility";
import { getUserContext } from "@/lib/scoring/context";
import { BAND_STYLE } from "@/lib/ui";
import { cn, formatDay, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const food = getFood(slug);
  if (!food) return { title: "Food not found" };
  return { title: food.name, description: food.summary };
}

const OUTCOME_STYLE = {
  good: { label: "Easy afterwards", className: "bg-moss-50 text-moss-700 ring-moss-200" },
  mixed: { label: "Mixed", className: "bg-[#fdf4e2] text-[#8a6412] ring-[#f3dfb4]" },
  rough: { label: "Rough afterwards", className: "bg-clay-50 text-clay-600 ring-clay-200" },
} as const;

export default async function FoodDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const food = getFood(slug);
  if (!food) notFound();

  const ctx = await getUserContext();
  const compat = scoreFood(food, ctx);
  const history = ctx.insight.foodHistory.get(food.id);
  const style = BAND_STYLE[compat.band];

  // Foods that share characteristics, so the user has somewhere to go next.
  const similar = FOODS.filter(
    (f) => f.id !== food.id && f.traits.filter((t) => food.traits.includes(t)).length >= 2,
  )
    .map((f) => ({ food: f, compat: scoreFood(f, ctx) }))
    .sort((a, b) => b.compat.score - a.compat.score)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All foods
      </Link>

      {/* Header + score */}
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream-100 text-3xl"
              >
                {food.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  {titleCase(food.category)}
                </p>
                <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-ink">
                  {food.name}
                </h1>
                <p className="mt-2 max-w-xl leading-relaxed text-ink-soft">{food.summary}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {food.traits.map((t) => (
                <TraitChip key={t} id={t} />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <ButtonLink href={`/log?food=${food.slug}`}>
                <NotebookPen className="h-4 w-4" aria-hidden />
                Log this
              </ButtonLink>
              <ButtonLink href={`/near-you?food=${food.slug}`} variant="secondary">
                Find it near me
              </ButtonLink>
            </div>
          </div>

          <div
            className={cn(
              "flex flex-row items-center gap-5 rounded-2xl p-5 ring-1 ring-inset lg:w-64 lg:flex-col lg:text-center",
              style.bg,
              style.ring,
            )}
          >
            <ScoreRing score={compat.score} size={104} strokeWidth={9} />
            <div className="min-w-0">
              <p className={cn("font-display text-lg font-semibold leading-tight", style.text)}>
                {style.label}
              </p>
              <p className="mt-1.5 text-sm leading-snug text-ink-soft">{compat.headline}</p>
              <p className="mt-2.5 text-xs text-ink-faint">
                {compat.confidence === "high"
                  ? "Good confidence — you have logged this several times."
                  : compat.confidence === "medium"
                    ? "Moderate confidence — based mostly on similar foods."
                    : "Low confidence — log it once or twice to sharpen this."}
              </p>
            </div>
          </div>
        </div>

        {compat.restrictionConflicts.length > 0 && (
          <div className="flex items-start gap-2.5 border-t border-clay-200 bg-clay-50 px-5 py-3.5 sm:px-7">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-clay-500" aria-hidden />
            <p className="text-sm text-clay-600">{compat.restrictionConflicts.join(". ")}.</p>
          </div>
        )}
      </Card>

      {/* Why + history */}
      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <SectionHeading title="Why this score" description="Every factor that moved the number." />
          <Card>
            <CardBody className="space-y-5">
              <Suspense fallback={<ExplanationSkeleton />}>
                <ScoreExplanation food={food} compat={compat} profile={ctx.profile} history={history} />
              </Suspense>
              <ScoreBreakdown compat={compat} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <div>
            <SectionHeading title="Your history with it" />
            <Card>
              <CardBody>
                {!history || history.timesLogged === 0 ? (
                  <div className="py-2 text-center">
                    <p className="text-sm text-ink-soft">
                      You have not logged {food.name.toLowerCase()} yet.
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">
                      The score above leans on similar foods until you do.
                    </p>
                    <ButtonLink href={`/log?food=${food.slug}`} size="sm" variant="secondary" className="mt-4">
                      Log it now
                    </ButtonLink>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {(["good", "mixed", "rough"] as const).map((key) => (
                        <div
                          key={key}
                          className={cn(
                            "rounded-xl px-3 py-2.5 text-center ring-1 ring-inset",
                            OUTCOME_STYLE[key].className,
                          )}
                        >
                          <p className="font-display text-xl font-semibold tabular-nums">{history[key]}</p>
                          <p className="text-[0.68rem] font-medium leading-tight">
                            {OUTCOME_STYLE[key].label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <ul className="mt-4 space-y-1">
                      {history.entries.slice(0, 5).map((entry, i) => (
                        <li
                          key={`${entry.loggedAt}-${i}`}
                          className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm odd:bg-black/[0.02]"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              entry.outcome === "good"
                                ? "bg-moss-500"
                                : entry.outcome === "mixed"
                                  ? "bg-[color:var(--color-amber-soft)]"
                                  : "bg-clay-500",
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate text-ink-soft">{entry.mealName}</span>
                          <span className="shrink-0 text-xs text-ink-faint">{formatDay(entry.loggedAt)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-ink-faint">
                      Outcome is the worst discomfort you logged in the 14 hours after the meal. Other foods
                      in the same meal matter too — this is correlation, not proof.
                    </p>
                  </>
                )}
              </CardBody>
            </Card>
          </div>

          {compat.tips.length > 0 && (
            <Card className="bg-cream-100/70">
              <CardBody>
                <div className="mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-moss-600" aria-hidden />
                  <p className="text-sm font-semibold text-ink">Small tweaks that often help</p>
                </div>
                <ul className="space-y-2">
                  {compat.tips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-moss-400" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      </section>

      {/* Ingredients + nutrition */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading title="What is in it" />
          <Card>
            <CardBody>
              <div className="flex flex-wrap gap-1.5">
                {food.ingredients.map((ingredient) => (
                  <Chip key={ingredient}>{ingredient}</Chip>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-faint">
                A typical ingredient list. Always worth checking the specific version you are eating.
              </p>
            </CardBody>
          </Card>
        </div>
        <div>
          <SectionHeading title="Nutrition" />
          <Card>
            <CardBody>
              <NutritionPanel nutrition={food.nutrition} servingSize={food.servingSize} />
            </CardBody>
          </Card>
        </div>
      </section>

      {similar.length > 0 && (
        <section>
          <SectionHeading
            title="Similar foods, scored for you"
            description="These share at least two characteristics with it."
          />
          <Card>
            <CardBody className="space-y-0.5 p-3">
              {similar.map(({ food: f, compat: c }) => (
                <FoodRow key={f.id} food={f} compat={c} />
              ))}
            </CardBody>
          </Card>
        </section>
      )}

      <Disclaimer className="px-1" />
    </div>
  );
}
