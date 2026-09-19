import { cn } from "@/lib/utils";

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="relative grid h-9 w-9 place-items-center rounded-xl bg-moss-600 text-white shadow-sm shadow-moss-900/25"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
          <path d="M8 3v5a4 4 0 0 0 8 0" />
          <path d="M16 21v-4.5a4.5 4.5 0 0 0-9 0V19" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {withWordmark && (
        <span className="font-display text-xl font-semibold tracking-tight text-ink">
          Gut<span className="text-moss-600">Guide</span>
        </span>
      )}
    </span>
  );
}
