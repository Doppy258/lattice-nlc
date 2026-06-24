import { useMemo, useState } from "react";
import type { MatchResult, PingRequest } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { useOfferInteractions } from "../app/useOfferInteractions";
import { getMatchingOffers, getOriginPoint } from "../services/offerMatchingService";
import { distanceKm } from "../utils/distance";
import { byDate } from "../utils/sorting";
import { NEED_TYPE_LABELS } from "../data/catalog";
import { PageHero } from "../components/layout/PageHero";
import { FilterBar } from "../components/common/FilterBar";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { OfferCard } from "../components/offers/OfferCard";
import { ClaimResultModal } from "../components/offers/ClaimResultModal";

type SortKey =
  | "bestMatch"
  | "highestRating"
  | "closest"
  | "lowestPrice"
  | "endingSoon"
  | "mostClaimed";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "bestMatch", label: "Best match" },
  { key: "highestRating", label: "Top rated" },
  { key: "closest", label: "Nearest" },
  { key: "lowestPrice", label: "Lowest price" },
  { key: "endingSoon", label: "Ending soon" },
];

const FILTERS: { id: string; label: string }[] = [
  { id: "activeDeals", label: "Active deals" },
  { id: "openNow", label: "Open in window" },
  { id: "studentDiscount", label: "Student" },
  { id: "verified", label: "Verified" },
  { id: "saved", label: "Saved" },
];

export function MatchesPage() {
  const { data, activeUser } = useApp();
  const interactions = useOfferInteractions();
  const [sortKey, setSortKey] = useState<SortKey>("bestMatch");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const request = useMemo<PingRequest | undefined>(() => {
    const mine = data.requests.filter((r) => r.userId === activeUser.id);
    return [...mine].sort(byDate((r) => r.createdAt, "desc"))[0];
  }, [data.requests, activeUser.id]);

  const offerById = useMemo(() => new Map(data.offers.map((o) => [o.id, o])), [data.offers]);
  const bizById = useMemo(() => new Map(data.businesses.map((b) => [b.id, b])), [data.businesses]);
  const origin = useMemo(() => getOriginPoint(activeUser), [activeUser]);

  const matches = useMemo<MatchResult[]>(
    () => (request ? getMatchingOffers(request, data.offers, data.businesses, activeUser) : []),
    [request, data.offers, data.businesses, activeUser]
  );

  const nearMisses = useMemo<MatchResult[]>(() => {
    if (!request || matches.length > 0) return [];
    const relaxed: PingRequest = { ...request, distanceKm: 50, budgetMax: undefined, preferences: [] };
    return getMatchingOffers(relaxed, data.offers, data.businesses, activeUser).slice(0, 3);
  }, [request, matches.length, data.offers, data.businesses, activeUser]);

  const toggleFilter = (id: string) =>
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  const visible = useMemo(() => {
    const rows = matches
      .map((match) => {
        const offer = offerById.get(match.offerId);
        const business = bizById.get(match.businessId);
        if (!offer || !business) return null;
        return { match, offer, business, distance: distanceKm(origin, business.location) };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const filtered = rows.filter(({ offer, business, match }) => {
      if (activeFilters.includes("activeDeals") && offer.originalPrice === undefined) return false;
      if (activeFilters.includes("openNow") && match.scoreBreakdown.timeScore <= 0) return false;
      if (
        activeFilters.includes("studentDiscount") &&
        !(offer.studentOnly || offer.tags.includes("student-friendly"))
      ) {
        return false;
      }
      if (activeFilters.includes("verified") && !business.verified) return false;
      if (
        activeFilters.includes("saved") &&
        !activeUser.preferences.savedBusinessIds.includes(business.id)
      ) {
        return false;
      }
      return true;
    });

    const sorters: Record<SortKey, (a: typeof filtered[number], b: typeof filtered[number]) => number> = {
      bestMatch: (a, b) => b.match.score - a.match.score,
      highestRating: (a, b) => b.business.ratingAverage - a.business.ratingAverage,
      closest: (a, b) => a.distance - b.distance,
      lowestPrice: (a, b) => a.offer.price - b.offer.price,
      endingSoon: (a, b) => Date.parse(a.offer.validUntil) - Date.parse(b.offer.validUntil),
      mostClaimed: (a, b) => b.offer.currentClaims - a.offer.currentClaims,
    };
    return [...filtered].sort(sorters[sortKey]);
  }, [matches, offerById, bizById, origin, activeFilters, sortKey, activeUser.preferences.savedBusinessIds]);

  if (!request) {
    return (
      <>
        <PageHero variant="compact" kicker="Matches" title="Your ranked offers" />
        <EmptyState
          variant="radar"
          title="No Ping yet"
          body="Create a Ping describing what you need and OfferRank will surface the best nearby offers."
          actionLabel="Create a Ping"
          onAction={() => navigate("/create-ping")}
        />
      </>
    );
  }

  const summary = [
    NEED_TYPE_LABELS[request.needType],
    request.budgetMax !== undefined ? `under $${request.budgetMax}` : "any budget",
    `within ${request.distanceKm} km`,
  ].join(" - ");

  const [top, ...rest] = visible;

  return (
    <>
      <PageHero
        variant="split"
        kicker="Matches"
        title="Your ranked offers"
        subtitle={summary}
        aside={
          matches.length > 0 ? (
            <div className="page-hero__stat-pill">
              <strong>{visible.length}</strong>
              <span>of {matches.length} matches</span>
            </div>
          ) : undefined
        }
        actions={
          <Button variant="secondary" onClick={() => navigate("/create-ping")} iconLeft={<Icon name="ping" size={16} />}>
            Edit request
          </Button>
        }
      />

      {matches.length > 0 && (
        <FilterBar
          segments={SORTS.map((s) => ({ id: s.key, label: s.label }))}
          activeSegment={sortKey}
          onSegmentChange={(id) => setSortKey(id as SortKey)}
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip ${activeFilters.includes(f.id) ? "chip--on" : ""}`}
              aria-pressed={activeFilters.includes(f.id)}
              onClick={() => toggleFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </FilterBar>
      )}

      {matches.length === 0 ? (
        <EmptyState
          variant="radar"
          title="No exact matches found"
          body="Try increasing your distance, raising your budget, or changing your time window."
          actionLabel="Adjust your Ping"
          onAction={() => navigate("/create-ping")}
        />
      ) : (
        <div className="offer-grid">
          {top && (
            <OfferCard
              key={top.offer.id}
              featured
              offer={top.offer}
              business={top.business}
              distanceKm={top.distance}
              match={top.match}
              saved={interactions.isOfferSaved(top.offer.id)}
              claimState={interactions.claimStateFor(top.offer)}
              onClaim={() => interactions.claim(top.offer)}
              onToggleSave={() => interactions.toggleSaveOffer(top.offer.id)}
              onViewBusiness={() => navigate(`/business/profile?b=${top.business.id}`)}
            />
          )}
          {rest.map(({ match, offer, business, distance }) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              business={business}
              distanceKm={distance}
              match={match}
              saved={interactions.isOfferSaved(offer.id)}
              claimState={interactions.claimStateFor(offer)}
              onClaim={() => interactions.claim(offer)}
              onToggleSave={() => interactions.toggleSaveOffer(offer.id)}
              onViewBusiness={() => navigate(`/business/profile?b=${business.id}`)}
            />
          ))}
        </div>
      )}

      {matches.length === 0 && nearMisses.length > 0 && (
        <section className="near-misses">
          <h2 className="section-title">Similar offers nearby</h2>
          <div className="offer-grid">
            {nearMisses.map((match) => {
              const offer = offerById.get(match.offerId)!;
              const business = bizById.get(match.businessId)!;
              return (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  business={business}
                  distanceKm={distanceKm(origin, business.location)}
                  match={match}
                  saved={interactions.isOfferSaved(offer.id)}
                  claimState={interactions.claimStateFor(offer)}
                  onClaim={() => interactions.claim(offer)}
                  onToggleSave={() => interactions.toggleSaveOffer(offer.id)}
                  onViewBusiness={() => navigate(`/business/profile?b=${business.id}`)}
                />
              );
            })}
          </div>
        </section>
      )}

      <ClaimResultModal outcome={interactions.claimOutcome} onClose={interactions.dismissClaim} />
    </>
  );
}
