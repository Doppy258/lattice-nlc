import { motion, useReducedMotion } from "motion/react";
import type { SeriesPoint } from "@/models";
import { cn } from "@/lib/utils";

/**
 * In-house, dependency-free charts. Every fill is a SOLID colour (no gradients) —
 * depth comes from rounded geometry, spacing and the blue palette. All bars grow
 * in on mount, and collapse to their final state under reduced-motion.
 */

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--brand-violet)",
  "var(--success)",
  "var(--warning)",
  "var(--chart-3)",
  "var(--match-low)",
];

/** Vertical column chart for a small series (e.g. savings by month). */
export function BarColumns({
  data,
  format = (n) => String(n),
  color = "var(--primary)",
  height = 180,
  className,
}: {
  data: SeriesPoint[];
  format?: (n: number) => string;
  color?: string;
  height?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <EmptyChart />;
  return (
    <div className={cn("flex items-stretch gap-3", className)} style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={d.label + i} className="flex h-full min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end justify-center">
              <motion.div
                initial={reduced ? false : { height: 0 }}
                animate={{ height: `${Math.max(pct, 2)}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                className="relative w-full max-w-12 rounded-t-lg"
                style={{ background: color }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-foreground">
                  {format(d.value)}
                </span>
              </motion.div>
            </div>
            <span className="w-full truncate text-center text-[11px] text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal labelled bars (e.g. rating distribution, common tags). */
export function BarList({
  data,
  format = (n) => String(n),
  color = "var(--primary)",
  className,
}: {
  data: SeriesPoint[];
  format?: (n: number) => string;
  color?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <EmptyChart />;
  return (
    <div className={cn("space-y-2.5", className)}>
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={d.label + i} className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate text-[13px] text-muted-foreground">{d.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={reduced ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-[13px] font-semibold text-foreground">{format(d.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Donut chart with a legend. Solid arc colours from the blue/violet palette. */
export function Donut({
  data,
  size = 168,
  thickness = 22,
  centerLabel,
  centerSub,
  className,
}: {
  data: SeriesPoint[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  if (total === 0) return <EmptyChart />;

  let acc = 0;
  const segments = data.map((d, i) => {
    const frac = d.value / total;
    const seg = { color: PALETTE[i % PALETTE.length], len: frac * c, offset: acc * c, label: d.label, value: d.value };
    acc += frac;
    return seg;
  });

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
          {segments.map((s, i) => (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
              strokeDasharray={`${s.len} ${c - s.len}`}
              strokeDashoffset={-s.offset}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
            />
          ))}
        </svg>
        {(centerLabel || centerSub) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel && (
              <span className="font-display text-[24px] font-semibold leading-none tracking-[-0.03em]">{centerLabel}</span>
            )}
            {centerSub && <span className="mt-1 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{centerSub}</span>}
          </div>
        )}
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.label}</span>
            <span className="font-semibold text-foreground">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-border text-[13px] text-muted-foreground">
      No data in this range yet
    </div>
  );
}
