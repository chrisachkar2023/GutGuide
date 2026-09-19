import type { ScoreBand } from "@/lib/types";

export type BandStyle = {
  label: string;
  short: string;
  text: string;
  bg: string;
  ring: string;
  stroke: string;
  dot: string;
};

export const BAND_STYLE: Record<ScoreBand, BandStyle> = {
  gentle: {
    label: "Usually gentle for you",
    short: "Gentle",
    text: "text-moss-700",
    bg: "bg-moss-50",
    ring: "ring-moss-200",
    stroke: "var(--color-moss-500)",
    dot: "bg-moss-500",
  },
  "usually-ok": {
    label: "Often works out",
    short: "Often fine",
    text: "text-moss-600",
    bg: "bg-moss-50/70",
    ring: "ring-moss-100",
    stroke: "var(--color-moss-400)",
    dot: "bg-moss-400",
  },
  "go-slow": {
    label: "Worth easing into",
    short: "Go slow",
    text: "text-[#8a6412]",
    bg: "bg-[#fdf4e2]",
    ring: "ring-[#f3dfb4]",
    stroke: "var(--color-amber-soft)",
    dot: "bg-[color:var(--color-amber-soft)]",
  },
  caution: {
    label: "Approach with care",
    short: "Care",
    text: "text-clay-600",
    bg: "bg-clay-50",
    ring: "ring-clay-200",
    stroke: "var(--color-clay-500)",
    dot: "bg-clay-500",
  },
};

export function bandOf(score: number): ScoreBand {
  if (score >= 78) return "gentle";
  if (score >= 60) return "usually-ok";
  if (score >= 40) return "go-slow";
  return "caution";
}
