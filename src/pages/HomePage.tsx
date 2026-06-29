/**
 * HomePage — route: /home
 *
 * Customer landing page after login. Shows a greeting and a personalised feed
 * of recommended live offers, plus a claim/savings insight summary and a
 * geolocation prompt. A Lattice is an ephemeral search — its ranked results
 * live on the matches page, so nothing here persists as an "active" session.
 */

import { useMemo } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { PageHero } from "@/components/common/PageHeader";
import { InsightSummary } from "@/components/common/InsightSummary";
import { EmptyState } from "@/components/common/EmptyState";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { OfferCard } from "@/components/domain/OfferCard";
import { LocationBar } from "@/components/common/LocationBar";
import { useClaim } from "@/components/domain/useClaim";
import { ClaimResultModal } from "@/components/domain/ClaimResultModal";
import { BotCheckModal } from "@/components/domain/BotCheckModal";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getOriginPoint } from "@/services/offerMatchingService";
import { distanceForBusiness } from "@/services/businessService";
import { isOfferSaved, toggleSavedOffer } from "@/services/userService";
import { formatCurrency } from "@/utils/formatting";
import { offerSavingsPerRedemption } from "@/utils/offerPricing";
import type { Offer } from "@/models";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function HomePage() {
  const { data, activeUser, setData } = useApp();
  const { claim, result, clearResult, pendingClaim, confirmClaim, cancelClaim } = useClaim();
  const geolocation = useUserLocation();
  const origin = getOriginPoint(activeUser);
  const firstName = activeUser.name.split(" ")[0];

  const now = Date.now();
  const activeOffers = useMemo(
    () => data.offers.filter((o) => o.active && Date.parse(o.validUntil) >= now),
    [data.offers, now],
  );

  const prefCategories = activeUser.preferences.preferredCategories;
  const prefStudent = activeUser.preferences.studentDiscountPreferred;
  // Whether the feed is personalised from onboarding interests.
  const personalized = prefCategories.length > 0 || prefStudent;

  // A Lattice is an ephemeral search — its ranked results live on the matches
  // page, not here. The home feed is always a fresh set of live offers, ordered
  // by the interests + student preference captured during onboarding, then savings.
  const featured = useMemo(() => {
    const affinity = (o: Offer) =>
      (prefCategories.includes(o.category) ? 1000 : 0) +
      (prefStudent && o.studentOnly ? 300 : 0) +
      offerSavingsPerRedemption(o);
    return activeOffers
      .slice()
      .sort((a, b) => affinity(b) - affinity(a))
      .slice(0, 6)
      .map((offer) => ({ offer }));
  }, [activeOffers, prefCategories, prefStudent]);

  const myClaims = data.claims.filter((c) => c.userId === activeUser.id);
  const activeClaimCount = myClaims.filter((c) => c.status === "pending").length;
  const redeemedClaimCount = myClaims.filter((c) => c.status === "redeemed").length;
  const savedCount =
    activeUser.preferences.savedBusinessIds.length + activeUser.preferences.savedOfferIds.length;
  const estimatedSaved = useMemo(() => {
    return myClaims
      .filter((c) => c.status === "redeemed")
      .reduce((sum, c) => {
        const offer = data.offers.find((o) => o.id === c.offerId);
        return offer ? sum + offerSavingsPerRedemption(offer) : sum;
      }, 0);
  }, [myClaims, data.offers]);

  const businessFor = (offer: Offer) => data.businesses.find((b) => b.id === offer.businessId);

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Icon name="location" size={13} />
            {activeUser.location ? "Using your location" : "Set your location for nearby offers"}
          </span>
        }
        title="What do you need"
        accent="nearby?"
        subtitle={`${greeting()}, ${firstName}. Tell Lattice what you need and we'll match you with verified local offers — by budget, timing, distance, and your preferences.`}
        actions={
          <>
            <Button variant="brand" size="lg" iconLeft={<Icon name="ping" size={18} />} onClick={() => navigate("/create")}>
              Create a Lattice
            </Button>
            <Button variant="secondary" size="lg" iconLeft={<Icon name="explore" size={18} />} onClick={() => navigate("/explore")}>
              Explore businesses
            </Button>
          </>
        }
        aside={
          <InsightSummary
            title="Today on Lattice"
            columns="three"
            className="w-full bg-card/55 shadow-none lg:w-[420px]"
            items={[
              {
                label: "Claims",
                value: myClaims.length,
                detail:
                  activeClaimCount > 0
                    ? `${activeClaimCount} ready to redeem`
                    : redeemedClaimCount > 0
                      ? `${redeemedClaimCount} redeemed`
                      : "Offers you've claimed",
              },
              {
                label: "Saved",
                value: savedCount,
                detail:
                  redeemedClaimCount > 0
                    ? `${formatCurrency(estimatedSaved)} saved from visits`
                    : "Places and offers",
              },
              {
                label: "Live offers",
                value: activeOffers.length,
                detail: "Live now",
              },
            ]}
          />
        }
      />

      <LocationBar geo={geolocation} hasLocation={!!activeUser.location} purpose="nearby offers" />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.03em]">
              {personalized ? "Picked " : "Fresh offers "}
              <span className="font-accent font-normal text-primary">
                {personalized ? "for you" : "nearby"}
              </span>
            </h2>
            <p className="text-[14px] text-muted-foreground">
              {personalized
                ? "Based on the interests you chose during setup."
                : "Popular active deals from local businesses."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/explore")}
            className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-accent sm:flex"
          >
            See all <Icon name="arrow" size={15} />
          </button>
        </div>

        {featured.length === 0 ? (
          <EmptyState
            icon="ticket"
            title="No active offers yet"
            body="Create a Lattice to get matched with local businesses."
            action={
              <Button variant="brand" onClick={() => navigate("/create")} iconLeft={<Icon name="ping" size={17} />}>
                Create a Lattice
              </Button>
            }
          />
        ) : (
          <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map(({ offer }) => {
              const business = businessFor(offer);
              if (!business) return null;
              return (
                <StaggerItem key={offer.id}>
                  <OfferCard
                    offer={offer}
                    business={business}
                    distanceKm={distanceForBusiness(business, origin)}
                    saved={isOfferSaved(activeUser, offer.id)}
                    onClaim={(o) => claim(o)}
                    onSave={(o) => setData((d) => toggleSavedOffer(d, activeUser.id, o.id))}
                    onView={(b) => navigate(`/business?id=${b.id}`)}
                  />
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </section>

      <ClaimResultModal result={result} onClose={clearResult} />
      <BotCheckModal
        open={!!pendingClaim}
        onOpenChange={(o) => !o && cancelClaim()}
        onVerified={confirmClaim}
        description="Confirm you're human before claiming this offer."
      />
    </div>
  );
}
