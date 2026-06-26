import { useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { BusinessCard } from "@/components/domain/BusinessCard";
import { OfferCard } from "@/components/domain/OfferCard";
import { useClaim } from "@/components/domain/useClaim";
import { ClaimResultModal } from "@/components/domain/ClaimResultModal";
import { BotCheckModal } from "@/components/domain/BotCheckModal";
import { getOriginPoint } from "@/services/offerMatchingService";
import { activeDealCount, distanceForBusiness } from "@/services/businessService";
import { isOfferSaved, toggleSavedBusiness, toggleSavedOffer } from "@/services/userService";

type Tab = "businesses" | "offers";

export function SavedPage() {
  const { data, activeUser, setData } = useApp();
  const { claim, result, clearResult, pendingClaim, confirmClaim, cancelClaim } = useClaim();
  const origin = getOriginPoint(activeUser);
  const [tab, setTab] = useState<Tab>("businesses");

  const savedBusinesses = useMemo(
    () =>
      activeUser.preferences.savedBusinessIds
        .map((id) => data.businesses.find((b) => b.id === id))
        .filter((b): b is NonNullable<typeof b> => !!b),
    [activeUser.preferences.savedBusinessIds, data.businesses],
  );

  const savedOffers = useMemo(
    () =>
      activeUser.preferences.savedOfferIds
        .map((id) => data.offers.find((o) => o.id === id))
        .filter((o): o is NonNullable<typeof o> => !!o),
    [activeUser.preferences.savedOfferIds, data.offers],
  );

  const bizFor = (businessId: string) => data.businesses.find((b) => b.id === businessId);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Your"
        accent="saved list"
        subtitle="Businesses and offers you've bookmarked. Come back anytime to claim a deal or revisit a favourite spot."
      />

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: "businesses", label: `Businesses (${savedBusinesses.length})` },
          { value: "offers", label: `Offers (${savedOffers.length})` },
        ]}
      />

      {tab === "businesses" &&
        (savedBusinesses.length === 0 ? (
          <EmptyState
            icon="saved"
            title="No saved businesses"
            body="Tap the bookmark on any business to keep it here for later."
            action={
              <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/explore")}>
                Explore businesses
              </Button>
            }
          />
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {savedBusinesses.map((b) => (
              <StaggerItem key={b.id}>
                <BusinessCard
                  business={b}
                  activeDeals={activeDealCount(b.id, data.offers)}
                  distanceKm={distanceForBusiness(b, origin)}
                  saved
                  onSave={() => setData((d) => toggleSavedBusiness(d, activeUser.id, b.id))}
                  onOpen={() => navigate(`/business?id=${b.id}`)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ))}

      {tab === "offers" &&
        (savedOffers.length === 0 ? (
          <EmptyState
            icon="ticket"
            title="No saved offers"
            body="Save an offer from your matches to keep an eye on it here."
            action={
              <Button variant="brand" iconLeft={<Icon name="ping" size={17} />} onClick={() => navigate("/create")}>
                Create a Lattice
              </Button>
            }
          />
        ) : (
          <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savedOffers.map((offer) => {
              const business = bizFor(offer.businessId);
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
        ))}

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
