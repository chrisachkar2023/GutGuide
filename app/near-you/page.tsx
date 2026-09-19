import type { Metadata } from "next";
import { NearClient, type DishPick, type NearbyPlace } from "@/components/near/near-client";
import { Disclaimer } from "@/components/ui/misc";
import { getFoods } from "@/lib/data/foods";
import { DEFAULT_CENTER, RESTAURANTS } from "@/lib/data/restaurants";
import { scoreCombination } from "@/lib/scoring/compatibility";
import { getUserContext } from "@/lib/scoring/context";
import type { Compatibility } from "@/lib/types";

export const metadata: Metadata = {
  title: "Food near you",
  description: "Nearby restaurants ranked by what actually tends to work for you.",
};

export const dynamic = "force-dynamic";

/** One short sentence naming the single biggest reason for a dish's score. */
function whyFor(compat: Compatibility): string {
  const driver = compat.factors[0];
  if (!driver) return compat.headline;
  if (driver.kind === "history") return `${driver.label}. ${driver.detail}`;
  return `${driver.impact >= 0 ? "Helps" : "Watch"}: ${driver.label.toLowerCase()} — ${driver.detail.replace(/\.$/, "")}.`;
}

export default async function NearYouPage({
  searchParams,
}: {
  searchParams: Promise<{ food?: string }>;
}) {
  const { food: highlightFood } = await searchParams;
  const ctx = await getUserContext();

  const places: NearbyPlace[] = RESTAURANTS.map((restaurant) => {
    const scored: DishPick[] = restaurant.menu
      .map((dish) => {
        const compat = scoreCombination(getFoods(dish.foodIds), ctx);
        return {
          name: dish.name,
          description: dish.description,
          score: compat.score,
          band: compat.band,
          why: whyFor(compat),
          foodSlugs: dish.foodIds,
        };
      })
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const worst = scored[scored.length - 1];
    const gentleCount = scored.filter((d) => d.band === "gentle" || d.band === "usually-ok").length;

    // A place is only as good as its best realistic order, with a nudge for choice.
    const fit = Math.round(Math.min(96, (best?.score ?? 50) * 0.85 + gentleCount * 4));

    return {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      neighborhood: restaurant.neighborhood,
      lat: restaurant.lat,
      lng: restaurant.lng,
      distanceMi: restaurant.distanceMi,
      priceLevel: restaurant.priceLevel,
      rating: restaurant.rating,
      heroEmoji: restaurant.heroEmoji,
      blurb: restaurant.blurb,
      fit,
      gentleCount,
      picks: scored,
      headsUp: worst && worst.score < 45 ? worst : undefined,
    };
  }).sort((a, b) => b.fit - a.fit);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Food near you</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Not “which restaurant is healthy” — which dish on which menu lines up with what has been working
          for {ctx.profile.name}. Every score below is recalculated from the log.
        </p>
      </header>

      <NearClient
        places={places}
        defaultCenterLabel={DEFAULT_CENTER.label}
        highlightFood={highlightFood}
      />

      <Disclaimer className="px-1" />
    </div>
  );
}
