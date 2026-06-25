import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Display-only star rating. Filled = primary blue (stays on-palette). */
export function RatingStars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating.toFixed(1)} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < rounded;
        return (
          <Star
            key={i}
            size={size}
            strokeWidth={1.6}
            className={filled ? "text-primary" : "text-muted-foreground/35"}
            fill={filled ? "currentColor" : "none"}
            aria-hidden
          />
        );
      })}
    </span>
  );
}
