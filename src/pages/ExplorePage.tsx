import { useMemo, useState } from "react";
import type { BusinessCategory } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { useOfferInteractions } from "../app/useOfferInteractions";
import { getOriginPoint } from "../services/offerMatchingService";
import {
  activeDealCount,
  distanceForBusiness,
  filterBusinesses,
  sortBusinesses,
  type BusinessSort,
} from "../services/businessService";
import { ALL_CATEGORIES, CATEGORY_META } from "../data/catalog";
import { PageHeader } from "../components/layout/PageHeader";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { BusinessCard } from "../components/businesses/BusinessCard";

const SORTS: { key: BusinessSort; label: string }[] = [
  { key: "highestRating", label: "Highest rating" },
  { key: "mostReviews", label: "Most reviews" },
  { key: "closest", label: "Closest" },
  { key: "activeDeals", label: "Active deals" },
  { key: "alphabetical", label: "Alphabetical" },
  { key: "category", label: "Category" },
];

const RATING_OPTIONS = [
  { value: 0, label: "Any rating" },
  { value: 4, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
];

const DISTANCE_OPTIONS = [
  { value: 0, label: "Any distance" },
  { value: 1, label: "Within 1 km" },
  { value: 3, label: "Within 3 km" },
  { value: 5, label: "Within 5 km" },
  { value: 10, label: "Within 10 km" },
];

export function ExplorePage() {
  const { data, activeUser } = useApp();
  const interactions = useOfferInteractions();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [minRating, setMinRating] = useState(0);
  const [maxDistanceKm, setMaxDistanceKm] = useState(0);
  const [hasDeals, setHasDeals] = useState(false);
  const [sort, setSort] = useState<BusinessSort>("highestRating");

  const origin = useMemo(() => getOriginPoint(activeUser), [activeUser]);

  const results = useMemo(() => {
    const filtered = filterBusinesses(
      data.businesses,
      {
        query: query || undefined,
        category: category || undefined,
        minRating: minRating || undefined,
        maxDistanceKm: maxDistanceKm || undefined,
        hasDeals: hasDeals || undefined,
      },
      data.offers,
      origin
    );
    return sortBusinesses(filtered, sort, data.offers, origin);
  }, [data.businesses, data.offers, query, category, minRating, maxDistanceKm, hasDeals, sort, origin]);

  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Browse local businesses"
        subtitle="Search, filter, and sort nearby businesses, then bookmark the ones you like."
      />

      <div className="explore-toolbar">
        <label className="search-field">
          <Icon name="search" size={16} className="search-field__icon" />
          <input
            type="search"
            className="search-field__input"
            placeholder="Search businesses, tags, or descriptions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search businesses"
          />
        </label>

        <div className="explore-toolbar__selects">
          <select
            className="select-input"
            value={category}
            onChange={(e) => setCategory(e.target.value as BusinessCategory | "")}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>

          <select
            className="select-input"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            aria-label="Minimum rating"
          >
            {RATING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className="select-input"
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
            aria-label="Maximum distance"
          >
            {DISTANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className="select-input"
            value={sort}
            onChange={(e) => setSort(e.target.value as BusinessSort)}
            aria-label="Sort by"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`chip ${hasDeals ? "chip--on" : ""}`}
            aria-pressed={hasDeals}
            onClick={() => setHasDeals((v) => !v)}
          >
            Active deals only
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="explore"
          title="No businesses match those filters"
          body="Try clearing a filter or widening your distance."
        />
      ) : (
        <div className="biz-grid">
          {results.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              distanceKm={distanceForBusiness(business, origin)}
              dealCount={activeDealCount(business.id, data.offers)}
              saved={interactions.isBusinessSaved(business.id)}
              onToggleSave={() => interactions.toggleSaveBusiness(business.id)}
              onView={() => navigate(`/business/profile?b=${business.id}`)}
            />
          ))}
        </div>
      )}
    </>
  );
}
