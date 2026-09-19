"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Loader2, MapPin, NotebookPen, Star, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/misc";
import { ScoreBadge, ScoreRing } from "@/components/ui/score-ring";
import type { ScoreBand } from "@/lib/types";
import { BAND_STYLE } from "@/lib/ui";
import { cn } from "@/lib/utils";

export type DishPick = {
  name: string;
  description: string;
  score: number;
  band: ScoreBand;
  why: string;
  foodSlugs: string[];
};

export type NearbyPlace = {
  id: string;
  name: string;
  cuisine: string;
  neighborhood: string;
  lat: number;
  lng: number;
  distanceMi: number;
  priceLevel: number;
  rating: number;
  heroEmoji: string;
  blurb: string;
  fit: number;
  gentleCount: number;
  picks: DishPick[];
  headsUp?: DishPick;
};

type Sort = "fit" | "distance";

function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export function NearClient({
  places,
  defaultCenterLabel,
  highlightFood,
}: {
  places: NearbyPlace[];
  defaultCenterLabel: string;
  highlightFood?: string;
}) {
  const [cuisine, setCuisine] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("fit");
  const [gentleOnly, setGentleOnly] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const cuisines = useMemo(
    () => ["all", ...[...new Set(places.map((p) => p.cuisine))].sort()],
    [places],
  );

  const visible = useMemo(() => {
    const withDistance = places.map((place) => ({
      ...place,
      distanceMi: coords ? milesBetween(coords, place) : place.distanceMi,
    }));

    return withDistance
      .filter((p) => (cuisine === "all" ? true : p.cuisine === cuisine))
      .filter((p) => (gentleOnly ? p.gentleCount > 0 : true))
      .sort((a, b) => (sort === "fit" ? b.fit - a.fit : a.distanceMi - b.distanceMi));
  }, [places, cuisine, gentleOnly, sort, coords]);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("This browser cannot share a location.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("Location was not shared, so distances stay relative to the demo area.");
        setLocating(false);
      },
      { timeout: 8000, maximumAge: 300_000 },
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
              <MapPin className="h-4 w-4 text-moss-600" aria-hidden />
              {coords ? "Distances from where you are now" : `Distances from ${defaultCenterLabel}`}
            </span>
            {!coords && (
              <Button size="sm" variant="secondary" onClick={requestLocation} disabled={locating}>
                {locating && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                Use my location
              </Button>
            )}
          </div>
          {locationError && <p className="text-sm text-ink-faint">{locationError}</p>}

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {cuisines.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCuisine(c)}
                aria-pressed={cuisine === c}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  cuisine === c ? "bg-moss-600 text-white" : "bg-cream-100 text-ink-soft hover:bg-cream-200",
                )}
              >
                {c === "all" ? "All cuisines" : c}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-black/5 pt-3">
            <span className="text-xs font-medium text-ink-faint">Sort</span>
            {(
              [
                ["fit", "Best fit for you"],
                ["distance", "Closest"],
              ] as [Sort, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSort(value)}
                aria-pressed={sort === value}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  sort === value ? "bg-moss-600/10 text-moss-700" : "text-ink-soft hover:bg-black/5",
                )}
              >
                {label}
              </button>
            ))}
            <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft">
              <input
                type="checkbox"
                checked={gentleOnly}
                onChange={(e) => setGentleOnly(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 accent-moss-600"
              />
              Only places with a gentle option
            </label>
          </div>
        </CardBody>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing matches those filters"
          description="Try widening the cuisine filter or turning off the gentle-options-only toggle."
        />
      ) : (
        <ul className="space-y-4" aria-live="polite">
          {visible.map((place) => (
            <li key={place.id}>
              <PlaceCard place={place} highlightFood={highlightFood} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlaceCard({ place, highlightFood }: { place: NearbyPlace; highlightFood?: string }) {
  const [open, setOpen] = useState(false);
  const style = BAND_STYLE[place.picks[0]?.band ?? "usually-ok"];
  const matchesHighlight =
    highlightFood && place.picks.some((p) => p.foodSlugs.includes(highlightFood));

  return (
    <Card className={cn("overflow-hidden", matchesHighlight && "ring-2 ring-moss-300")}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <span
          aria-hidden
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cream-100 text-2xl"
        >
          {place.heroEmoji}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h3 className="font-display text-xl font-semibold text-ink">{place.name}</h3>
            <span className="text-sm text-ink-faint">
              {place.cuisine} · {place.neighborhood}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
              {place.distanceMi} mi
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-[color:var(--color-amber-soft)] text-[color:var(--color-amber-soft)]" aria-hidden />
              {place.rating}
            </span>
            <span>{"$".repeat(place.priceLevel)}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{place.blurb}</p>
          {matchesHighlight && (
            <Chip className="mt-2 bg-moss-50 text-moss-700 ring-moss-200">Serves what you searched for</Chip>
          )}
        </div>

        <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
          <ScoreRing score={place.fit} size={64} strokeWidth={6} showLabel={false} />
          <p className={cn("text-xs font-medium sm:text-right", style.text)}>
            {place.gentleCount > 0
              ? `${place.gentleCount} gentle ${place.gentleCount === 1 ? "option" : "options"}`
              : "Ask for changes"}
          </p>
        </div>
      </div>

      <div className="border-t border-black/5 bg-cream-50/60 px-5 py-4">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          What to order here
        </p>
        <ul className="space-y-2.5">
          {place.picks.slice(0, open ? place.picks.length : 2).map((pick) => (
            <li key={pick.name} className="flex items-start gap-3">
              <ScoreBadge score={pick.score} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{pick.name}</p>
                <p className="text-xs leading-relaxed text-ink-soft">{pick.why}</p>
              </div>
            </li>
          ))}
        </ul>

        {place.picks.length > 2 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-moss-700 hover:underline"
          >
            {open ? "Show fewer" : `Show all ${place.picks.length} dishes`}
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        )}

        {place.headsUp && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-clay-50 px-3 py-2.5 text-xs leading-relaxed text-clay-600">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold">{place.headsUp.name}</strong> is the one to think twice
              about — {place.headsUp.why.toLowerCase()}
            </span>
          </p>
        )}

        <Link
          href={`/log?name=${encodeURIComponent(place.picks[0]?.name ?? place.name)}&foods=${place.picks[0]?.foodSlugs.join(",") ?? ""}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-moss-700 hover:underline"
        >
          <NotebookPen className="h-4 w-4" aria-hidden />
          Log it if you go
        </Link>
      </div>
    </Card>
  );
}
