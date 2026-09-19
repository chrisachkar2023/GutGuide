import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mic, Users } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Disclaimer, SectionHeading } from "@/components/ui/misc";
import { ScoreRing } from "@/components/ui/score-ring";
import { getFoods } from "@/lib/data/foods";
import { RECIPES } from "@/lib/data/recipes";
import { scoreCombination } from "@/lib/scoring/compatibility";
import { getUserContext } from "@/lib/scoring/context";
import { BAND_STYLE } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cook",
  description: "Recipes built around the foods that have been working for you, with voice guidance.",
};

export const dynamic = "force-dynamic";

export default async function CookPage() {
  const ctx = await getUserContext();

  const recipes = RECIPES.map((recipe) => {
    const foods = getFoods(recipe.foodIds);
    const compat = scoreCombination(foods, ctx);
    const familiar = foods.filter((f) => (ctx.insight.foodHistory.get(f.id)?.timesLogged ?? 0) >= 2);
    return { recipe, compat, familiar };
  }).sort((a, b) => b.compat.score - a.compat.score);

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Cook</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Recipes ordered by how well they match {ctx.profile.name}&rsquo;s history, each one with a
          hands-free mode that reads the steps aloud so you are not wiping your hands to scroll.
        </p>
      </header>

      <Card className="bg-moss-600 text-white">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Mic className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">Guided cooking reads every step out loud</p>
            <p className="mt-1 text-sm leading-relaxed text-white/80">
              Built-in timers, big type, and arrow-key navigation. Voiced by ElevenLabs when a key is
              configured, and by your browser when it is not.
            </p>
          </div>
        </CardBody>
      </Card>

      <section>
        <SectionHeading title="Matched to your history" description="Best fit first." />
        <ul className="grid gap-4 sm:grid-cols-2">
          {recipes.map(({ recipe, compat, familiar }) => {
            const style = BAND_STYLE[compat.band];
            return (
              <li key={recipe.id}>
                <Link
                  href={`/cook/${recipe.slug}`}
                  className="surface flex h-full flex-col gap-3 rounded-[var(--radius-xl2)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(29,26,23,0.05),0_18px_36px_-22px_rgba(29,26,23,0.4)]"
                >
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cream-100 text-2xl"
                    >
                      {recipe.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-lg font-semibold leading-tight text-ink">
                        {recipe.title}
                      </h2>
                      <p className={cn("mt-1 text-xs font-medium", style.text)}>{style.label}</p>
                    </div>
                    <ScoreRing score={compat.score} size={52} strokeWidth={5} showLabel={false} />
                  </div>

                  <p className="text-sm leading-relaxed text-ink-soft">{recipe.blurb}</p>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                    <Chip>
                      <Clock className="h-3 w-3" aria-hidden />
                      {recipe.minutes} min
                    </Chip>
                    <Chip>
                      <Users className="h-3 w-3" aria-hidden />
                      {recipe.servings}
                    </Chip>
                    {recipe.tags.slice(0, 2).map((tag) => (
                      <Chip key={tag}>{tag}</Chip>
                    ))}
                  </div>

                  {familiar.length > 0 && (
                    <p className="text-xs text-ink-faint">
                      Uses {familiar.length} {familiar.length === 1 ? "food" : "foods"} already in your log
                      {": "}
                      {familiar.slice(0, 3).map((f) => f.name.toLowerCase()).join(", ")}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <Disclaimer className="px-1" />
    </div>
  );
}
