import { useState } from "react";
import { Icon } from "./Icon";

type Props = {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
};

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

/**
 * Interactive 1–5 star picker. Supports mouse hover preview, click, and full
 * keyboard control via a radiogroup (arrow keys move between stars).
 */
export function RatingInput({ value, onChange, size = 28 }: Props) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  const onKey = (e: React.KeyboardEvent, star: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, star + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, star - 1));
    }
  };

  return (
    <div className="rating-input">
      <div className="rating-input__stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
            className={`rating-input__star ${star <= shown ? "rating-input__star--on" : ""}`}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            onKeyDown={(e) => onKey(e, star)}
          >
            <Icon name="star" size={size} />
          </button>
        ))}
      </div>
      <span className="rating-input__label">{LABELS[shown] ?? ""}</span>
    </div>
  );
}
