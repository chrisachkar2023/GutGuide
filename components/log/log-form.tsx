"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Loader2, Plus, Search, X } from "lucide-react";
import { logMealAction, logSymptomAction, type ActionState } from "@/app/log/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PickerFood = {
  id: string;
  name: string;
  emoji: string;
  keywords: string;
  score: number;
};

const INITIAL: ActionState = { status: "idle", message: "" };

export function LogForm({
  foods,
  preselected = [],
  defaultTab = "meal",
  presetName = "",
}: {
  foods: PickerFood[];
  preselected?: string[];
  defaultTab?: "meal" | "symptoms";
  presetName?: string;
}) {
  const [tab, setTab] = useState<"meal" | "symptoms">(defaultTab);

  return (
    <div>
      <div
        role="group"
        aria-label="What would you like to log?"
        className="mb-5 inline-flex rounded-full bg-cream-100 p-1"
      >
        {(
          [
            ["meal", "A meal"],
            ["symptoms", "How I feel"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-all",
              tab === value ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "meal" ? (
        <MealForm foods={foods} preselected={preselected} presetName={presetName} />
      ) : (
        <SymptomForm />
      )}
    </div>
  );
}

function StatusNote({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  const ok = state.status === "success";
  return (
    <p
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm",
        ok ? "bg-moss-50 text-moss-700" : "bg-clay-50 text-clay-600",
      )}
    >
      {ok ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />}
      {state.message}
    </p>
  );
}

function MealForm({
  foods,
  preselected,
  presetName,
}: {
  foods: PickerFood[];
  preselected: string[];
  presetName: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(preselected);
  const [query, setQuery] = useState("");
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await logMealAction(prev, formData);
      if (result.status === "success") {
        setSelected([]);
        setQuery("");
        router.refresh();
      }
      return result;
    },
    INITIAL,
  );

  const byId = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = foods.filter((f) => !selected.includes(f.id));
    if (!q) return pool.sort((a, b) => b.score - a.score).slice(0, 8);
    return pool
      .filter((f) => f.keywords.includes(q))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(q)) - Number(a.name.toLowerCase().startsWith(q)))
      .slice(0, 8);
  }, [foods, query, selected]);

  return (
    <form action={formAction} className="space-y-5">
      {selected.map((id) => (
        <input key={id} type="hidden" name="foodIds" value={id} />
      ))}

      <Card>
        <CardBody className="space-y-5">
          <div>
            <label htmlFor="meal-name" className="mb-1.5 block text-sm font-medium text-ink">
              What did you eat? <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <input
              id="meal-name"
              name="name"
              defaultValue={presetName}
              placeholder="Leave blank and we will name it from the foods"
              className="h-11 w-full rounded-xl bg-cream-100 px-4 text-[0.95rem] outline-none ring-1 ring-inset ring-black/5 placeholder:text-ink-faint focus:ring-2 focus:ring-moss-400"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Foods in this meal</p>
            {selected.length > 0 && (
              <ul className="mb-3 flex flex-wrap gap-2">
                {selected.map((id) => {
                  const food = byId.get(id);
                  if (!food) return null;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setSelected((prev) => prev.filter((x) => x !== id))}
                        className="inline-flex items-center gap-1.5 rounded-full bg-moss-600 py-1.5 pl-3 pr-2 text-sm font-medium text-white"
                      >
                        <span aria-hidden>{food.emoji}</span>
                        {food.name}
                        <X className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">Remove {food.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <label className="relative block">
              <span className="sr-only">Search foods to add</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Add a food…"
                className="h-11 w-full rounded-xl bg-cream-100 pl-10 pr-4 text-[0.95rem] outline-none ring-1 ring-inset ring-black/5 placeholder:text-ink-faint focus:ring-2 focus:ring-moss-400"
              />
            </label>

            <ul className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((food) => (
                <li key={food.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected((prev) => [...prev, food.id]);
                      setQuery("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-2.5 pr-3 text-sm text-ink-soft ring-1 ring-inset ring-black/10 transition-colors hover:bg-cream-100 hover:text-ink"
                  >
                    <Plus className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                    <span aria-hidden>{food.emoji}</span>
                    {food.name}
                  </button>
                </li>
              ))}
              {suggestions.length === 0 && (
                <li className="text-sm text-ink-faint">No food in the library matches that yet.</li>
              )}
            </ul>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink">Portion</legend>
            <div className="flex gap-2">
              {(
                [
                  ["small", "Small"],
                  ["regular", "Regular"],
                  ["large", "Large"],
                ] as const
              ).map(([value, label], i) => (
                <label
                  key={value}
                  className="flex-1 cursor-pointer rounded-xl bg-cream-100 px-3 py-2.5 text-center text-sm font-medium text-ink-soft ring-1 ring-inset ring-black/5 transition-colors has-[:checked]:bg-moss-600 has-[:checked]:text-white"
                >
                  <input
                    type="radio"
                    name="portion"
                    value={value}
                    defaultChecked={i === 1}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="meal-notes" className="mb-1.5 block text-sm font-medium text-ink">
              Notes <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <textarea
              id="meal-notes"
              name="notes"
              rows={2}
              placeholder="Ate it slowly, skipped the sauce…"
              className="w-full resize-none rounded-xl bg-cream-100 px-4 py-3 text-[0.95rem] outline-none ring-1 ring-inset ring-black/5 placeholder:text-ink-faint focus:ring-2 focus:ring-moss-400"
            />
          </div>

          <StatusNote state={state} />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending || selected.length === 0}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Log meal
            </Button>
            {selected.length === 0 && (
              <span className="text-sm text-ink-faint">Add at least one food.</span>
            )}
          </div>
        </CardBody>
      </Card>
    </form>
  );
}

const SLIDERS = [
  { name: "pain", label: "Pain", low: "None", high: "Severe", tone: "watch" },
  { name: "bloating", label: "Bloating", low: "Flat", high: "Very bloated", tone: "watch" },
  { name: "urgency", label: "Urgency", low: "Settled", high: "Constant", tone: "watch" },
  { name: "energy", label: "Energy", low: "Drained", high: "Great", tone: "good" },
] as const;

function SymptomForm() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>({
    pain: 2,
    bloating: 2,
    urgency: 2,
    energy: 7,
  });
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await logSymptomAction(prev, formData);
      if (result.status === "success") router.refresh();
      return result;
    },
    INITIAL,
  );

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-6">
          <p className="text-sm text-ink-soft">
            How are things right now? These check-ins are what let GutGuide connect meals to how you felt
            afterwards.
          </p>

          {SLIDERS.map((slider) => (
            <div key={slider.name}>
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor={slider.name} className="text-sm font-medium text-ink">
                  {slider.label}
                </label>
                <span
                  className={cn(
                    "font-display text-lg font-semibold tabular-nums",
                    slider.tone === "good" ? "text-moss-600" : "text-clay-500",
                  )}
                >
                  {values[slider.name]}
                  <span className="text-xs font-normal text-ink-faint">/10</span>
                </span>
              </div>
              <input
                id={slider.name}
                name={slider.name}
                type="range"
                min={0}
                max={10}
                step={1}
                value={values[slider.name]}
                onChange={(e) => setValues((prev) => ({ ...prev, [slider.name]: Number(e.target.value) }))}
                className={cn(
                  "h-2 w-full cursor-pointer appearance-none rounded-full bg-black/[0.08]",
                  slider.tone === "good" ? "accent-moss-600" : "accent-clay-400",
                )}
              />
              <div className="mt-1 flex justify-between text-xs text-ink-faint">
                <span>{slider.low}</span>
                <span>{slider.high}</span>
              </div>
            </div>
          ))}

          <div>
            <label htmlFor="symptom-notes" className="mb-1.5 block text-sm font-medium text-ink">
              Anything worth remembering? <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <textarea
              id="symptom-notes"
              name="notes"
              rows={2}
              placeholder="Slept badly, stressful day, skipped lunch…"
              className="w-full resize-none rounded-xl bg-cream-100 px-4 py-3 text-[0.95rem] outline-none ring-1 ring-inset ring-black/5 placeholder:text-ink-faint focus:ring-2 focus:ring-moss-400"
            />
          </div>

          <StatusNote state={state} />

          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Save check-in
          </Button>
        </CardBody>
      </Card>
    </form>
  );
}
