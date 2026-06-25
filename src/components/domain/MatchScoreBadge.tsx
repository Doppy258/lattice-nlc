import { cn } from "@/lib/utils";

function tier(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Best match", color: "var(--match-high)" };
  if (score >= 70) return { label: "Great match", color: "var(--match-mid)" };
  return { label: "Good match", color: "var(--match-low)" };
}

/** Compact match-score pill: tier dot + label + percent (OfferRank output). */
export function MatchScoreBadge({ score, className }: { score: number; className?: string }) {
  const { label, color } = tier(score);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 shadow-[var(--shadow-soft)] backdrop-blur-sm",
        className,
      )}
    >
      <span className="size-2 rounded-full" style={{ background: color }} />
      <span className="mono text-xs font-semibold text-foreground">{score}%</span>
      <span className="text-xs font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
