import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Point = { label: string; value: number };

type Props = {
  data: Point[];
  /** Show the category label under each bar. */
  showLabels?: boolean;
  /** Format the value shown on hover/top (defaults to rounded). */
  format?: (n: number) => string;
  className?: string;
};

/**
 * Bento-native vertical bar chart for `SeriesPoint[]` data. Bars grow on mount
 * (static under reduced motion). Replaces the legacy CSS column charts.
 */
export function MiniBars({ data, showLabels = true, format = (n) => String(Math.round(n)), className }: Props) {
  const reduce = useReducedMotion();
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex h-full items-center justify-center text-sm text-muted-foreground", className)}>
        No data yet
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("flex h-full items-end gap-2", className)}>
      {data.map((d, i) => {
        const pct = Math.max(4, (d.value / max) * 100);
        return (
          <div key={`${d.label}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full flex-1 items-end justify-center">
              <span className="absolute -top-4 text-[11px] font-semibold text-muted-foreground tabular-nums">
                {d.value > 0 ? format(d.value) : ""}
              </span>
              <motion.div
                className="w-full max-w-[34px] rounded-t-md"
                style={{ background: "var(--grad-brand)" }}
                initial={reduce ? false : { height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.04 * i }}
              />
            </div>
            {showLabels && (
              <span className="w-full truncate text-center text-[11px] font-medium text-muted-foreground">
                {d.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
