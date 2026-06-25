import { motion } from "motion/react";
import { EASE_OUT_EXPO } from "@/components/motion/tokens";

type Props = {
  score: number;
};

/** Animated radial gauge for the OfferRank match score. */
export function MatchScoreBadge({ score }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const color =
    pct >= 80
      ? "var(--match-high)"
      : pct >= 55
        ? "var(--match-mid)"
        : "var(--match-low)";
  const r = 25;
  const circumference = 2 * Math.PI * r;

  return (
    <span
      className="relative grid size-[58px] shrink-0 place-items-center"
      title="OfferRank match score"
      aria-label={`Match score ${pct} percent`}
    >
      <svg viewBox="0 0 60 60" className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="5"
        />
        <motion.circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - pct / 100) }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
        />
      </svg>
      <span
        className="mono text-[15px] font-extrabold tabular-nums"
        style={{ color }}
      >
        {pct}
      </span>
    </span>
  );
}
