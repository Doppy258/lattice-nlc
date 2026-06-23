import type { Business } from "../../models";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { StarRating } from "../common/StarRating";
import { CATEGORY_META } from "../../data/catalog";
import { formatDistance } from "../../utils/formatting";

type Props = {
  business: Business;
  distanceKm: number;
  saved: boolean;
  onToggleSave: () => void;
};

const PRICE_LEVEL = ["", "$", "$$", "$$$", "$$$$"];

export function BusinessProfileHeader({ business, distanceKm, saved, onToggleSave }: Props) {
  return (
    <header className="profile-header">
      <div className="profile-header__main">
        <div className="profile-header__title-row">
          <h1 className="profile-header__name">{business.name}</h1>
          {business.verified && (
            <span className="verified-tag verified-tag--lg" title="Verified local business">
              <Icon name="check" size={13} /> Verified
            </span>
          )}
        </div>
        <p className="profile-header__category">
          {CATEGORY_META[business.category].label} · {PRICE_LEVEL[business.priceLevel]}
        </p>
        <div className="profile-header__stats">
          <StarRating value={business.ratingAverage} reviewCount={business.reviewCount} size={16} />
          <span className="profile-header__stat">
            <Icon name="location" size={15} /> {formatDistance(distanceKm)} away
          </span>
        </div>
      </div>
      <Button
        variant={saved ? "secondary" : "primary"}
        onClick={onToggleSave}
        aria-pressed={saved}
        iconLeft={<Icon name="saved" size={16} />}
      >
        {saved ? "Saved" : "Save business"}
      </Button>
    </header>
  );
}
