import { motion, useReducedMotion } from "motion/react";
import type { SeriesPoint } from "../../models";
import { EmptyState } from "../common/EmptyState";

type Props = {
  data: SeriesPoint[];
  formatValue?: (value: number) => string;
  emptyLabel?: string;
};

function AnimatedBar({ width }: { width: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className="bar-chart__fill"
      initial={reduced ? false : { width: 0 }}
      animate={{ width }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.05 }}
    />
  );
}

export function MiniBarChart({ data, formatValue, emptyLabel = "No data yet" }: Props) {
  if (data.length === 0) {
    return <EmptyState icon="analytics" title={emptyLabel} />;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <ul className="bar-chart">
      {data.map((point) => (
        <li key={point.label} className="bar-chart__row">
          <span className="bar-chart__label">{point.label}</span>
          <span className="bar-chart__track">
            <AnimatedBar width={`${Math.max(4, (point.value / max) * 100)}%`} />
          </span>
          <span className="bar-chart__value">{fmt(point.value)}</span>
        </li>
      ))}
    </ul>
  );
}
