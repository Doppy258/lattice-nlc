import { Icon } from "./Icon";
import { formatRating } from "../../utils/formatting";

type Props = {
  value: number;
  size?: number;
  /** Show the numeric value next to the stars. */
  showValue?: boolean;
  reviewCount?: number;
};

/**
 * Read-only 1-5 star display. The filled count rounds to the nearest whole
 * star; the precise value is shown alongside (and announced for screen readers).
 */
export function StarRating({ value, size = 14, showValue = true, reviewCount }: Props) {
  const filled = Math.round(value);
  const label = `${formatRating(value)} out of 5${
    reviewCount !== undefined ? `, ${reviewCount} reviews` : ""
  }`;
  return (
    <span className="stars" aria-label={label}>
      <span className="stars__row" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Icon
            key={i}
            name="star"
            size={size}
            className={i < filled ? "stars__star stars__star--on" : "stars__star"}
          />
        ))}
      </span>
      {showValue && (
        <span className="stars__value">
          {formatRating(value)}
          {reviewCount !== undefined && (
            <span className="stars__count"> ({reviewCount})</span>
          )}
        </span>
      )}
    </span>
  );
}
