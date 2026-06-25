import { Check } from "lucide-react";

type Props = {
  reasons: string[];
};

/** Renders the "why this matched" explanations produced by OfferRank. */
export function MatchReasons({ reasons }: Props) {
  if (reasons.length === 0) return null;
  return (
    <div>
      <span className="text-[13px] font-semibold text-muted-foreground">
        Why this matched
      </span>
      <ul className="mt-2 grid gap-1.5">
        {reasons.map((reason) => (
          <li
            key={reason}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-brand-tint text-primary">
              <Check className="size-3" strokeWidth={2.6} />
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
