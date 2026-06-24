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
import { PageHero } from "../components/layout/PageHero";
import { FilterBar } from "../components/common/FilterBar";
import { ScrollRail } from "../components/common/ScrollRail";
import { EmptyState } from "../components/common/EmptyState";
import { BusinessCard } from "../components/businesses/BusinessCard";

const SORTS: { key: BusinessSort; label: string }[] = [
  { key: "highestRating", label: "Top rated" },
  { key: "closest", label: "Nearest" },
  { key: "activeDeals", label: "Most deals" },
  { key: "alphabetical", label: "A-Z" },
];

const RATING_SEGMENTS = [
  { id: "0", label: "Any rating" },
  { id: "4", label: "4.0+" },
  { id: "4.5", label: "4.5+" },
];

const DISTANCE_SEGMENTS = [
  { id: "0", label: "Any distance" },
  { id: "3", label: "< 3 km" },
  { id: "5", label: "< 5 km" },
  { id: "10", label: "< 10 km" },
];

export function ExplorePage() {
  const { data, activeUser } = useApp();
  const interactions = useOfferInteractions();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [minRating, setMinRating] = useState("0");
  const [maxDistanceKm, setMaxDistanceKm] = useState("0");
  const [hasDeals, setHasDeals] = useState(false);
  const [sort, setSort] = useState<BusinessSort>("highestRating");

  const origin = useMemo(() => getOriginPoint(activeUser), [activeUser]);

  const results = useMemo(() => {
    const filtered = filterBusinesses(
      data.businesses,
      {
        query: query || undefined,
        category: category || undefined,
        minRating: Number(minRating) || undefined,
        maxDistanceKm: Number(maxDistanceKm) || undefined,
        hasDeals: hasDeals || undefined,
      },
      data.offers,
      origin
    );
    return sortBusinesses(filtered, sort, data.offers, origin);
  }, [data.businesses, data.offers, query, category, minRating, maxDistanceKm, hasDeals, sort, origin]);

  const featured = results.slice(0, 3);
  const rest = results.slice(3);

  return (
    <>
      <PageHero
        variant="split"
        kicker="Explore"
        title="Browse local businesses"
        subtitle="Search, filter, and sort nearby businesses, then bookmark the ones you like."
        aside={
          <div className="page-hero__stat-pill">
            <strong>{results.length}</strong>
            <span>businesses nearby</span>
          </div>
        }
      />

      <FilterBar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search businesses, tags, or descriptions"
        segments={SORTS.map((s) => ({ id: s.key, label: s.label }))}
        activeSegment={sort}
        onSegmentChange={(id) => setSort(id as BusinessSort)}
      >
        <select
          className="select-input"
          value={category}
          onChange={(e) => setCategory(e.target.value as BusinessCategory | "")}
          aria-label="Category"
          style={{ width: "auto", minWidth: 140 }}
        >
          <option value="">All categories</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
        <div className="filter-bar__segmented">
          {RATING_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              className={`filter-bar__segment${minRating === seg.id ? " filter-bar__segment--on" : ""}`}
              onClick={() => setMinRating(seg.id)}
            >
              {seg.label}
            </button>
          ))}
        </div>
        <div className="filter-bar__segmented">
          {DISTANCE_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              className={`filter-bar__segment${maxDistanceKm === seg.id ? " filter-bar__segment--on" : ""}`}
              onClick={() => setMaxDistanceKm(seg.id)}
            >
              {seg.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`chip ${hasDeals ? "chip--on" : ""}`}
          aria-pressed={hasDeals}
          onClick={() => setHasDeals((v) => !v)}
        >
          Active deals only
        </button>
      </FilterBar>

      {results.length > 0 && (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <ScrollRail>
          {ALL_CATEGORIES.slice(0, 6).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`scroll-rail__item chip${category === cat ? " chip--on" : ""}`}
              onClick={() => setCategory(category === cat ? "" : cat)}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
          </ScrollRail>
        </div>
      )}

      {results.length === 0 ? (
        <EmptyState
          variant="map"
          title="No businesses match those filters"
          body="Try clearing a filter or widening your distance."
        />
      ) : (
        <>
          {featured.length >= 3 && (
            <div className="featured-row">
              <BusinessCard
                business={featured[0]}
                distanceKm={distanceForBusiness(featured[0], origin)}
                dealCount={activeDealCount(featured[0].id, data.offers)}
                saved={interactions.isBusinessSaved(featured[0].id)}
                onToggleSave={() => interactions.toggleSaveBusiness(featured[0].id)}
                onView={() => navigate(`/business/profile?b=${featured[0].id}`)}
              />
              <div className="featured-row__side">
                {featured.slice(1, 3).map((business) => (
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
            </div>
          )}
          <div className="biz-grid">
            {(featured.length >= 3 ? rest : results).map((business) => (
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
        </>
      )}
    </>
  );
}
