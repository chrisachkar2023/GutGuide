import type { Metadata } from "next";
import { SearchClient, type SearchItem } from "@/components/search/search-client";
import { Disclaimer } from "@/components/ui/misc";
import { FOODS } from "@/lib/data/foods";
import { TRAITS } from "@/lib/data/traits";
import { scoreFood } from "@/lib/scoring/compatibility";
import { getUserContext } from "@/lib/scoring/context";

export const metadata: Metadata = {
  title: "Search food",
  description: "Look up a food or meal and see how it tends to line up with your own history.",
};

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const ctx = await getUserContext();

  // Scores are computed once on the server so filtering and sorting stay instant.
  const items: SearchItem[] = FOODS.map((food) => {
    const compat = scoreFood(food, ctx);
    const history = ctx.insight.foodHistory.get(food.id);
    return {
      id: food.id,
      slug: food.slug,
      name: food.name,
      emoji: food.emoji,
      category: food.category,
      summary: food.summary,
      traits: food.traits,
      keywords: [
        food.name,
        food.category,
        food.summary,
        ...food.ingredients,
        ...(food.aliases ?? []),
        ...food.traits.map((t) => TRAITS[t]?.label ?? t),
      ]
        .join(" ")
        .toLowerCase(),
      score: compat.score,
      band: compat.band,
      loggedTimes: history?.timesLogged ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Search food</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Every score below is calculated against {ctx.profile.name}&rsquo;s logged history, current phase
          and stated preferences. The same food will score differently for someone else — that is the point.
        </p>
      </header>

      <SearchClient items={items} initialQuery={q ?? ""} />

      <Disclaimer className="px-1" />
    </div>
  );
}
