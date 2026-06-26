import { useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import { useHashRoute, navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ChipGroup, ToggleChip } from "@/components/common/ToggleChip";
import { Icon, type IconName } from "@/components/common/Icon";
import { Select } from "@/components/ui/select";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { OfferCard } from "@/components/domain/OfferCard";
import { useClaim } from "@/components/domain/useClaim";
import { ClaimResultModal } from "@/components/domain/ClaimResultModal";
import { BotCheckModal } from "@/components/domain/BotCheckModal";
import { getMatchingOffers, getOriginPoint } from "@/services/offerMatchingService";
import { distanceForBusiness } from "@/services/businessService";
import { isBusinessSaved, isOfferSaved, toggleSavedOffer } from "@/services/userService";
import { NEED_TYPE_LABELS } from "@/data/catalog";
import { formatCurrency, formatTimeRange } from "@/utils/formatting";
import type { Business, MatchResult, Offer, PingRequest } from "@/models";

type SortKey = "best" | "rating" | "closest" | "price" | "ending" | "claimed";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "best", label: "Best match" },
  { value: "rating", label: "Highest rating" },
  { value: "closest", label: "Closest" },
  { value: "price", label: "Lowest price" },
  { value: "ending", label: "Ending soon" },
  { value: "claimed", label: "Most claimed" },
];

type Row = { match: MatchResult; offer: Offer; business: Business; distanceKm: number };

export function MatchesPage() {
  const { data, activeUser, setData } = useApp();
  const { query } = useHashRoute();
  const { claim, result, clearResult, pendingClaim, confirmClaim, cancelClaim } = useClaim();
  const origin = getOriginPoint(activeUser);

  const [sort, setSort] = useState<SortKey>("best");
  const [filters, setFilters] = useState({ deals: false, student: false, verified: false, saved: false });
  const toggle = (k: keyof typeof filters) => setFilters((f) => ({ ...f, [k]: !f[k] }));

  const request: PingRequest | undefined = useMemo(() => {
    const id = query.get("request");
    const byId = id ? data.requests.find((r) => r.id === id) : undefined;
    if (byId) return byId;
    return data.requests
      .filter((r) => r.userId === activeUser.id && (r.status === "submitted" || r.status === "matched"))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  }, [query, data.requests, activeUser.id]);

  const rows: Row[] = useMemo(() => {
    if (!request) return [];
    return getMatchingOffers(request, data.offers, data.businesses, activeUser)
      .map((match) => {
        const offer = data.offers.find((o) => o.id === match.offerId);
        const business = data.businesses.find((b) => b.id === match.businessId);
        if (!offer || !business) return null;
        return { match, offer, business, distanceKm: distanceForBusiness(business, origin) };
      })
      .filter((r): r is Row => r !== null);
  }, [request, data.offers, data.businesses, activeUser, origin]);

  const visible = useMemo(() => {
    let list = rows.filter((r) => {
      if (filters.deals && !(r.offer.originalPrice && r.offer.originalPrice > r.offer.price)) return false;
      if (filters.student && !r.offer.studentOnly) return false;
      if (filters.verified && !r.business.verified) return false;
      if (filters.saved && !isBusinessSaved(activeUser, r.business.id)) return false;
      return true;
    });
    list = list.slice().sort((a, b) => {
      switch (sort) {
        case "rating":
          return b.business.ratingAverage - a.business.ratingAverage;
        case "closest":
          return a.distanceKm - b.distanceKm;
        case "price":
          return a.offer.price - b.offer.price;
        case "ending":
          return Date.parse(a.offer.validUntil) - Date.parse(b.offer.validUntil);
        case "claimed":
          return b.offer.currentClaims - a.offer.currentClaims;
        default:
          return b.match.score - a.match.score;
      }
    });
    return list;
  }, [rows, filters, sort, activeUser]);

  if (!request) {
    return (
      <EmptyState
        icon="ping"
        title="No Lattice yet"
        body="Create a structured request and we'll match you with local offers ranked by OfferRank."
        action={
          <Button variant="brand" iconLeft={<Icon name="ping" size={17} />} onClick={() => navigate("/create")}>
            Create a Lattice
          </Button>
        }
      />
    );
  }

  const summary = [
    { icon: "ping" as IconName, text: NEED_TYPE_LABELS[request.needType] },
    {
      icon: "ticket" as IconName,
      text:
        request.budgetMax !== undefined
          ? `under ${formatCurrency(request.budgetMax)}`
          : request.budgetMin !== undefined
            ? `${formatCurrency(request.budgetMin)}+`
            : "any budget",
    },
    { icon: "location" as IconName, text: `within ${request.distanceKm} km` },
    { icon: "clock" as IconName, text: formatTimeRange(request.timeStart, request.timeEnd) },
  ];

  return (
    <div className="space-y-6">
      <Card variant="glassBlue" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[24px] font-semibold tracking-[-0.035em]">
              Your <span className="font-accent font-normal text-primary">matches</span>
            </h1>
            <Badge tone="brand">{rows.length} offers</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
            {summary.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <Icon name={s.icon} size={13} /> {s.text}
              </span>
            ))}
          </div>
        </div>
        <Button variant="secondary" iconLeft={<Icon name="ping" size={16} />} onClick={() => navigate("/create")}>
          Edit request
        </Button>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChipGroup>
          <ToggleChip active={filters.deals} onClick={() => toggle("deals")}>
            Active deals
          </ToggleChip>
          <ToggleChip active={filters.student} onClick={() => toggle("student")}>
            Student discount
          </ToggleChip>
          <ToggleChip active={filters.verified} onClick={() => toggle("verified")}>
            Verified only
          </ToggleChip>
          <ToggleChip active={filters.saved} onClick={() => toggle("saved")}>
            Saved
          </ToggleChip>
        </ChipGroup>
        <div className="flex items-center gap-2">
          <span className="hidden text-[13px] text-muted-foreground sm:block">Sort</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-44">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="matches"
          title="No exact matches found"
          body="Try increasing your distance, raising your budget, or changing your time window — or browse similar offers."
          action={
            <>
              <Button variant="brand" iconLeft={<Icon name="ping" size={17} />} onClick={() => navigate("/create")}>
                Adjust request
              </Button>
              <Button variant="secondary" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/explore")}>
                Browse businesses
              </Button>
            </>
          }
        />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <StaggerItem key={r.offer.id}>
              <OfferCard
                offer={r.offer}
                business={r.business}
                match={r.match}
                distanceKm={r.distanceKm}
                saved={isOfferSaved(activeUser, r.offer.id)}
                onClaim={(o) => claim(o, request.id)}
                onSave={(o) => setData((d) => toggleSavedOffer(d, activeUser.id, o.id))}
                onView={(b) => navigate(`/business?id=${b.id}`)}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

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
