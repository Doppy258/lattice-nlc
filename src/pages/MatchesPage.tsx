import { useMemo, useState } from "react";
import type { MatchResult, PingRequest } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { useOfferInteractions } from "../app/useOfferInteractions";
import { getMatchingOffers, getOriginPoint } from "../services/offerMatchingService";
import { distanceKm } from "../utils/distance";
import { byDate } from "../utils/sorting";
import { NEED_TYPE_LABELS } from "../data/catalog";
import { PageHeader } from "../components/layout/PageHeader";
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
  { key: "highestRating", label: "Highest rating" },
  { key: "closest", label: "Closest" },
  { key: "lowestPrice", label: "Lowest price" },
  { key: "endingSoon", label: "Ending soon" },
  { key: "mostClaimed", label: "Most claimed" },
];

const FILTERS: { id: string; label: string }[] = [
  { id: "activeDeals", label: "Active deals" },
  { id: "openNow", label: "Open in window" },
  { id: "studentDiscount", label: "Student discount" },
  { id: "verified", label: "Verified" },
  { id: "saved", label: "Saved businesses" },
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
        <PageHeader eyebrow="Matches" title="Your ranked offers" />
        <EmptyState
          icon="matches"
          title="No Ping yet"
          body="Create a Ping describing what you need and OfferRank will surface the best nearby offers."
          actions={
            <Button onClick={() => navigate("/create-ping")} iconLeft={<Icon name="ping" size={16} />}>
              Create a Ping
            </Button>
          }
        />
      </>
    );
  }

  const summary = [
    NEED_TYPE_LABELS[request.needType],
    request.budgetMax !== undefined ? `under $${request.budgetMax}` : "any budget",
    `within ${request.distanceKm} km`,
  ].join(" · ");

  return (
    <>
      <PageHeader
        eyebrow="Matches"
        title="Your ranked offers"
        subtitle={summary}
        actions={
          <Button variant="secondary" onClick={() => navigate("/create-ping")} iconLeft={<Icon name="ping" size={16} />}>
            Edit request
          </Button>
        }
      />

      {matches.length > 0 && (
        <div className="matches-toolbar">
          <div className="matches-toolbar__count">
            <strong>{visible.length}</strong> of {matches.length} matching offer
            {matches.length === 1 ? "" : "s"}
          </div>
          <label className="sort-control">
            <span>Sort</span>
            <select
              className="select-input"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {matches.length > 0 && (
        <div className="chip-row matches-filters">
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
        </div>
      )}

      {matches.length === 0 ? (
        <EmptyState
          icon="matches"
          title="No exact matches found"
          body="Try increasing your distance, raising your budget, or changing your time window. Here are a few near misses worth a look."
          actions={
            <Button onClick={() => navigate("/create-ping")} iconLeft={<Icon name="ping" size={16} />}>
              Adjust your Ping
            </Button>
          }
        />
      ) : (
        <div className="offer-grid">
          {visible.map(({ match, offer, business, distance }) => (
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
