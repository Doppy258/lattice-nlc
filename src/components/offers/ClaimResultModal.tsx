import { TriangleAlert } from "lucide-react";
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
        <div className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--destructive)_22%,transparent)] bg-[var(--danger-tint)] p-4 text-destructive">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
          <p className="text-sm leading-relaxed">{outcome.error}</p>
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
        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Button
            block
            onClick={goToClaims}
            iconLeft={<Icon name="ticket" size={16} />}
          >
            View active claims
          </Button>
          <Button variant="secondary" block onClick={viewBusiness}>
            View business
          </Button>
        </div>
      }
    >
      <div className="grid gap-2 rounded-2xl border border-dashed border-[color-mix(in_oklab,var(--primary)_28%,transparent)] bg-brand-tint/60 p-6 text-center">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Your claim code
        </span>
        <span className="mono text-4xl font-extrabold tracking-tight text-primary">
          {claim.claimCode}
        </span>
        <p className="text-sm text-muted-foreground">
          Show this code at <strong className="text-foreground">{business.name}</strong>{" "}
          to redeem <strong className="text-foreground">{offer.title}</strong>.
        </p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <dt className="text-xs font-semibold text-muted-foreground">Expires</dt>
          <dd className="mt-0.5 text-sm font-semibold text-foreground">
            {relativeTime(claim.expiresAt)}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <dt className="text-xs font-semibold text-muted-foreground">
            Redeem before
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-foreground">
            {new Date(claim.expiresAt).toLocaleString("en-US", DATE_FMT)}
          </dd>
        </div>
      </dl>
    </Modal>
  );
}
