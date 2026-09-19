import { Sparkles } from "lucide-react";
import { explainCompatibility } from "@/lib/ai/explain";
import { AiBadge, Skeleton } from "@/components/ui/misc";
import type { Compatibility, Food, FoodHistory, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  history: "Your history",
  pattern: "Your pattern",
  trait: "Food characteristic",
  profile: "Your profile",
};

/** Signed contribution bars — the "why" behind the number. */
export function ScoreBreakdown({ compat }: { compat: Compatibility }) {
  const max = Math.max(...compat.factors.map((f) => Math.abs(f.impact)), 1);

  return (
    <ul className="space-y-3">
      {compat.factors.map((factor, i) => {
        const positive = factor.impact >= 0;
        const width = `${Math.max(6, (Math.abs(factor.impact) / max) * 100)}%`;
        return (
          <li key={`${factor.label}-${i}`}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-ink">{factor.label}</p>
              <span
                className={cn(
                  "shrink-0 text-xs font-semibold tabular-nums",
                  positive ? "text-moss-600" : "text-clay-500",
                )}
              >
                {positive ? "+" : ""}
                {factor.impact}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className={cn("h-full rounded-full", positive ? "bg-moss-400" : "bg-clay-400")}
                style={{ width }}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              <span className="font-medium text-ink-faint">{KIND_LABEL[factor.kind]}</span> · {factor.detail}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function ExplanationSkeleton() {
  return (
    <div className="rounded-2xl bg-moss-50/70 p-4">
      <Skeleton className="h-3 w-32 bg-moss-200/50" />
      <Skeleton className="mt-3 h-3.5 w-full bg-moss-200/50" />
      <Skeleton className="mt-2 h-3.5 w-10/12 bg-moss-200/50" />
    </div>
  );
}

/** Streamed separately so the page paints before the model responds. */
export async function ScoreExplanation({
  food,
  compat,
  profile,
  history,
}: {
  food: Food;
  compat: Compatibility;
  profile: UserProfile;
  history?: FoodHistory;
}) {
  const explanation = await explainCompatibility(food, compat, profile, history);
  return (
    <div className="rounded-2xl bg-moss-50/70 p-4 ring-1 ring-inset ring-moss-100">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-moss-600" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide text-moss-700">
          Why this score
        </span>
        <span className="ml-auto">
          <AiBadge source={explanation.source} />
        </span>
      </div>
      <p className="text-[0.95rem] leading-relaxed text-ink-soft">{explanation.text}</p>
    </div>
  );
}
