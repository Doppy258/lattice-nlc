import { useMemo, useState } from "react";
import type { Business, Offer } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { useOfferInteractions } from "../app/useOfferInteractions";
import { getOriginPoint } from "../services/offerMatchingService";
import { activeDealCount } from "../services/businessService";
import { distanceKm } from "../utils/distance";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { BusinessCard } from "../components/businesses/BusinessCard";
import { OfferCard } from "../components/offers/OfferCard";
import { ClaimResultModal } from "../components/offers/ClaimResultModal";

type Tab = "businesses" | "offers";
type BizSort = "recent" | "rating" | "distance" | "deals" | "category";
type OfferSort = "endingSoon" | "savings" | "rating" | "category";

const BIZ_SORTS: { key: BizSort; label: string }[] = [
  { key: "recent", label: "Recently saved" },
  { key: "rating", label: "Highest rating" },
  { key: "distance", label: "Closest" },
  { key: "deals", label: "Active deals" },
  { key: "category", label: "Category" },
];

const OFFER_SORTS: { key: OfferSort; label: string }[] = [
  { key: "endingSoon", label: "Ending soon" },
  { key: "savings", label: "Highest savings" },
  { key: "rating", label: "Business rating" },
  { key: "category", label: "Category" },
];

export function SavedPage() {
  const { data, activeUser } = useApp();
  const interactions = useOfferInteractions();
  const [tab, setTab] = useState<Tab>("businesses");
  const [bizSort, setBizSort] = useState<BizSort>("recent");
  const [offerSort, setOfferSort] = useState<OfferSort>("endingSoon");

  const origin = useMemo(() => getOriginPoint(activeUser), [activeUser]);
  const bizById = useMemo(() => new Map(data.businesses.map((b) => [b.id, b])), [data.businesses]);

  const savedAtById = useMemo(() => {
    const map = new Map<string, string>();
    data.savedBusinesses
      .filter((s) => s.userId === activeUser.id)
      .forEach((s) => map.set(s.businessId, s.savedAt));
    return map;
  }, [data.savedBusinesses, activeUser.id]);

  const savedBusinesses = useMemo(() => {
    const list = activeUser.preferences.savedBusinessIds
      .map((id) => bizById.get(id))
      .filter((b): b is Business => Boolean(b));
    const sorters: Record<BizSort, (a: Business, b: Business) => number> = {
      recent: (a, b) =>
        Date.parse(savedAtById.get(b.id) ?? "0") - Date.parse(savedAtById.get(a.id) ?? "0"),
      rating: (a, b) => b.ratingAverage - a.ratingAverage,
      distance: (a, b) => distanceKm(origin, a.location) - distanceKm(origin, b.location),
      deals: (a, b) => activeDealCount(b.id, data.offers) - activeDealCount(a.id, data.offers),
      category: (a, b) => a.category.localeCompare(b.category),
    };
    return [...list].sort(sorters[bizSort]);
  }, [activeUser.preferences.savedBusinessIds, bizById, savedAtById, bizSort, origin, data.offers]);

  const savedOffers = useMemo(() => {
    const list = activeUser.preferences.savedOfferIds
      .map((id) => data.offers.find((o) => o.id === id))
      .filter((o): o is Offer => Boolean(o));
    const savingsOf = (o: Offer) => (o.originalPrice ? o.originalPrice - o.price : 0);
    const ratingOf = (o: Offer) => bizById.get(o.businessId)?.ratingAverage ?? 0;
    const sorters: Record<OfferSort, (a: Offer, b: Offer) => number> = {
      endingSoon: (a, b) => Date.parse(a.validUntil) - Date.parse(b.validUntil),
      savings: (a, b) => savingsOf(b) - savingsOf(a),
      rating: (a, b) => ratingOf(b) - ratingOf(a),
      category: (a, b) => a.category.localeCompare(b.category),
    };
    return [...list].sort(sorters[offerSort]);
  }, [activeUser.preferences.savedOfferIds, data.offers, bizById, offerSort]);

  const empty =
    (tab === "businesses" && savedBusinesses.length === 0) ||
    (tab === "offers" && savedOffers.length === 0);

  return (
    <>
      <PageHeader
        eyebrow="Saved"
        title="Saved businesses & offers"
        subtitle="Everything you've bookmarked, in one place."
      />

      <div className="saved-controls">
        <div className="tabs" role="tablist">
          {(["businesses", "offers"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`tab ${tab === t ? "tab--on" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "businesses" ? "Businesses" : "Offers"}
              <span className="tab__count">
                {t === "businesses" ? savedBusinesses.length : savedOffers.length}
              </span>
            </button>
          ))}
        </div>

        {!empty && (
          <label className="sort-control">
            <span>Sort</span>
            {tab === "businesses" ? (
              <select
                className="select-input"
                value={bizSort}
                onChange={(e) => setBizSort(e.target.value as BizSort)}
              >
                {BIZ_SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="select-input"
                value={offerSort}
                onChange={(e) => setOfferSort(e.target.value as OfferSort)}
              >
                {OFFER_SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        )}
      </div>

      {empty ? (
        <EmptyState
          icon="saved"
          title="Nothing saved yet"
          body="You have not saved any businesses or offers yet. Explore local businesses or create a Ping to find offers."
          actions={undefined}
        />
      ) : tab === "businesses" ? (
        <div className="biz-grid">
          {savedBusinesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              distanceKm={distanceKm(origin, business.location)}
              dealCount={activeDealCount(business.id, data.offers)}
              saved={interactions.isBusinessSaved(business.id)}
              onToggleSave={() => interactions.toggleSaveBusiness(business.id)}
              onView={() => navigate(`/business/profile?b=${business.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="offer-grid">
          {savedOffers.map((offer) => {
            const business = bizById.get(offer.businessId);
            if (!business) return null;
            return (
              <OfferCard
                key={offer.id}
                offer={offer}
                business={business}
                distanceKm={distanceKm(origin, business.location)}
                saved={interactions.isOfferSaved(offer.id)}
                claimState={interactions.claimStateFor(offer)}
                onClaim={() => interactions.claim(offer)}
                onToggleSave={() => interactions.toggleSaveOffer(offer.id)}
                onViewBusiness={() => navigate(`/business/profile?b=${business.id}`)}
              />
            );
          })}
        </div>
      )}

      <ClaimResultModal outcome={interactions.claimOutcome} onClose={interactions.dismissClaim} />
    </>
  );
}
