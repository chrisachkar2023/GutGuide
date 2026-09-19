"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-moss-600 text-white hover:bg-moss-700 active:bg-moss-800 shadow-sm shadow-moss-900/20 disabled:bg-moss-300",
  secondary:
    "bg-white text-ink ring-1 ring-inset ring-black/10 hover:bg-cream-100 active:bg-cream-200",
  ghost: "text-ink-soft hover:bg-black/5 active:bg-black/10",
  danger: "bg-clay-500 text-white hover:bg-clay-600",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.95rem] gap-2",
  lg: "h-13 px-6 text-base gap-2.5",
};

const BASE =
  "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] whitespace-nowrap";

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
