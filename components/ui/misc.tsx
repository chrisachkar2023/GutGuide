import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  action,
  description,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0 pb-1">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-xl2)] border border-dashed border-black/10 bg-white/50 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="mb-3 text-ink-faint">{icon}</div>}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-lg bg-black/[0.06]", className)} {...props} />;
}

export function Disclaimer({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <p className={cn("text-xs leading-relaxed text-ink-faint", className)}>
      {children ?? (
        <>
          GutGuide estimates how a food tends to line up with <em>your</em> logged history. It is not
          medical advice and cannot predict a flare. Talk to your care team about any real change to
          how you eat.
        </>
      )}
    </p>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "good" | "watch";
}) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-inset ring-black/5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-display text-2xl font-semibold tabular-nums",
          tone === "good" && "text-moss-600",
          tone === "watch" && "text-clay-500",
          tone === "neutral" && "text-ink",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function AiBadge({ source }: { source: "gemini" | "local" }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[0.68rem] font-medium text-ink-faint ring-1 ring-inset ring-black/5"
      title={
        source === "gemini"
          ? "Written by Gemini from your logged history"
          : "Generated locally from your logged history — add a GEMINI_API_KEY for richer phrasing"
      }
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-moss-400" />
      {source === "gemini" ? "Gemini" : "On-device summary"}
    </span>
  );
}
