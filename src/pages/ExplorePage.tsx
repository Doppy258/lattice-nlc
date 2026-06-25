import { useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ChipGroup, ToggleChip } from "@/components/common/ToggleChip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { BusinessCard } from "@/components/domain/BusinessCard";
import { getOriginPoint } from "@/services/offerMatchingService";
import {
  activeDealCount,
  distanceForBusiness,
  filterBusinesses,
  sortBusinesses,
  type BusinessSort,
} from "@/services/businessService";
import { isBusinessSaved, toggleSavedBusiness } from "@/services/userService";
import { ALL_CATEGORIES, CATEGORY_META } from "@/data/catalog";
import type { BusinessCategory } from "@/models";

const SORTS: { value: BusinessSort; label: string }[] = [
  { value: "highestRating", label: "Highest rating" },
  { value: "mostReviews", label: "Most reviews" },
  { value: "closest", label: "Closest" },
  { value: "activeDeals", label: "Most deals" },
  { value: "alphabetical", label: "A–Z" },
];

export function ExplorePage() {
  const { data, activeUser, setData } = useApp();
  const origin = getOriginPoint(activeUser);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "all">("all");
  const [sort, setSort] = useState<BusinessSort>("highestRating");
  const [dealsOnly, setDealsOnly] = useState(false);

  const results = useMemo(() => {
    const filtered = filterBusinesses(
      data.businesses,
      {
        query: query.trim() || undefined,
        category: category === "all" ? undefined : category,
        hasDeals: dealsOnly || undefined,
      },
      data.offers,
      origin,
    );
    return sortBusinesses(filtered, sort, data.offers, origin);
  }, [data.businesses, data.offers, query, category, dealsOnly, sort, origin]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Explore"
        accent="local businesses"
        subtitle="Browse verified businesses near you. Filter by category, find the ones with live deals, and open a profile to claim offers or leave a verified review."
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search businesses, tags, or descriptions"
              className="pl-10"
              aria-label="Search businesses"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[13px] text-muted-foreground sm:block">Sort</span>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as BusinessSort)}
              className="w-44"
              aria-label="Sort businesses"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChipGroup>
            <ToggleChip active={category === "all"} onClick={() => setCategory("all")}>
              All
            </ToggleChip>
            {ALL_CATEGORIES.map((cat) => (
              <ToggleChip
                key={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
                icon={<Icon name={CATEGORY_META[cat].icon as never} size={14} />}
              >
                {CATEGORY_META[cat].label}
              </ToggleChip>
            ))}
          </ChipGroup>
          <ToggleChip
            active={dealsOnly}
            onClick={() => setDealsOnly((v) => !v)}
            icon={<Icon name="ticket" size={14} />}
          >
            Deals only
          </ToggleChip>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {results.length} {results.length === 1 ? "business" : "businesses"}
          {category !== "all" && (
            <>
              {" "}
              in <span className="font-medium text-foreground">{CATEGORY_META[category].label}</span>
            </>
          )}
        </p>
        <Badge tone="brand" icon={<Icon name="location" size={12} />}>
          Near you
        </Badge>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="explore"
          title="No businesses match"
          body="Try clearing the search, switching category, or turning off the deals filter."
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((b) => (
            <StaggerItem key={b.id}>
              <BusinessCard
                business={b}
                activeDeals={activeDealCount(b.id, data.offers)}
                distanceKm={distanceForBusiness(b, origin)}
                saved={isBusinessSaved(activeUser, b.id)}
                onSave={() => setData((d) => toggleSavedBusiness(d, activeUser.id, b.id))}
                onOpen={() => navigate(`/business?id=${b.id}`)}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
