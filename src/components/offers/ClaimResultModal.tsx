import type { ClaimOutcome } from "../../app/useOfferInteractions";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { navigate } from "../../app/navigation";
import { relativeTime } from "../../utils/formatting";

const DATE_FMT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

type Props = {
  outcome: ClaimOutcome | null;
  onClose: () => void;
};

/**
 * Shared claim-confirmation dialog. Renders the generated PING-#### code and
 * redemption instructions on success, or a clear, actionable error otherwise.
 */
export function ClaimResultModal({ outcome, onClose }: Props) {
  if (!outcome) return null;

  if (!outcome.ok) {
    return (
      <Modal
        open
        title="Couldn't claim this offer"
        onClose={onClose}
        footer={
          <Button block onClick={onClose}>
            Got it
          </Button>
        }
      >
        <div className="claim-error">
          <span className="claim-error__icon">
            <Icon name="alert" size={20} />
          </span>
          <p>{outcome.error}</p>
        </div>
      </Modal>
    );
  }

  const { claim, offer, business } = outcome;
  const viewBusiness = () => {
    onClose();
    navigate(`/business/profile?b=${business.id}`);
  };
  const goToClaims = () => {
    onClose();
    navigate("/claims");
  };

  return (
    <Modal
      open
      title="Offer claimed"
      onClose={onClose}
      footer={
        <div className="row" style={{ gap: "var(--space-3)" }}>
          <Button block onClick={goToClaims} iconLeft={<Icon name="ticket" size={16} />}>
            View active claims
          </Button>
          <Button variant="secondary" block onClick={viewBusiness}>
            View business
          </Button>
        </div>
      }
    >
      <div className="claim-code-card">
        <span className="claim-code-card__label">Your claim code</span>
        <span className="claim-code-card__code mono">{claim.claimCode}</span>
        <p className="claim-code-card__instructions">
          Show this code at <strong>{business.name}</strong> to redeem{" "}
          <strong>{offer.title}</strong>.
        </p>
      </div>
      <dl className="claim-code-card__details">
        <div>
          <dt>Expires</dt>
          <dd>{relativeTime(claim.expiresAt)}</dd>
        </div>
        <div>
          <dt>Redeem before</dt>
          <dd>{new Date(claim.expiresAt).toLocaleString("en-US", DATE_FMT)}</dd>
        </div>
      </dl>
    </Modal>
  );
}
