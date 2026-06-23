import { useMemo, useState } from "react";
import type { Business, Claim, NeedType, Offer, PersonalRanking } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { getUserClaims } from "../services/claimService";
import { createReview, updateBusinessRating } from "../services/reviewService";
import { upsertRanking } from "../services/rankingService";
import { byDate } from "../utils/sorting";
import { relativeTime } from "../utils/formatting";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { ReviewModal, type ReviewDraft } from "../components/reviews/ReviewModal";
import { PairwiseModal } from "../components/reviews/PairwiseModal";

/** Context needed to drive the review + pairwise flow for one redeemed claim. */
type ReviewTarget = { claim: Claim; offer: Offer; business: Business };
type PairwiseTarget = { business: Business; needType?: NeedType };

/**
 * Picks the most useful existing ranking list for a category so the pairwise
 * comparison has something to compare against (the longest list yields the
 * richest demo). Returns its needType, or undefined when none exists yet.
 */
function pickRankingNeedType(
  userId: string,
  category: Business["category"],
  rankings: PersonalRanking[]
): NeedType | undefined {
  const candidates = rankings
    .filter((r) => r.userId === userId && r.category === category)
    .sort((a, b) => b.rankedBusinessIds.length - a.rankedBusinessIds.length);
  return candidates[0]?.needType;
}

type Tab = "active" | "redeemed" | "past";

const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "redeemed", label: "Redeemed" },
  { id: "past", label: "Expired" },
];

const DATE_FMT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

export function ClaimsPage() {
  const { data, setData, activeUser } = useApp();
  const [tab, setTab] = useState<Tab>("active");
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [pairwiseTarget, setPairwiseTarget] = useState<PairwiseTarget | null>(null);

  const claims = useMemo(
    () => [...getUserClaims(activeUser.id, data.claims)].sort(byDate((c) => c.createdAt, "desc")),
    [data.claims, activeUser.id]
  );
  const offerById = useMemo(() => new Map(data.offers.map((o) => [o.id, o])), [data.offers]);
  const bizById = useMemo(() => new Map(data.businesses.map((b) => [b.id, b])), [data.businesses]);
  const reviewedClaimIds = useMemo(
    () => new Set(data.reviews.map((r) => r.claimId)),
    [data.reviews]
  );

  const byTab: Record<Tab, Claim[]> = {
    active: claims.filter((c) => c.status === "active"),
    redeemed: claims.filter((c) => c.status === "redeemed"),
    past: claims.filter((c) => c.status === "expired" || c.status === "cancelled"),
  };

  const cancelClaim = (claim: Claim) => {
    setData((prev) => ({
      ...prev,
      claims: prev.claims.map((c) => (c.id === claim.id ? { ...c, status: "cancelled" } : c)),
      offers: prev.offers.map((o) =>
        o.id === claim.offerId ? { ...o, currentClaims: Math.max(0, o.currentClaims - 1) } : o
      ),
    }));
  };

  const openReview = (claim: Claim) => {
    const offer = offerById.get(claim.offerId);
    const business = bizById.get(claim.businessId);
    if (offer && business) setReviewTarget({ claim, offer, business });
  };

  const submitReview = (draft: ReviewDraft): string | null => {
    if (!reviewTarget) return "Something went wrong. Try again.";
    const { claim, offer, business } = reviewTarget;
    const result = createReview(
      {
        userId: activeUser.id,
        businessId: business.id,
        offerId: offer.id,
        claimId: claim.id,
        rating: draft.rating,
        text: draft.text,
        tags: draft.tags,
      },
      data.claims,
      data.reviews
    );
    if (!result.ok) return result.error;

    const review = result.review;
    setData((prev) => {
      const nextReviews = [...prev.reviews, review];
      return {
        ...prev,
        reviews: nextReviews,
        businesses: prev.businesses.map((b) =>
          b.id === business.id ? updateBusinessRating(business.id, nextReviews, b) : b
        ),
      };
    });

    // Refresh the business with its new rating, then move on to pairwise ranking.
    const updatedBusiness = updateBusinessRating(business.id, [...data.reviews, review], business);
    setReviewTarget(null);
    setPairwiseTarget({
      business: updatedBusiness,
      needType: pickRankingNeedType(activeUser.id, business.category, data.rankings),
    });
    return null;
  };

  const completePairwise = (ranking: PersonalRanking) => {
    setData((prev) => ({ ...prev, rankings: upsertRanking(prev.rankings, ranking) }));
    setPairwiseTarget(null);
  };

  const list = byTab[tab];

  return (
    <>
      <PageHeader eyebrow="Claims" title="Your claims" subtitle="Track active codes, redeemed visits, and past claims." />

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? "tab--on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="tab__count">{byTab[t.id].length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="claims"
          title={`No ${tab === "past" ? "past" : tab} claims`}
          body={
            tab === "active"
              ? "Claim an offer from your matches to get a redemption code."
              : "Claims you redeem or that expire will show up here."
          }
          actions={
            tab === "active" ? (
              <Button onClick={() => navigate("/create-ping")} iconLeft={<Icon name="ping" size={16} />}>
                Create a Ping
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="claim-cards">
          {list.map((claim) => {
            const offer = offerById.get(claim.offerId);
            const business = bizById.get(claim.businessId);
            const reviewed = reviewedClaimIds.has(claim.id);
            return (
              <Card key={claim.id} className="claim-card">
                <div className="claim-card__main">
                  <div>
                    <h3 className="claim-card__title">{offer?.title ?? "Offer"}</h3>
                    <p className="claim-card__biz">{business?.name}</p>
                  </div>
                  <span className="claim-card__code mono">{claim.claimCode}</span>
                </div>

                <div className="claim-card__foot">
                  {claim.status === "active" && (
                    <>
                      <span className="claim-card__time">
                        <Icon name="clock" size={14} /> Expires {relativeTime(claim.expiresAt)}
                      </span>
                      <div className="row" style={{ gap: "var(--space-2)" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          title="Directions are mocked for this demo"
                          iconLeft={<Icon name="location" size={14} />}
                          onClick={() => business && navigate(`/business/profile?b=${business.id}`)}
                        >
                          Directions
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => cancelClaim(claim)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}

                  {claim.status === "redeemed" && (
                    <>
                      <span className="claim-card__time">
                        <Icon name="check" size={14} /> Redeemed{" "}
                        {claim.redeemedAt
                          ? new Date(claim.redeemedAt).toLocaleDateString("en-US", DATE_FMT)
                          : ""}
                      </span>
                      {reviewed ? (
                        <Badge tone="success">Reviewed</Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openReview(claim)}
                          iconLeft={<Icon name="reviews" size={14} />}
                        >
                          Leave a review
                        </Button>
                      )}
                    </>
                  )}

                  {(claim.status === "expired" || claim.status === "cancelled") && (
                    <>
                      <span className="claim-card__time claim-card__time--muted">
                        {claim.status === "cancelled" ? "Cancelled" : "Expired"}{" "}
                        {new Date(claim.expiresAt).toLocaleDateString("en-US", DATE_FMT)}
                      </span>
                      <Button variant="secondary" size="sm" onClick={() => navigate("/explore")}>
                        Find similar
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          open
          offer={reviewTarget.offer}
          business={reviewTarget.business}
          onClose={() => setReviewTarget(null)}
          onSubmit={submitReview}
        />
      )}

      {pairwiseTarget && (
        <PairwiseModal
          open
          userId={activeUser.id}
          newBusiness={pairwiseTarget.business}
          category={pairwiseTarget.business.category}
          needType={pairwiseTarget.needType}
          rankings={data.rankings}
          businesses={data.businesses}
          onComplete={completePairwise}
          onClose={() => setPairwiseTarget(null)}
        />
      )}
    </>
  );
}
