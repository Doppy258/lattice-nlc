/**
 * MatchScoreBadge — rounded pill with score percentage and tier label.
 * See component for tier thresholds and colour mapping.
 */
import { cn } from "@/lib/utils";

function tier(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Best match", color: "var(--match-high)" };
  if (score >= 70) return { label: "Great match", color: "var(--match-mid)" };
  return { label: "Good match", color: "var(--match-low)" };
}

/**
 * MatchScoreBadge — rounded pill that displays a match-score percentage
 * (from the matching engine) with a coloured dot and tier label. Three tiers:
 * ≥85 "Best match" (green), ≥70 "Great match" (amber), else "Good match"
 * (blue). The dot and label share the tier colour for quick scanning.
 */
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
