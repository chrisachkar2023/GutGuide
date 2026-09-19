"use client";

import { useState } from "react";
import { ChefHat } from "lucide-react";
import { GuidedCooking } from "@/components/cook/guided-cooking";
import { Button } from "@/components/ui/button";
import type { RecipeStep } from "@/lib/types";

/** Owns the cooking-mode toggle so the recipe page itself stays a server component. */
export function CookModeButton({ title, steps }: { title: string; steps: RecipeStep[] }) {
  const [cooking, setCooking] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setCooking(true)}>
        <ChefHat className="h-4 w-4" aria-hidden />
        Start guided cooking
      </Button>
      {cooking && <GuidedCooking title={title} steps={steps} onExit={() => setCooking(false)} />}
    </>
  );
}
