/**
 * MatchReasons - renders the "Why this matched" explanation list produced by
 * the OfferRank scoring engine. Each reason gets a green checkmark bullet.
 * Props: reasons (string[]), className?, title? (default "Why this matched")
 * Role in architecture: Domain — surfaces offer-ranking transparency so users
 * understand why a particular offer was recommended to them.
 */
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";


export function MatchReasons({
  reasons,
  className,
  title = "Why this matched",
}: {
  reasons: string[];
  className?: string;
  title?: string;
}) {
  if (!reasons.length) return null;
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {title}
        </div>
      )}
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {reasons.map((reason, i) => (
          <li key={i} className="flex items-center gap-2 text-[13px] text-foreground">
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[var(--success-tint)] text-[var(--success)]">
              <Check size={11} strokeWidth={2.6} />
            </span>
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
