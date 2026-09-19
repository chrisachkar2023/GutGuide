import type { Metadata } from "next";
import { LogForm, type PickerFood } from "@/components/log/log-form";
import { Card, CardBody } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/misc";
import { FOODS, getFood } from "@/lib/data/foods";
import { scoreFood } from "@/lib/scoring/compatibility";
import { getUserContext } from "@/lib/scoring/context";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Log",
  description: "Log a meal or a symptom check-in.",
};

export const dynamic = "force-dynamic";

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ food?: string; tab?: string; name?: string; foods?: string }>;
}) {
  const { food: foodSlug, tab, name, foods: foodList } = await searchParams;
  const ctx = await getUserContext();

  const pickerFoods: PickerFood[] = FOODS.map((food) => ({
    id: food.id,
    name: food.name,
    emoji: food.emoji,
    keywords: [food.name, food.category, ...food.ingredients, ...(food.aliases ?? [])]
      .join(" ")
      .toLowerCase(),
    score: scoreFood(food, ctx).score,
  }));

  const preselected = [foodSlug, ...(foodList?.split(",") ?? [])]
    .filter(Boolean)
    .map((slug) => getFood(slug as string)?.id)
    .filter((id): id is string => Boolean(id));

  const recent = ctx.meals.slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Log an entry</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Two kinds of entry, and both matter. Meals tell GutGuide what you ate; check-ins tell it how that
          went. The connection between them is where the personalization comes from.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <LogForm
          foods={pickerFoods}
          preselected={[...new Set(preselected)]}
          defaultTab={tab === "symptoms" ? "symptoms" : "meal"}
          presetName={name ?? ""}
        />

        <Card>
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Recently logged
            </h2>
            {recent.length === 0 ? (
              <p className="text-sm text-ink-soft">Nothing yet — your first entry will show up here.</p>
            ) : (
              <ul className="space-y-1">
                {recent.map((meal) => (
                  <li key={meal.id} className="flex items-center gap-3 rounded-xl px-2 py-2 odd:bg-black/[0.02]">
                    <span aria-hidden className="text-base">
                      {getFood(meal.foodIds[0])?.emoji ?? "🍽️"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{meal.name}</span>
                    <span className="shrink-0 text-xs text-ink-faint">{relativeTime(meal.loggedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Disclaimer className="mt-5" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
