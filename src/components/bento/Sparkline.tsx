import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  data: number[];
  width?: number;
  height?: number;
  variant?: "line" | "area" | "bars";
  /** Stroke / bar color (any CSS color or var). */
  color?: string;
  /** Area fill color. */
  fill?: string;
  strokeWidth?: number;
  className?: string;
};

/**
 * Compact, dependency-free SVG sparkline for stat tiles. Stretches to its
 * container width; the line draws on once via `pathLength` (static under
 * reduced motion).
 */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  variant = "area",
  color = "var(--spark-line)",
  fill = "var(--spark-fill)",
  strokeWidth = 2,
  className,
}: Props) {
  const reduce = useReducedMotion();
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = strokeWidth + 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const pts = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = pad + innerH - ((d - min) / range) * innerH;
    return [x, y] as const;
  });

  if (variant === "bars") {
    const slot = innerW / data.length;
    const bw = Math.max(2, slot * 0.58);
    return (
      <svg
        className={cn("w-full", className)}
        viewBox={`0 0 ${width} ${height}`}
        height={height}
        preserveAspectRatio="none"
        aria-hidden
      >
        {data.map((d, i) => {
          const h = Math.max(1, ((d - min) / range) * innerH);
          const x = pad + i * slot + (slot - bw) / 2;
          return (
            <rect key={i} x={x} y={pad + innerH - h} width={bw} height={h} rx={1.5} fill={color} opacity={0.9} />
          );
        })}
      </svg>
    );
  }

  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L${last[0].toFixed(2)},${(height - pad).toFixed(2)} L${pts[0][0].toFixed(2)},${(height - pad).toFixed(2)} Z`;

  return (
    <svg
      className={cn("w-full overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
      height={height}
      preserveAspectRatio="none"
      aria-hidden
    >
      {variant === "area" && <path d={area} fill={fill} stroke="none" />}
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={reduce ? undefined : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
