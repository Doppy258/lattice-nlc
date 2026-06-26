import { useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Badge, type BadgeTone } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { PageHeader } from "@/components/common/PageHeader";
import { Modal } from "@/components/common/Modal";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { BusinessImage } from "@/components/domain/BusinessImage";
import { ClaimCodeCard } from "@/components/domain/ClaimCodeCard";
import { ReviewModal } from "@/components/domain/ReviewModal";
import { canUserReviewClaim } from "@/services/reviewService";
import { calculateEstimatedSavings } from "@/services/reportService";
import { formatCurrency, relativeTime } from "@/utils/formatting";
import type { Claim, ClaimStatus } from "@/models";

type Filter = "all" | "active" | "redeemed" | "expired";

const STATUS_META: Record<ClaimStatus, { tone: BadgeTone; label: string }> = {
  active: { tone: "brand", label: "Active" },
  redeemed: { tone: "success", label: "Redeemed" },
  expired: { tone: "neutral", label: "Expired" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

export function ClaimsPage() {
  const { data, activeUser } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [codeClaim, setCodeClaim] = useState<Claim | null>(null);
  const [reviewClaim, setReviewClaim] = useState<Claim | null>(null);

  const myClaims = useMemo(
    () =>
      data.claims
        .filter((c) => c.userId === activeUser.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [data.claims, activeUser.id],
  );

  const counts = {
    active: myClaims.filter((c) => c.status === "active").length,
    redeemed: myClaims.filter((c) => c.status === "redeemed").length,
    past: myClaims.filter((c) => c.status === "expired" || c.status === "cancelled").length,
    saved: calculateEstimatedSavings(myClaims, data.offers),
  };

  const visible = useMemo(
    () =>
      myClaims.filter((c) => {
        if (filter === "all") return true;
        if (filter === "expired") return c.status === "expired" || c.status === "cancelled";
        return c.status === filter;
      }),
    [myClaims, filter],
  );

  const offerFor = (c: Claim) => data.offers.find((o) => o.id === c.offerId);
  const bizFor = (c: Claim) => data.businesses.find((b) => b.id === c.businessId);

  const codeOffer = codeClaim ? offerFor(codeClaim) : undefined;
  const codeBiz = codeClaim ? bizFor(codeClaim) : undefined;
  const reviewOffer = reviewClaim ? offerFor(reviewClaim) : undefined;
  const reviewBiz = reviewClaim ? bizFor(reviewClaim) : undefined;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Your"
        accent="claims"
        subtitle="Every offer you've claimed lives here. Show an active code at the business to redeem it, then leave a verified review."
      />

      <div className="rounded-[var(--tile-radius)] border border-border bg-card/75 px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
        <span className="font-semibold text-foreground">{counts.active}</span> active,{" "}
        <span className="font-semibold text-foreground">{counts.redeemed}</span> redeemed, and{" "}
        <span className="font-semibold text-foreground">{formatCurrency(counts.saved)}</span> saved from completed visits.
      </div>

      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All (${myClaims.length})` },
          { value: "active", label: `Active (${counts.active})` },
          { value: "redeemed", label: `Redeemed (${counts.redeemed})` },
          { value: "expired", label: `Past (${counts.past})` },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon="claims"
          title={filter === "all" ? "No claims yet" : "Nothing here"}
          body="Claim an offer from your matches or a business profile and it'll show up here with a redeem code."
          action={
            <Button variant="brand" iconLeft={<Icon name="ping" size={17} />} onClick={() => navigate("/create")}>
              Create a Lattice
            </Button>
          }
        />
      ) : (
        <Stagger className="space-y-3">
          {visible.map((c) => {
            const offer = offerFor(c);
            const business = bizFor(c);
            if (!offer || !business) return null;
            const status = STATUS_META[c.status];
            const reviewed = data.reviews.some((r) => r.claimId === c.id);
            const canReview = canUserReviewClaim(activeUser.id, c.id, data.claims, data.reviews);
            return (
              <StaggerItem key={c.id}>
                <Card variant="solid" className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <BusinessImage
                    business={business}
                    width={240}
                    className="hidden size-16 shrink-0 rounded-2xl sm:block"
                    iconSize={22}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={status.tone} dot>
                        {status.label}
                      </Badge>
                      <span className="text-[12px] text-muted-foreground">
                        {c.status === "redeemed" && c.redeemedAt
                          ? `Redeemed ${relativeTime(c.redeemedAt)}`
                          : c.status === "active"
                            ? `Expires ${relativeTime(c.expiresAt)}`
                            : `Expired ${relativeTime(c.expiresAt)}`}
                      </span>
                    </div>
                    <h3 className="mt-1 truncate font-display text-[16px] font-semibold tracking-[-0.02em]">
                      {offer.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigate(`/business?id=${business.id}`)}
                      className="cursor-pointer text-[13px] text-muted-foreground transition-colors hover:text-primary"
                    >
                      {business.name}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="mono rounded-xl bg-[var(--tint-blue)] px-3 py-1.5 text-[15px] font-semibold tracking-[0.08em] text-[var(--primary-strong)]">
                      {c.claimCode}
                    </span>
                    <div className="flex items-center gap-2">
                      {c.status === "active" && (
                        <Button variant="brand" size="sm" iconLeft={<Icon name="ticket" size={15} />} onClick={() => setCodeClaim(c)}>
                          Show code
                        </Button>
                      )}
                      {c.status === "redeemed" &&
                        (reviewed ? (
                          <Badge tone="success" icon={<Icon name="check" size={12} />}>
                            Reviewed
                          </Badge>
                        ) : (
                          canReview && (
                            <Button variant="secondary" size="sm" iconLeft={<Icon name="reviews" size={15} />} onClick={() => setReviewClaim(c)}>
                              Review
                            </Button>
                          )
                        ))}
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <Modal
        open={!!codeClaim}
        onOpenChange={(o) => !o && setCodeClaim(null)}
        title="Your claim code"
        description="Show this at the business to redeem your offer before it expires."
      >
        {codeClaim && codeOffer && codeBiz && (
          <ClaimCodeCard claim={codeClaim} offer={codeOffer} business={codeBiz} />
        )}
      </Modal>

      {reviewClaim && reviewOffer && reviewBiz && (
        <ReviewModal
          open={!!reviewClaim}
          onOpenChange={(o) => !o && setReviewClaim(null)}
          claim={reviewClaim}
          offer={reviewOffer}
          business={reviewBiz}
        />
      )}
    </div>
  );
}
