import type { Offer } from "../../models";
import type { OfferStatus } from "../../services/offerService";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { OFFER_TYPE_LABELS } from "../../data/catalog";
import { formatCurrency, relativeTime } from "../../utils/formatting";

type Props = {
  offer: Offer;
  status: OfferStatus;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
};

const STATUS_TONE: Record<OfferStatus, "success" | "warning" | "neutral" | "accent"> = {
  active: "success",
  paused: "warning",
  expired: "neutral",
  full: "accent",
};

const STATUS_LABEL: Record<OfferStatus, string> = {
  active: "Active",
  paused: "Paused",
  expired: "Expired",
  full: "Full",
};

export function OwnerOfferRow({ offer, status, onEdit, onToggleActive, onDelete }: Props) {
  const hasClaims = offer.currentClaims > 0;
  const claimPct = Math.min(100, Math.round((offer.currentClaims / offer.maxClaims) * 100));
  const expired = status === "expired";

  return (
    <div className="owner-offer">
      <div className="owner-offer__main">
        <div className="owner-offer__head">
          <h3 className="owner-offer__title">{offer.title}</h3>
          <Badge tone={STATUS_TONE[status]} dot>
            {STATUS_LABEL[status]}
          </Badge>
        </div>
        <div className="owner-offer__meta">
          <Badge tone="neutral">{OFFER_TYPE_LABELS[offer.offerType]}</Badge>
          <span className="owner-offer__price">
            {offer.price === 0 ? "Free" : formatCurrency(offer.price)}
            {offer.originalPrice && (
              <span className="owner-offer__original">{formatCurrency(offer.originalPrice)}</span>
            )}
          </span>
          {offer.studentOnly && <Badge tone="accent">Student</Badge>}
        </div>
      </div>

      <div className="owner-offer__stats">
        <span className="owner-offer__stat">
          <Icon name="reports" size={14} /> {offer.views} views
        </span>
        <span className="owner-offer__stat">
          <Icon name="ticket" size={14} /> {offer.currentClaims}/{offer.maxClaims} claimed
        </span>
        <span className="owner-offer__stat">
          <Icon name="clock" size={14} /> {expired ? "Ended" : `Ends ${relativeTime(offer.validUntil)}`}
        </span>
      </div>

      <div className="owner-offer__progress" aria-hidden="true">
        <span className="owner-offer__progress-fill" style={{ width: `${claimPct}%` }} />
      </div>

      <div className="owner-offer__actions">
        <Button variant="secondary" size="sm" onClick={onEdit} iconLeft={<Icon name="createOffer" size={14} />}>
          Edit
        </Button>
        {!expired && (
          <Button variant="ghost" size="sm" onClick={onToggleActive}>
            {offer.active ? "Pause" : "Resume"}
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          disabled={hasClaims}
          title={hasClaims ? "Offers with claims can be paused but not deleted" : undefined}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
