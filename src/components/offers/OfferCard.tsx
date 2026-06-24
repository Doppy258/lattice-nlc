import type { Business, MatchResult, Offer } from "../../models";
import type { OfferClaimState } from "../../app/useOfferInteractions";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";
import { StarRating } from "../common/StarRating";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { MatchReasons } from "./MatchReasons";
import { CATEGORY_META } from "../../data/catalog";
import { formatCurrency, formatDistance, relativeTime } from "../../utils/formatting";
import { businessGrade, businessImageUrl, friendAvatarUrl, savedByCount } from "../../utils/businessVisuals";

type Props = {
  offer: Offer;
  business: Business;
  distanceKm?: number;
  match?: MatchResult;
  saved: boolean;
  claimState: OfferClaimState;
  featured?: boolean;
  onClaim: () => void;
  onToggleSave: () => void;
  onViewBusiness: () => void;
};

const CLAIM_LABEL: Record<OfferClaimState, string> = {
  claimable: "Claim offer",
  claimed: "Claimed",
  full: "Offer full",
  expired: "Expired",
};

export function OfferCard({
  offer,
  business,
  distanceKm,
  match,
  saved,
  claimState,
  onClaim,
  onToggleSave,
  onViewBusiness,
  featured = false,
}: Props) {
  const savings = offer.originalPrice ? offer.originalPrice - offer.price : 0;
  const expired = claimState === "expired";
  const savedBy = savedByCount(offer.id);

  return (
    <Card className={`offer-card${featured ? " offer-card--featured" : ""}`} interactive pad={!featured}>
      <div className="offer-card__media">
        <img src={businessImageUrl(business)} alt={`${business.name} offer preview`} />
        <Badge tone="accent">{businessGrade(business)}</Badge>
        <button
          className={`icon-toggle offer-card__save ${saved ? "icon-toggle--on" : ""}`}
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove saved offer" : "Save offer"}
        >
          <Icon name="saved" size={18} />
        </button>
      </div>

      <div className="offer-card__head">
        <div className="offer-card__biz">
          <button className="offer-card__biz-name" onClick={onViewBusiness}>
            {business.name}
          </button>
          <div className="offer-card__biz-meta">
            <Badge tone="neutral">{CATEGORY_META[business.category].label}</Badge>
            {business.verified && (
              <span className="verified-tag" title="Verified local business">
                <Icon name="check" size={12} /> Verified
              </span>
            )}
          </div>
        </div>
        {match && <MatchScoreBadge score={match.score} />}
      </div>

      <h3 className="offer-card__title">{offer.title}</h3>
      <p className="offer-card__desc">{offer.description}</p>

      <div className="offer-card__price-row">
        <span className="offer-card__price">
          {offer.price === 0 ? "Free" : formatCurrency(offer.price)}
        </span>
        {offer.originalPrice && (
          <span className="offer-card__original">{formatCurrency(offer.originalPrice)}</span>
        )}
        {savings > 0 && <Badge tone="success">Save {formatCurrency(savings)}</Badge>}
        {offer.studentOnly && <Badge tone="accent">Student</Badge>}
      </div>

      <div className="offer-card__meta">
        {distanceKm !== undefined && (
          <span className="offer-card__meta-item">
            <Icon name="location" size={14} /> {formatDistance(distanceKm)}
          </span>
        )}
        <StarRating value={business.ratingAverage} reviewCount={business.reviewCount} />
        <span className="offer-card__meta-item">
          <Icon name="clock" size={14} />{" "}
          {expired ? "Ended" : `Ends ${relativeTime(offer.validUntil)}`}
        </span>
      </div>

      {match && <MatchReasons reasons={match.reasons} />}

      <div className="biz-card__social">
        <span className="mini-avatars" aria-hidden="true">
          {Array.from({ length: Math.min(savedBy, 3) }).map((_, index) => (
            <img key={index} src={friendAvatarUrl(offer.id, index)} alt="" />
          ))}
        </span>
        <span>{savedBy} local{savedBy === 1 ? "" : "s"} saved this</span>
      </div>

      <div className="offer-card__actions">
        <Button onClick={onClaim} disabled={claimState !== "claimable"} size="sm">
          {CLAIM_LABEL[claimState]}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleSave}
          aria-pressed={saved}
          iconLeft={<Icon name="saved" size={15} />}
        >
          {saved ? "Saved" : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onViewBusiness}>
          Details
        </Button>
      </div>
    </Card>
  );
}
