import type { SeriesPoint } from "../../models";
import { EmptyState } from "../common/EmptyState";

type Props = {
  data: SeriesPoint[];
  formatValue?: (value: number) => string;
  emptyLabel?: string;
  /** Accessible description of what the chart represents. */
  label?: string;
};

const W = 320;
const H = 150;
const PAD_BOTTOM = 24;
const PAD_TOP = 16;

/**
 * Dependency-free SVG column chart for time-series SeriesPoint data (e.g.
 * savings over time, businesses by month). Bars scale to the largest value and
 * the chart stretches responsively while keeping its aspect ratio.
 */
export function ColumnChart({ data, formatValue, emptyLabel = "No data yet", label = "Column chart" }: Props) {
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
        <line
          x1="0"
          y1={H - PAD_BOTTOM}
          x2={W}
          y2={H - PAD_BOTTOM}
          className="column-chart__axis"
        />
        {data.map((point, i) => {
          const h = max > 0 ? (point.value / max) * plotH : 0;
          const x = i * slot + (slot - barW) / 2;
          const y = H - PAD_BOTTOM - h;
          return (
            <g key={point.label}>
              {point.value > 0 && (
                <text x={x + barW / 2} y={y - 4} className="column-chart__value-label">
                  {fmt(point.value)}
                </text>
              )}
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, point.value > 0 ? 2 : 0)}
                rx="3"
                className="column-chart__bar"
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
