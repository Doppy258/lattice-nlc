import type { Review } from "../../models";
import { StarRating } from "../common/StarRating";
import { formatRating } from "../../utils/formatting";

type Props = {
  reviews: Review[];
};

/** Average rating plus a 5→1 star distribution, computed from the review set. */
export function RatingBreakdown({ reviews }: Props) {
  const count = reviews.length;
  const average =
    count > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  const max = Math.max(
    1,
    ...[5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length)
  );

  return (
    <div className="rating-breakdown">
      <div className="rating-breakdown__summary">
        <span className="rating-breakdown__avg">{formatRating(average)}</span>
        <StarRating value={average} showValue={false} size={16} />
        <span className="rating-breakdown__count">
          {count} review{count === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="rating-breakdown__rows">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = reviews.filter((r) => r.rating === star).length;
          return (
            <li key={star} className="rating-breakdown__row">
              <span className="rating-breakdown__star">{star}★</span>
              <span className="bar-chart__track">
                <span
                  className="bar-chart__fill"
                  style={{ width: `${(n / max) * 100}%` }}
                />
              </span>
              <span className="rating-breakdown__n">{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
