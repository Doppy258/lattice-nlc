import { useMemo } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { PageHero } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { EmptyState } from "@/components/common/EmptyState";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { OfferCard } from "@/components/domain/OfferCard";
import { useClaim } from "@/components/domain/useClaim";
import { ClaimResultModal } from "@/components/domain/ClaimResultModal";
import { getMatchingOffers, getOriginPoint } from "@/services/offerMatchingService";
import { distanceForBusiness } from "@/services/businessService";
import { isOfferSaved, toggleSavedOffer } from "@/services/userService";
import { DEMO_ORIGINS, NEED_TYPE_LABELS } from "@/data/catalog";
import { formatCurrency, formatDistance } from "@/utils/formatting";
import type { Offer, PingRequest } from "@/models";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function budgetLabel(r: PingRequest): string {
  if (r.budgetMax !== undefined) return `under ${formatCurrency(r.budgetMax)}`;
  if (r.budgetMin !== undefined) return `${formatCurrency(r.budgetMin)}+`;
  return "any budget";
}

export function HomePage() {
  const { data, activeUser, setData } = useApp();
  const { claim, result, clearResult } = useClaim();
  const origin = getOriginPoint(activeUser);
  const firstName = activeUser.name.split(" ")[0];
  const originName =
    DEMO_ORIGINS.find((o) => o.id === activeUser.homeLocationId)?.name ?? DEMO_ORIGINS[0].name;

  const now = Date.now();
  const activeOffers = useMemo(
    () => data.offers.filter((o) => o.active && Date.parse(o.validUntil) >= now),
    [data.offers, now],
  );

  const latestRequest = useMemo(() => {
    return data.requests
      .filter((r) => r.userId === activeUser.id && (r.status === "submitted" || r.status === "matched"))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  }, [data.requests, activeUser.id]);

  const matches = useMemo(() => {
    if (!latestRequest) return [];
    return getMatchingOffers(latestRequest, data.offers, data.businesses, activeUser).slice(0, 6);
  }, [latestRequest, data.offers, data.businesses, activeUser]);

  // Offers to feature: a request's top matches, else the biggest fresh savings.
  const featured = useMemo(() => {
    if (matches.length) {
      return matches.map((m) => ({
        offer: data.offers.find((o) => o.id === m.offerId)!,
        match: m,
      }));
    }
    return activeOffers
      .slice()
      .sort((a, b) => (b.originalPrice ?? b.price) - b.price - ((a.originalPrice ?? a.price) - a.price))
      .slice(0, 6)
      .map((offer) => ({ offer, match: undefined }));
  }, [matches, activeOffers, data.offers]);

  const myClaims = data.claims.filter((c) => c.userId === activeUser.id);
  const activeClaimCount = myClaims.filter((c) => c.status === "active").length;
  const savedCount =
    activeUser.preferences.savedBusinessIds.length + activeUser.preferences.savedOfferIds.length;
  const estimatedSaved = useMemo(() => {
    return myClaims
      .filter((c) => c.status === "redeemed")
      .reduce((sum, c) => {
        const offer = data.offers.find((o) => o.id === c.offerId);
        return offer?.originalPrice ? sum + (offer.originalPrice - offer.price) : sum;
      }, 0);
  }, [myClaims, data.offers]);

  const businessFor = (offer: Offer) => data.businesses.find((b) => b.id === offer.businessId);

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow={
          <>
            <Icon name="location" size={13} /> {originName}
          </>
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
      />

      {latestRequest && (
        <button
          type="button"
          onClick={() => navigate(`/matches?request=${latestRequest.id}`)}
          className="flex w-full cursor-pointer items-center gap-4 rounded-[var(--tile-radius)] border border-[var(--tint-blue-border)] bg-[var(--tint-blue)] p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.997]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card text-primary shadow-[var(--shadow-soft)]">
            <Icon name="matches" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge tone="brand">Active Lattice</Badge>
              <span className="text-[13px] text-muted-foreground">{matches.length} matches</span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {NEED_TYPE_LABELS[latestRequest.needType]} · {budgetLabel(latestRequest)} · within{" "}
              {latestRequest.distanceKm} km
            </p>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary sm:flex">
            View matches <Icon name="arrow" size={16} />
          </span>
        </button>
      )}

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile tone="blue" label="Active claims" value={activeClaimCount} icon={<Icon name="claims" size={17} />} sub="Ready to redeem" />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="mint" label="Est. saved" value={formatCurrency(estimatedSaved)} icon={<Icon name="reports" size={17} />} sub="From redeemed offers" />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="violet" label="Saved places" value={savedCount} icon={<Icon name="saved" size={17} />} sub="Businesses & offers" />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="amber" label="Offers nearby" value={activeOffers.length} icon={<Icon name="ticket" size={17} />} sub="Active right now" />
        </StaggerItem>
      </Stagger>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.03em]">
              {matches.length ? "Your top" : "Fresh offers"}{" "}
              <span className="font-accent font-normal text-primary">
                {matches.length ? "matches" : "nearby"}
              </span>
            </h2>
            <p className="text-[14px] text-muted-foreground">
              {matches.length
                ? "Ranked by OfferRank for your latest Lattice."
                : "Popular active deals from local businesses."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(latestRequest ? `/matches?request=${latestRequest.id}` : "/explore")}
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
            {featured.map(({ offer, match }) => {
              const business = businessFor(offer);
              if (!business) return null;
              return (
                <StaggerItem key={offer.id}>
                  <OfferCard
                    offer={offer}
                    business={business}
                    match={match}
                    distanceKm={distanceForBusiness(business, origin)}
                    saved={isOfferSaved(activeUser, offer.id)}
                    onClaim={(o) => claim(o, latestRequest?.id)}
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
    </div>
  );
}
