import { useMemo } from "react";
import { useApp } from "../app/providers";
import { getBusinessReviews } from "../services/reviewService";
import { PageHero } from "../components/layout/PageHero";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { BusinessReviews } from "../components/businesses/BusinessReviews";
import { RatingBreakdown } from "../components/business/RatingBreakdown";
import { NoBusiness } from "../components/business/NoBusiness";

export function BusinessReviewsPage() {
  const { data, activeBusiness } = useApp();

  const reviews = useMemo(
    () => (activeBusiness ? getBusinessReviews(activeBusiness.id, data.reviews) : []),
    [activeBusiness, data.reviews]
  );

  if (!activeBusiness) return <NoBusiness />;

  return (
    <>
      <PageHero variant="compact" kicker="Business" title="Reviews"
        subtitle={`Verified customer feedback for ${activeBusiness.name}.`}
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon="reviews"
          title="No reviews yet"
          body="Reviews unlock for customers after they redeem an offer, then appear here."
        />
      ) : (
        <div className="reviews-columns">
          <Card variant="inset">
            <RatingBreakdown reviews={reviews} />
          </Card>
          <Card variant="inset">
            <BusinessReviews reviews={reviews} users={data.users} />
          </Card>
        </div>
      )}
    </>
  );
}
