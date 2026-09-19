"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  CircleAlert,
  ImagePlus,
  Loader2,
  NotebookPen,
  ScanLine,
  Sparkles,
  Type as TypeIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Chip, TraitChip } from "@/components/ui/chip";
import { Disclaimer, EmptyState } from "@/components/ui/misc";
import { ScoreRing } from "@/components/ui/score-ring";
import type { MenuScanItem, MenuScanResult } from "@/lib/types";
import { BAND_STYLE } from "@/lib/ui";
import { cn } from "@/lib/utils";

const MAX_EDGE = 1600;

/** Downscales before upload so a phone photo does not become a 10MB request. */
async function fileToBase64(file: File): Promise<{ data: string; mimeType: string; preview: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not open that image."));
    img.src = dataUrl;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  if (scale === 1 && file.size < 2_500_000) {
    return { data: dataUrl.split(",")[1] ?? "", mimeType: file.type || "image/jpeg", preview: dataUrl };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    return { data: dataUrl.split(",")[1] ?? "", mimeType: file.type || "image/jpeg", preview: dataUrl };
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const resized = canvas.toDataURL("image/jpeg", 0.82);
  return { data: resized.split(",")[1] ?? "", mimeType: "image/jpeg", preview: resized };
}

export function ScanClient({ sampleMenu, geminiEnabled }: { sampleMenu: string; geminiEnabled: boolean }) {
  const [mode, setMode] = useState<"photo" | "text">(geminiEnabled ? "photo" : "text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [result, setResult] = useState<MenuScanResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setImage(await fileToBase64(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that image.");
    }
  }

  async function submit() {
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "photo" && image
            ? { imageBase64: image.data, mimeType: image.mimeType }
            : { text },
        ),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The scan did not complete.");
      setResult(payload as MenuScanResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  const canSubmit = mode === "photo" ? Boolean(image) : text.trim().length > 12;

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div role="group" aria-label="How to scan" className="inline-flex rounded-full bg-cream-100 p-1">
            {(
              [
                ["photo", "Photo of a menu", ImagePlus],
                ["text", "Paste the text", TypeIcon],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  mode === value ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {mode === "photo" ? (
            <div>
              {!geminiEnabled && (
                <p className="mb-3 flex items-start gap-2 rounded-xl bg-[#fdf4e2] px-3.5 py-2.5 text-sm text-[#8a6412]">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Photo scanning needs a Gemini API key. Without one, paste the menu text and GutGuide will
                  parse it on-device.
                </p>
              )}
              {image ? (
                <div className="relative overflow-hidden rounded-2xl ring-1 ring-inset ring-black/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.preview} alt="Menu you uploaded" className="max-h-80 w-full object-contain bg-cream-100" />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur hover:bg-white"
                  >
                    <X className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Remove image</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 bg-cream-100/50 px-6 py-12 text-center transition-colors hover:border-moss-300 hover:bg-moss-50/50"
                >
                  <ImagePlus className="h-7 w-7 text-ink-faint" aria-hidden />
                  <span className="font-medium text-ink">Upload or take a photo of the menu</span>
                  <span className="text-sm text-ink-faint">JPG or PNG, whatever your camera gives you</span>
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="menu-text" className="sr-only">
                Menu text
              </label>
              <textarea
                id="menu-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                placeholder="Paste the menu here — one dish per line works best."
                className="w-full resize-y rounded-2xl bg-cream-100 px-4 py-3.5 text-[0.95rem] leading-relaxed outline-none ring-1 ring-inset ring-black/5 placeholder:text-ink-faint focus:ring-2 focus:ring-moss-400"
              />
              <button
                type="button"
                onClick={() => setText(sampleMenu)}
                className="mt-2 text-sm font-medium text-moss-700 hover:underline"
              >
                Use a sample menu
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-clay-50 px-3.5 py-2.5 text-sm text-clay-600">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <Button onClick={submit} disabled={!canSubmit || pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ScanLine className="h-4 w-4" aria-hidden />
            )}
            {pending ? "Reading the menu…" : "Scan this menu"}
          </Button>
        </CardBody>
      </Card>

      {pending && <ScanSkeleton />}

      {result && !pending && (
        <section aria-live="polite">
          {result.items.length === 0 ? (
            <EmptyState
              title="No dishes found"
              description={result.note}
              icon={<ScanLine className="h-7 w-7" aria-hidden />}
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-ink">
                    {result.restaurantName ?? "What looks workable"}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {result.items.length} dishes, ranked against your history.
                  </p>
                </div>
                <Chip className="bg-moss-50 text-moss-700 ring-moss-200">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {result.source === "gemini" ? "Read by Gemini" : "Parsed on-device"}
                </Chip>
              </div>

              <ul className="space-y-3">
                {result.items.map((item, i) => (
                  <li key={`${item.name}-${i}`}>
                    <MenuItemCard item={item} defaultOpen={i === 0} />
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs leading-relaxed text-ink-faint">{result.note}</p>
              <Disclaimer className="mt-3" />
            </>
          )}
        </section>
      )}
    </div>
  );
}

function MenuItemCard({ item, defaultOpen }: { item: MenuScanItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const style = BAND_STYLE[item.compatibility.band];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <ScoreRing score={item.compatibility.score} size={60} strokeWidth={6} showLabel={false} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{item.name}</h3>
            <span className={cn("text-xs font-medium", style.text)}>{style.label}</span>
          </div>
          {item.description && (
            <p className="mt-1 text-sm leading-snug text-ink-soft">{item.description}</p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.traits.slice(0, 4).map((t) => (
              <TraitChip key={t} id={t} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-moss-700 hover:underline"
          >
            Why this suggestion
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        </div>
      </div>

      {open && (
        <CardBody className="border-t border-black/5 bg-cream-50/60 pt-4">
          <p className="text-sm leading-relaxed text-ink-soft">{item.compatibility.headline}</p>

          <ul className="mt-3 space-y-2">
            {item.compatibility.factors.slice(0, 4).map((factor, i) => (
              <li key={`${factor.label}-${i}`} className="flex items-start gap-2 text-sm">
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    factor.impact >= 0 ? "bg-moss-400" : "bg-clay-400",
                  )}
                />
                <span className="text-ink-soft">
                  <span className="font-medium text-ink">{factor.label}</span> — {factor.detail}
                </span>
              </li>
            ))}
          </ul>

          {item.guessedIngredients.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                Likely ingredients
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.guessedIngredients.map((ingredient) => (
                  <Chip key={ingredient}>{ingredient}</Chip>
                ))}
              </div>
            </div>
          )}

          {item.compatibility.tips.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {item.compatibility.tips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm text-ink-soft">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-moss-400" />
                  {tip}
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/log?name=${encodeURIComponent(item.name)}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-moss-700 hover:underline"
          >
            <NotebookPen className="h-4 w-4" aria-hidden />
            Log this if you order it
          </Link>
        </CardBody>
      )}
    </Card>
  );
}

function ScanSkeleton() {
  return (
    <ul className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <Card>
            <CardBody className="flex items-start gap-4">
              <div className="h-[60px] w-[60px] shrink-0 animate-pulse rounded-full bg-black/[0.06]" />
              <div className="flex-1 space-y-2.5 py-1">
                <div className="h-4 w-1/3 animate-pulse rounded bg-black/[0.06]" />
                <div className="h-3 w-full animate-pulse rounded bg-black/[0.05]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-black/[0.05]" />
              </div>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}
