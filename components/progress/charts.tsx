"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayPoint } from "@/lib/insights";
import { cn } from "@/lib/utils";

const SERIES = [
  { key: "pain", label: "Pain", color: "var(--color-clay-400)", better: "lower" },
  { key: "bloating", label: "Bloating", color: "var(--color-amber-soft)", better: "lower" },
  { key: "energy", label: "Energy", color: "var(--color-moss-500)", better: "higher" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

type TooltipEntry = { name?: string; value?: number | string; color?: string };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-black/5 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-ink-faint">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-sm text-ink">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}
          <span className="ml-auto font-semibold tabular-nums">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Pain / bloating / energy over time, with series toggles. */
export function SymptomTrendChart({ data }: { data: DayPoint[] }) {
  const [hidden, setHidden] = useState<SeriesKey[]>([]);

  const ticks = useMemo(() => {
    if (data.length <= 8) return data.map((d) => d.label);
    const step = Math.ceil(data.length / 6);
    return data.filter((_, i) => i % step === 0).map((d) => d.label);
  }, [data]);

  const toggle = (key: SeriesKey) =>
    setHidden((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {SERIES.map((s) => {
          const off = hidden.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={!off}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors",
                off ? "bg-transparent text-ink-faint ring-black/10" : "bg-white text-ink ring-black/10",
              )}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full transition-opacity"
                style={{ background: s.color, opacity: off ? 0.3 : 1 }}
              />
              {s.label}
              <span className="text-ink-faint">{s.better === "lower" ? "↓ better" : "↑ better"}</span>
            </button>
          );
        })}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
            <CartesianGrid stroke="rgba(29,26,23,0.07)" vertical={false} />
            <XAxis
              dataKey="label"
              ticks={ticks}
              tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={8}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            {SERIES.filter((s) => !hidden.includes(s.key)).map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Compact trend used on the homepage. */
export function Sparkline({
  data,
  dataKey = "pain",
  color = "var(--color-clay-400)",
  height = 56,
}: {
  data: DayPoint[];
  dataKey?: SeriesKey;
  color?: string;
  height?: number;
}) {
  const gradientId = `spark-${dataKey}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[0, 10]} hide />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            connectNulls
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Meals logged per day. */
export function MealVolumeChart({ data }: { data: DayPoint[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -28 }}>
          <defs>
            <linearGradient id="meal-volume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-moss-400)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-moss-400)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(29,26,23,0.07)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="meals"
            name="Meals"
            stroke="var(--color-moss-500)"
            strokeWidth={2}
            fill="url(#meal-volume)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
