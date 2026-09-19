import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, Clock, NotebookPen, Users } from "lucide-react";
import { CookModeButton } from "@/components/cook/recipe-view";
import { FoodRow } from "@/components/food/food-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Disclaimer, SectionHeading } from "@/components/ui/misc";
import { ScoreRing } from "@/components/ui/score-ring";
import { getFoods } from "@/lib/data/foods";
import { getRecipe } from "@/lib/data/recipes";
import { scoreCombination, scoreFood } from "@/lib/scoring/compatibility";
import { getUserContext } from "@/lib/scoring/context";
import { BAND_STYLE } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) return { title: "Recipe not found" };
  return { title: recipe.title, description: recipe.blurb };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) notFound();

  const ctx = await getUserContext();
  const foods = getFoods(recipe.foodIds);
  const compat = scoreCombination(foods, ctx);
  const style = BAND_STYLE[compat.band];
  const scoredFoods = foods.map((food) => ({ food, compat: scoreFood(food, ctx) }));

  return (
    <div className="space-y-8">
      <Link
        href="/cook"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All recipes
      </Link>

      <Card>
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream-100 text-3xl"
              >
                {recipe.emoji}
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-semibold leading-tight text-ink">
                  {recipe.title}
                </h1>
                <p className="mt-2 max-w-xl leading-relaxed text-ink-soft">{recipe.blurb}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              <Chip>
                <Clock className="h-3 w-3" aria-hidden />
                {recipe.minutes} min
              </Chip>
              <Chip>
                <Users className="h-3 w-3" aria-hidden />
                Serves {recipe.servings}
              </Chip>
              {recipe.tags.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <CookModeButton title={recipe.title} steps={recipe.steps} />
              <ButtonLink
                href={`/log?name=${encodeURIComponent(recipe.title)}&foods=${recipe.foodIds.join(",")}`}
                variant="secondary"
                size="lg"
              >
                <NotebookPen className="h-4 w-4" aria-hidden />
                Log it
              </ButtonLink>
            </div>
          </div>

          <div
            className={cn(
              "flex flex-row items-center gap-5 rounded-2xl p-5 ring-1 ring-inset lg:w-60 lg:flex-col lg:text-center",
              style.bg,
              style.ring,
            )}
          >
            <ScoreRing score={compat.score} size={96} strokeWidth={8} />
            <div className="min-w-0">
              <p className={cn("font-display text-lg font-semibold leading-tight", style.text)}>
                {style.label}
              </p>
              <p className="mt-1.5 text-sm leading-snug text-ink-soft">
                Estimated across every ingredient, weighted toward the trickiest one.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <div className="space-y-6">
          <div>
            <SectionHeading title="Ingredients" />
            <Card>
              <CardBody>
                <ul className="divide-y divide-black/5">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient.item} className="flex items-baseline justify-between gap-4 py-2.5">
                      <span className="text-sm text-ink">{ingredient.item}</span>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-ink-faint">
                        {ingredient.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          {recipe.swaps.length > 0 && (
            <div>
              <SectionHeading title="Swaps if something here is off-limits" />
              <Card>
                <CardBody className="space-y-3.5">
                  {recipe.swaps.map((swap) => (
                    <div key={swap.from} className="flex items-start gap-3">
                      <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" aria-hidden />
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {swap.from} → {swap.to}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{swap.why}</p>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        <div>
          <SectionHeading
            title="Method"
            description="Or hit guided cooking and have it read to you."
          />
          <Card>
            <CardBody>
              <ol className="space-y-5">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-moss-600 text-sm font-semibold text-white"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="leading-relaxed text-ink">{step.instruction}</p>
                      {step.timerSeconds && (
                        <Chip className="mt-2">
                          <Clock className="h-3 w-3" aria-hidden />
                          about {Math.round(step.timerSeconds / 60)} min
                        </Chip>
                      )}
                      {step.tip && (
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.tip}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeading
          title="How each ingredient scores for you"
          description="The same estimate you would get from searching it directly."
        />
        <Card>
          <CardBody className="space-y-0.5 p-3">
            {scoredFoods.map(({ food, compat: c }) => (
              <FoodRow key={food.id} food={food} compat={c} />
            ))}
          </CardBody>
        </Card>
      </section>

      <Disclaimer className="px-1" />
    </div>
  );
}
