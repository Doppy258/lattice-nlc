import type { Business } from "../../models";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";
import { StarRating } from "../common/StarRating";
import { CATEGORY_META } from "../../data/catalog";
import { formatDistance } from "../../utils/formatting";

type Props = {
  business: Business;
  distanceKm?: number;
  dealCount: number;
  saved: boolean;
  onToggleSave: () => void;
  onView: () => void;
};

/** Discovery card for the Explore grid and similar-businesses lists. */
export function BusinessCard({
  business,
  distanceKm,
  dealCount,
  saved,
  onToggleSave,
  onView,
}: Props) {
  return (
    <Card className="biz-card" interactive>
      <div className="biz-card__head">
        <div>
          <button className="biz-card__name" onClick={onView}>
            {business.name}
          </button>
          <div className="biz-card__meta">
            <Badge tone="neutral">{CATEGORY_META[business.category].label}</Badge>
            {business.verified && (
              <span className="verified-tag" title="Verified local business">
                <Icon name="check" size={12} /> Verified
              </span>
            )}
          </div>
        </div>
        <button
          className={`icon-toggle ${saved ? "icon-toggle--on" : ""}`}
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove bookmark" : "Save business"}
        >
          <Icon name="saved" size={18} />
        </button>
      </div>

      <p className="biz-card__desc">{business.description}</p>

      <div className="biz-card__stats">
        <StarRating value={business.ratingAverage} reviewCount={business.reviewCount} />
        {distanceKm !== undefined && (
          <span className="biz-card__stat">
            <Icon name="location" size={14} /> {formatDistance(distanceKm)}
          </span>
        )}
        {dealCount > 0 && (
          <Badge tone="success">
            {dealCount} active deal{dealCount === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      <Button variant="secondary" size="sm" block onClick={onView}>
        View profile
      </Button>
    </Card>
  );
}
