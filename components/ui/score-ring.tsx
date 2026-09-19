import { BAND_STYLE, bandOf } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Circular compatibility gauge. Deliberately labelled "match" rather than
 * anything that sounds like a clinical result.
 */
export function ScoreRing({
  score,
  size = 88,
  strokeWidth = 8,
  showLabel = true,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const band = bandOf(score);
  const style = BAND_STYLE[band];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Compatibility estimate ${score} out of 100 — ${style.label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-black/[0.07]"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={style.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className={cn("font-display font-semibold tabular-nums", style.text)}
          style={{ fontSize: size * 0.3 }}
        >
          {score}
        </span>
        {showLabel && size >= 72 && (
          <span className="mt-0.5 text-[0.6rem] font-medium uppercase tracking-wider text-ink-faint">
            match
          </span>
        )}
      </div>
    </div>
  );
}

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const style = BAND_STYLE[bandOf(score)];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        style.bg,
        style.text,
        style.ring,
        className,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {score} · {style.short}
    </span>
  );
}
