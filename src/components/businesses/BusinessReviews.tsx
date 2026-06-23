import type { Review, User } from "../../models";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";
import { StarRating } from "../common/StarRating";
import { EmptyState } from "../common/EmptyState";

type Props = {
  reviews: Review[];
  users: User[];
};

const DATE_FMT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

export function BusinessReviews({ reviews, users }: Props) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon="reviews"
        title="No reviews yet"
        body="Verified reviews appear here after customers redeem and rate their offers."
      />
    );
  }

  const nameFor = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name.split(" ")[0] : "Member";
  };

  return (
    <ul className="review-list">
      {reviews.map((review) => (
        <li key={review.id} className="review-item">
          <div className="review-item__head">
            <div className="review-item__who">
              <span className="review-item__name">{nameFor(review.userId)}</span>
              {review.verified && (
                <span className="verified-tag" title="Verified after redemption">
                  <Icon name="check" size={12} /> Verified
                </span>
              )}
            </div>
            <StarRating value={review.rating} showValue={false} />
          </div>
          <p className="review-item__text">{review.text}</p>
          {review.tags.length > 0 && (
            <div className="chip-row">
              {review.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <span className="review-item__date">
            {new Date(review.createdAt).toLocaleDateString("en-US", DATE_FMT)}
          </span>
        </li>
      ))}
    </ul>
  );
}
