import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { Card, CardBody } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/misc";

const POINTS = [
  "Learns from your own meals and check-ins, not a universal safe-foods list.",
  "Explains every estimate, so you can see what drove it.",
  "Reads restaurant menus and ranks the dishes against your history.",
];

/** Split layout shared by sign in and sign up. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-5xl items-center gap-10 py-8 lg:grid-cols-[1fr_26rem]">
      <div className="hidden lg:block">
        <Logo />
        <h2 className="mt-8 max-w-md font-display text-4xl font-semibold leading-tight text-ink">
          Crohn&rsquo;s is personal, so food guidance should be too.
        </h2>
        <ul className="mt-7 space-y-3.5">
          {POINTS.map((point) => (
            <li key={point} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-soft">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-moss-400" />
              {point}
            </li>
          ))}
        </ul>
        <Disclaimer className="mt-8 max-w-md" />
      </div>

      <div>
        <div className="mb-6 lg:hidden">
          <Logo />
        </div>
        <Card>
          <CardBody className="p-6 sm:p-7">
            <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function GuestDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-black/10" />
      <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">or</span>
      <span className="h-px flex-1 bg-black/10" />
    </div>
  );
}
