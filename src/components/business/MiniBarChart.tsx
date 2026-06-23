import type { SeriesPoint } from "../../models";
import { EmptyState } from "../common/EmptyState";

type Props = {
  data: SeriesPoint[];
  /** Formats the value shown at the end of each bar. */
  formatValue?: (value: number) => string;
  emptyLabel?: string;
};

/**
 * Dependency-free horizontal bar chart for small SeriesPoint sets. Bars are
 * scaled to the largest value so the visual stays readable regardless of units.
 */
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
            <span
              className="bar-chart__fill"
              style={{ width: `${Math.max(4, (point.value / max) * 100)}%` }}
            />
          </span>
          <span className="bar-chart__value">{fmt(point.value)}</span>
        </li>
      ))}
    </ul>
  );
}
