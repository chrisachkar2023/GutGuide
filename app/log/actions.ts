"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFoods } from "@/lib/data/foods";
import { addMeal, addSymptom } from "@/lib/data/repository";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const mealSchema = z.object({
  name: z.string().trim().max(120).optional(),
  foodIds: z.array(z.string()).min(1, "Pick at least one food."),
  portion: z.enum(["small", "regular", "large"]),
  notes: z.string().trim().max(500).optional(),
  loggedAt: z.string().optional(),
  source: z.enum(["manual", "recipe", "menu-scan"]).optional(),
});

const symptomSchema = z.object({
  pain: z.number().min(0).max(10),
  bloating: z.number().min(0).max(10),
  energy: z.number().min(0).max(10),
  urgency: z.number().min(0).max(10),
  notes: z.string().trim().max(500).optional(),
});

function refreshViews() {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/progress");
  revalidatePath("/near-you");
  revalidatePath("/cook");
}

export async function logMealAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = mealSchema.safeParse({
    name: (formData.get("name") as string) || undefined,
    foodIds: formData.getAll("foodIds").map(String),
    portion: (formData.get("portion") as string) || "regular",
    notes: (formData.get("notes") as string) || undefined,
    loggedAt: (formData.get("loggedAt") as string) || undefined,
    source: (formData.get("source") as string) || "manual",
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Something was missing." };
  }

  const foods = getFoods(parsed.data.foodIds);
  if (foods.length === 0) {
    return { status: "error", message: "Those foods were not recognised." };
  }

  const fallbackName =
    foods.length === 1
      ? foods[0].name
      : `${foods.slice(0, -1).map((f) => f.name).join(", ")} + ${foods[foods.length - 1].name}`;

  await addMeal({
    name: parsed.data.name?.trim() || fallbackName,
    foodIds: foods.map((f) => f.id),
    portion: parsed.data.portion,
    notes: parsed.data.notes,
    source: parsed.data.source ?? "manual",
    loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt).toISOString() : undefined,
  });

  refreshViews();
  return { status: "success", message: "Meal logged. Your scores just updated." };
}

export async function logSymptomAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const num = (key: string) => Number(formData.get(key) ?? 0);
  const parsed = symptomSchema.safeParse({
    pain: num("pain"),
    bloating: num("bloating"),
    energy: num("energy"),
    urgency: num("urgency"),
    notes: (formData.get("notes") as string) || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "Those values did not look right." };
  }

  await addSymptom(parsed.data);
  refreshViews();
  return { status: "success", message: "Check-in saved. Thanks for keeping it up." };
}
