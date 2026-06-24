import { motion, useReducedMotion } from "motion/react";
import type { SeriesPoint } from "../../models";
import { EmptyState } from "../common/EmptyState";

type Props = {
  data: SeriesPoint[];
  formatValue?: (value: number) => string;
  emptyLabel?: string;
  label?: string;
};

const W = 320;
const H = 150;
const PAD_BOTTOM = 24;
const PAD_TOP = 16;

export function ColumnChart({ data, formatValue, emptyLabel = "No data yet", label = "Column chart" }: Props) {
  const reduced = useReducedMotion();

  if (data.length === 0) {
    return <EmptyState icon="analytics" title={emptyLabel} />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = formatValue ?? ((v: number) => String(v));
  const plotH = H - PAD_BOTTOM - PAD_TOP;
  const slot = W / data.length;
  const barW = Math.min(40, slot * 0.55);

  return (
    <div className="column-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        preserveAspectRatio="none"
        className="column-chart__svg"
      >
        <line x1="0" y1={H - PAD_BOTTOM} x2={W} y2={H - PAD_BOTTOM} className="column-chart__axis" />
        {data.map((point, i) => {
          const h = max > 0 ? (point.value / max) * plotH : 0;
          const x = i * slot + (slot - barW) / 2;
          const y = H - PAD_BOTTOM - h;
          const barHeight = Math.max(h, point.value > 0 ? 2 : 0);
          return (
            <g key={point.label}>
              {point.value > 0 && (
                <text x={x + barW / 2} y={y - 4} className="column-chart__value-label">
                  {fmt(point.value)}
                </text>
              )}
              <motion.rect
                x={x}
                width={barW}
                rx="3"
                className="column-chart__bar"
                initial={reduced ? false : { y: H - PAD_BOTTOM, height: 0 }}
                animate={{ y, height: barHeight }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.04 }}
              />
              <text x={x + barW / 2} y={H - PAD_BOTTOM + 14} className="column-chart__x-label">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
