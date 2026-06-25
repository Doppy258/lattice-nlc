import { Star } from "lucide-react";
import { formatRating } from "../../utils/formatting";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
};

/** Read-only 1-5 star display with the precise value announced for assistive tech. */
export function StarRating({
  value,
  size = 14,
  showValue = true,
  reviewCount,
}: Props) {
  const filled = Math.round(value);
  const label = `${formatRating(value)} out of 5${
    reviewCount !== undefined ? `, ${reviewCount} reviews` : ""
  }`;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground"
      aria-label={label}
    >
      <span className="inline-flex items-center gap-px" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={size}
            strokeWidth={1.6}
            className={cn(
              i < filled
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/35",
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className="font-semibold text-foreground">
          {formatRating(value)}
          {reviewCount !== undefined && (
            <span className="font-normal text-muted-foreground">
              {" "}
              ({reviewCount})
            </span>
          )}
        </span>
      )}
    </span>
  );
}
