import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ScoreBadge, ScoreRing } from "@/components/ui/score-ring";
import { TraitChip } from "@/components/ui/chip";
import type { Compatibility, Food } from "@/lib/types";
import { BAND_STYLE } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function FoodCard({
  food,
  compat,
  className,
}: {
  food: Food;
  compat: Compatibility;
  className?: string;
}) {
  const style = BAND_STYLE[compat.band];
  return (
    <Link
      href={`/search/${food.slug}`}
      className={cn(
        "surface group flex flex-col gap-3 rounded-[var(--radius-xl2)] p-4 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(29,26,23,0.05),0_18px_36px_-22px_rgba(29,26,23,0.4)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream-100 text-xl">
          {food.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{food.name}</p>
          <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-ink-soft">{food.summary}</p>
        </div>
        <ScoreRing score={compat.score} size={52} strokeWidth={5} showLabel={false} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("text-xs font-medium", style.text)}>{style.label}</span>
        {food.traits.slice(0, 2).map((t) => (
          <TraitChip key={t} id={t} />
        ))}
      </div>
    </Link>
  );
}

export function FoodRow({ food, compat }: { food: Food; compat: Compatibility }) {
  return (
    <Link
      href={`/search/${food.slug}`}
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-black/[0.035]"
    >
      <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream-100 text-lg">
        {food.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{food.name}</p>
        <p className="truncate text-xs text-ink-soft">{food.summary}</p>
      </div>
      <ScoreBadge score={compat.score} />
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
    </Link>
  );
}
