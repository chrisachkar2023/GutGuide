"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ScoreRing } from "@/components/ui/score-ring";
import { TraitChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/misc";
import type { FoodCategory, ScoreBand, TraitId } from "@/lib/types";
import { BAND_STYLE } from "@/lib/ui";
import { cn } from "@/lib/utils";

export type SearchItem = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  summary: string;
  traits: TraitId[];
  keywords: string;
  score: number;
  band: ScoreBand;
  loggedTimes: number;
};

const CATEGORIES: { id: FoodCategory | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "meals", label: "Meals" },
  { id: "protein", label: "Protein" },
  { id: "grains", label: "Grains" },
  { id: "vegetables", label: "Vegetables" },
  { id: "fruit", label: "Fruit" },
  { id: "dairy", label: "Dairy" },
  { id: "drinks", label: "Drinks" },
  { id: "snacks", label: "Snacks" },
  { id: "condiments", label: "Condiments" },
];

type Sort = "match" | "name" | "logged";

export function SearchClient({ items, initialQuery = "" }: { items: SearchItem[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [sort, setSort] = useState<Sort>("match");
  const [onlyLogged, setOnlyLogged] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    const filtered = items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (onlyLogged && item.loggedTimes === 0) return false;
      if (terms.length === 0) return true;
      return terms.every((term) => {
        const safeTerm = term.toLowerCase();
        if (item.name.toLowerCase().includes(safeTerm)) return true;
        if (item.summary.toLowerCase().includes(safeTerm)) return true;
        return item.keywords.split(/\s+/).includes(safeTerm) || item.keywords.includes(safeTerm);
      });
    });

    // With a query, relevance wins unless the user picked an explicit sort.
    if (terms.length > 0 && sort === "match") {
      return [...filtered].sort((a, b) => rank(b, terms) - rank(a, terms));
    }

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "logged") return b.loggedTimes - a.loggedTimes || b.score - a.score;
      return b.score - a.score;
    });
  }, [items, deferredQuery, category, sort, onlyLogged]);

  return (
    <div>
      <div className="surface sticky top-16 z-30 rounded-[var(--radius-xl2)] p-3 sm:p-4">
        <label className="relative block">
          <span className="sr-only">Search foods and meals</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a food or meal — try “rice”, “pizza”, “yogurt”"
            className="h-12 w-full rounded-full bg-cream-100 pl-12 pr-11 text-[0.95rem] text-ink outline-none ring-1 ring-inset ring-black/5 placeholder:text-ink-faint focus:ring-2 focus:ring-moss-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-faint hover:bg-black/5"
            >
              <X className="h-4 w-4" aria-hidden />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </label>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              aria-pressed={category === c.id}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                category === c.id ? "bg-moss-600 text-white" : "bg-cream-100 text-ink-soft hover:bg-cream-200",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-black/5 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Sort
          </span>
          {(
            [
              ["match", "Best match for you"],
              ["logged", "Most logged"],
              ["name", "A–Z"],
            ] as [Sort, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              aria-pressed={sort === value}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                sort === value ? "bg-moss-600/10 text-moss-700" : "text-ink-soft hover:bg-black/5",
              )}
            >
              {label}
            </button>
          ))}
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft">
            <input
              type="checkbox"
              checked={onlyLogged}
              onChange={(e) => setOnlyLogged(e.target.checked)}
              className="h-4 w-4 rounded border-black/20 accent-moss-600"
            />
            Only foods I have logged
          </label>
        </div>
      </div>

      <p className="mt-4 px-1 text-sm text-ink-faint" aria-live="polite">
        {results.length} {results.length === 1 ? "food" : "foods"}
        {deferredQuery.trim() && ` matching “${deferredQuery.trim()}”`}
      </p>

      {results.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No match in the food library yet"
          description="Try a simpler word, or log it as a custom meal and GutGuide will start tracking it for you."
        />
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => (
            <li key={item.id}>
              <ResultCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultCard({ item }: { item: SearchItem }) {
  const style = BAND_STYLE[item.band];
  return (
    <Link
      href={`/search/${item.slug}`}
      className="surface group flex h-full items-start gap-3 rounded-[var(--radius-xl2)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(29,26,23,0.05),0_18px_36px_-22px_rgba(29,26,23,0.4)]"
    >
      <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream-100 text-xl">
        {item.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight text-ink">{item.name}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-soft">{item.summary}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("text-xs font-medium", style.text)}>{style.label}</span>
          {item.loggedTimes > 0 && <span className="text-xs text-ink-faint">· logged {item.loggedTimes}×</span>}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.traits.slice(0, 2).map((t) => (
            <TraitChip key={t} id={t} />
          ))}
        </div>
      </div>
      <ScoreRing score={item.score} size={52} strokeWidth={5} showLabel={false} />
    </Link>
  );
}

function rank(item: SearchItem, terms: string[]): number {
  const name = item.name.toLowerCase();
  let score = item.score / 100;
  for (const term of terms) {
    if (name === term) score += 10;
    else if (name.startsWith(term)) score += 6;
    else if (name.includes(term)) score += 3;
    else if (item.keywords.includes(term)) score += 1;
  }
  if (item.loggedTimes > 0) score += 0.5;
  return score;
}
