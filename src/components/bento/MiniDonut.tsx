import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  /** Ratio 0..1. */
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  track?: string;
  /** Big label inside the ring (defaults to rounded percent). */
  label?: string;
  sublabel?: string;
  className?: string;
};

/** Compact progress ring for ratios (conversion, claim fill, …). */
export function MiniDonut({
  value,
  size = 92,
  thickness = 9,
  color = "var(--primary)",
  track = "rgba(10,18,32,0.08)",
  label,
  sublabel,
  className,
}: Props) {
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(1, value));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={center} cy={center} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <motion.circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-lg font-bold leading-none tabular-nums text-foreground">
            {label ?? `${Math.round(v * 100)}%`}
          </div>
          {sublabel && <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}
