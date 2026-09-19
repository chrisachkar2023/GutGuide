import type { Nutrition } from "@/lib/types";

const ROWS: { key: keyof Nutrition; label: string; unit: string }[] = [
  { key: "calories", label: "Calories", unit: "" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
  { key: "sodium", label: "Sodium", unit: "mg" },
];

export function NutritionPanel({ nutrition, servingSize }: { nutrition: Nutrition; servingSize: string }) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
        Per {servingSize}
      </p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3">
        {ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-baseline justify-between border-b border-black/5 py-2.5 last:border-b-0"
          >
            <dt className="text-sm text-ink-soft">{row.label}</dt>
            <dd className="font-medium tabular-nums text-ink">
              {nutrition[row.key]}
              {row.unit}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-ink-faint">
        Approximate values for a typical preparation. Restaurant versions vary a lot.
      </p>
    </div>
  );
}
