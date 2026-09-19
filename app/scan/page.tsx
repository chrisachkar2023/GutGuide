import type { Metadata } from "next";
import { ScanClient } from "@/components/scan/scan-client";
import { Card, CardBody } from "@/components/ui/card";
import { SAMPLE_MENU } from "@/lib/data/sample-menu";
import { isGeminiEnabled } from "@/lib/ai/gemini";
import { getUserContext } from "@/lib/scoring/context";

export const metadata: Metadata = {
  title: "Menu scanner",
  description: "Scan or paste a restaurant menu and see which dishes fit your history.",
};

export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Read the menu", detail: "Photo or pasted text — every dish gets pulled out." },
  { title: "Fill in the gaps", detail: "Menus hide the butter, cream and onion. We infer them." },
  { title: "Rank against you", detail: "Your logged history decides the order, not a generic list." },
];

export default async function ScanPage() {
  const ctx = await getUserContext();

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Menu scanner</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Standing outside a restaurant deciding whether you can eat there is exhausting. Point this at the
          menu and it will tell you what tends to work for <strong className="font-semibold text-ink">you</strong>,
          and why.
        </p>
      </header>

      <Card className="bg-cream-100/60">
        <CardBody className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-3">
              <span
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-moss-600 text-sm font-semibold text-white"
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{step.detail}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <ScanClient sampleMenu={SAMPLE_MENU} geminiEnabled={isGeminiEnabled()} />

      <p className="text-xs text-ink-faint">
        Scanning as {ctx.profile.name} · {ctx.insight.scoredMeals} logged meals inform these rankings.
      </p>
    </div>
  );
}
