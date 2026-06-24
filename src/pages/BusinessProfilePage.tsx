import { useMemo } from "react";
import type { BusinessHours } from "../models";
import { useApp } from "../app/providers";
import { navigate, useHashRoute } from "../app/navigation";
import { useOfferInteractions } from "../app/useOfferInteractions";
import { getOriginPoint } from "../services/offerMatchingService";
import { getActiveOffersForBusiness, activeDealCount } from "../services/businessService";
import { getBusinessReviews } from "../services/reviewService";
import { distanceKm } from "../utils/distance";
import { byNumber } from "../utils/sorting";
import { businessImageUrl } from "../utils/businessVisuals";
import { CATEGORY_META } from "../data/catalog";
import { formatDistance } from "../utils/formatting";
import { PageHero } from "../components/layout/PageHero";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { Button } from "../components/common/Button";
import { StarRating } from "../components/common/StarRating";
import { ScrollRail } from "../components/common/ScrollRail";
import { OfferCard } from "../components/offers/OfferCard";
import { ClaimResultModal } from "../components/offers/ClaimResultModal";
import { BusinessCard } from "../components/businesses/BusinessCard";
import { BusinessReviews } from "../components/businesses/BusinessReviews";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRICE_LEVEL = ["", "$", "$$", "$$$", "$$$$"];

/** "09:00" -> "9:00 AM" for human-readable hours. */
function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** Compresses weekly hours into "Mon-Fri - 9:00 AM - 7:00 PM" lines. */
function formatHours(hours: BusinessHours[]): string[] {
  const groups = new Map<string, number[]>();
  for (const h of hours) {
    const key = `${h.openTime}-${h.closeTime}`;
    groups.set(key, [...(groups.get(key) ?? []), h.dayOfWeek]);
  }
  const lines: string[] = [];
  for (const [key, days] of groups) {
    const sorted = [...days].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
        continue;
      }
      ranges.push(start === prev ? DAYS[start] : `${DAYS[start]}-${DAYS[prev]}`);
      start = sorted[i];
      prev = sorted[i];
    }
    const [open, close] = key.split("-");
    lines.push(`${ranges.join(", ")} - ${formatClock(open)} - ${formatClock(close)}`);
  }
  return lines;
}

export function BusinessProfilePage() {
  const { data, activeUser } = useApp();
  const { query } = useHashRoute();
  const interactions = useOfferInteractions();

  const requestedId = query.get("b");
  const business = useMemo(() => {
    if (requestedId) return data.businesses.find((b) => b.id === requestedId);
    // Owner viewing their own profile; otherwise no specific business.
    return data.businesses.find((b) => b.ownerUserId === activeUser.id);
  }, [requestedId, data.businesses, activeUser.id]);

  const origin = useMemo(() => getOriginPoint(activeUser), [activeUser]);

  if (!business) {
    return (
      <>
        <PageHero variant="compact" kicker="Business profile" title="Business details" />
        <EmptyState
          icon="store"
          title="No business selected"
          body="Open a business from Explore or your matches to see its full profile."
          actions={
            <Button onClick={() => navigate("/explore")} iconLeft={<Icon name="explore" size={16} />}>
              Browse businesses
            </Button>
          }
        />
      </>
    );
  }

  const distance = distanceKm(origin, business.location);
  const offers = getActiveOffersForBusiness(business.id, data.offers);
  const reviews = getBusinessReviews(business.id, data.reviews);
  const hasStudentOffer = offers.some((o) => o.studentOnly || o.tags.includes("student-friendly"));
  const similar = data.businesses
    .filter((b) => b.category === business.category && b.id !== business.id)
    .sort(byNumber((b) => b.ratingAverage, "desc"))
    .slice(0, 3);
  const saved = interactions.isBusinessSaved(business.id);

  return (
    <>
      <div className="profile-hero">
        <img
          className="profile-hero__image"
          src={businessImageUrl(business)}
          alt={`${business.name} storefront`}
        />
        <div className="profile-hero__scrim" aria-hidden />
        <div className="profile-hero__content">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: "var(--space-4)" }}>
            <div>
              <div className="row" style={{ gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                <h1>{business.name}</h1>
                {business.verified && (
                  <span className="verified-tag verified-tag--lg" title="Verified local business">
                    <Icon name="check" size={13} /> Verified
                  </span>
                )}
              </div>
              <p style={{ opacity: 0.85, marginBottom: "var(--space-2)" }}>
                {CATEGORY_META[business.category].label} - {PRICE_LEVEL[business.priceLevel]}
              </p>
              <div className="row" style={{ gap: "var(--space-4)" }}>
                <StarRating value={business.ratingAverage} reviewCount={business.reviewCount} size={16} />
                <span className="row" style={{ gap: "var(--space-1)", opacity: 0.9 }}>
                  <Icon name="location" size={15} /> {formatDistance(distance)} away
                </span>
              </div>
            </div>
            <Button
              variant={saved ? "secondary" : "primary"}
              onClick={() => interactions.toggleSaveBusiness(business.id)}
              aria-pressed={saved}
              iconLeft={<Icon name="saved" size={16} />}
            >
              {saved ? "Saved" : "Save business"}
            </Button>
          </div>
        </div>
      </div>

      <p className="profile-intro">{business.description}</p>

      <nav className="profile-sticky-nav">
        <a href="#offers">Offers</a>
        <a href="#details">Details</a>
        <a href="#reviews">Reviews</a>
      </nav>

      <section id="offers" className="profile-section">
        <h2 className="section-title">Active offers</h2>
        {offers.length === 0 ? (
          <EmptyState icon="offers" title="No active offers right now" body="Check back soon for new deals." />
        ) : (
          <ScrollRail>
            {offers.map((offer) => (
              <div key={offer.id} className="scroll-rail__item">
                <OfferCard
                  offer={offer}
                  business={business}
                  distanceKm={distance}
                  saved={interactions.isOfferSaved(offer.id)}
                  claimState={interactions.claimStateFor(offer)}
                  onClaim={() => interactions.claim(offer)}
                  onToggleSave={() => interactions.toggleSaveOffer(offer.id)}
                  onViewBusiness={() => undefined}
                />
              </div>
            ))}
          </ScrollRail>
        )}
      </section>

      <div className="profile-columns">
        <section id="reviews" className="profile-section">
          <h2 className="section-title">Reviews</h2>
          <BusinessReviews reviews={reviews} users={data.users} />
        </section>

        <aside id="details" className="profile-section">
          <h2 className="section-title">Details</h2>
          <Card className="detail-card">
            <div className="detail-row">
              <span className="detail-row__label">Address</span>
              <span>{business.address}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Hours</span>
              <span>
                {formatHours(business.hours).map((line) => (
                  <span key={line} className="detail-hours-line">
                    {line}
                  </span>
                ))}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Student deals</span>
              <span>{hasStudentOffer ? "Available" : "Not currently"}</span>
            </div>
            {business.tags.length > 0 && (
              <div className="detail-row">
                <span className="detail-row__label">Tags</span>
                <span className="chip-row">
                  {business.tags.map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                </span>
              </div>
            )}
            {business.accessibilityFeatures.length > 0 && (
              <div className="detail-row">
                <span className="detail-row__label">Accessibility</span>
                <span className="chip-row">
                  {business.accessibilityFeatures.map((feature) => (
                    <Badge key={feature} tone="accent">
                      {feature}
                    </Badge>
                  ))}
                </span>
              </div>
            )}
          </Card>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="profile-section">
          <h2 className="section-title">Similar businesses</h2>
          <div className="biz-grid">
            {similar.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                distanceKm={distanceKm(origin, b.location)}
                dealCount={activeDealCount(b.id, data.offers)}
                saved={interactions.isBusinessSaved(b.id)}
                onToggleSave={() => interactions.toggleSaveBusiness(b.id)}
                onView={() => navigate(`/business/profile?b=${b.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      <ClaimResultModal outcome={interactions.claimOutcome} onClose={interactions.dismissClaim} />
    </>
  );
}
