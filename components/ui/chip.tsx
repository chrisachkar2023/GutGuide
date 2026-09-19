import type { ComponentProps } from "react";
import { TRAITS } from "@/lib/data/traits";
import type { TraitId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Chip({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        "bg-cream-100 text-ink-soft ring-black/5",
        className,
      )}
      {...props}
    />
  );
}

export function TraitChip({ id, className }: { id: TraitId; className?: string }) {
  const meta = TRAITS[id];
  if (!meta) return null;
  const watch = meta.tone === "watch";
  return (
    <Chip
      title={meta.blurb}
      className={cn(
        watch ? "bg-clay-50 text-clay-600 ring-clay-200" : "bg-moss-50 text-moss-700 ring-moss-200",
        className,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", watch ? "bg-clay-400" : "bg-moss-400")} />
      {meta.label}
    </Chip>
  );
}
