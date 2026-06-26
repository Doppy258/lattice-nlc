/**
 * BusinessProfilePage — route: /business?id=<id>
 *
 * Public storefront view with a hero banner, glass identity card (rating,
 * category, price, distance, open/closed status), segmented sections for
 * active offers, verified reviews, and about details (description, address,
 * tags, hours). Supports save/bookmark and the claim flow.
 */

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Bookmark } from "lucide-react";
import { useApp } from "@/app/providers";
import { useHashRoute, navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { RatingStars } from "@/components/common/RatingStars";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { BusinessImage } from "@/components/domain/BusinessImage";
import { OfferCard } from "@/components/domain/OfferCard";
import { useClaim } from "@/components/domain/useClaim";
import { ClaimResultModal } from "@/components/domain/ClaimResultModal";
import { BotCheckModal } from "@/components/domain/BotCheckModal";
import { ShareLocationButton } from "@/components/common/ShareLocationButton";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getOriginPoint } from "@/services/offerMatchingService";
import { distanceForBusiness, getActiveOffersForBusiness } from "@/services/businessService";
import { getBusinessReviews } from "@/services/reviewService";
import { isBusinessSaved, isOfferSaved, toggleSavedBusiness, toggleSavedOffer, getUserById } from "@/services/userService";
import { CATEGORY_META } from "@/data/catalog";
import { formatDistance, formatRating, relativeTime, initials } from "@/utils/formatting";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const A11Y_LABELS: Record<string, string> = {
  wheelchairAccessible: "Wheelchair accessible",
  quiet: "Quiet environment",
};

function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hr} ${period}` : `${hr}:${String(m).padStart(2, "0")} ${period}`;
}

type Section = "offers" | "reviews" | "about";

export function BusinessProfilePage() {
  const { data, activeUser, setData } = useApp();
  const { query } = useHashRoute();
  const { claim, result, clearResult, pendingClaim, confirmClaim, cancelClaim } = useClaim();
  const geolocation = useGeolocation();
  const origin = getOriginPoint(activeUser);
  const [section, setSection] = useState<Section>("offers");

  function handleShareLocation() {
    geolocation.requestLocation();
  }

  if (geolocation.location && !activeUser.location) {
    setData((d) => ({
      ...d,
      users: d.users.map((u) =>
        u.id === activeUser.id ? { ...u, location: geolocation.location! } : u,
      ),
    }));
  }

  const business = useMemo(
    () => data.businesses.find((b) => b.id === query.get("id")),
    [data.businesses, query],
  );

  const offers = useMemo(
    () => (business ? getActiveOffersForBusiness(business.id, data.offers) : []),
    [business, data.offers],
  );
  const reviews = useMemo(
    () => (business ? getBusinessReviews(business.id, data.reviews) : []),
    [business, data.reviews],
  );

  if (!business) {
    return (
      <EmptyState
        icon="explore"
        title="Business not found"
        body="This business may have been removed. Browse other local businesses instead."
        action={
          <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/explore")}>
            Back to Explore
          </Button>
        }
      />
    );
  }

  const meta = CATEGORY_META[business.category];
  const saved = isBusinessSaved(activeUser, business.id);
  const distance = distanceForBusiness(business, origin);
  const today = new Date().getDay();
  const todayHours = business.hours.find((h) => h.dayOfWeek === today);
  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const openNow = !!todayHours && nowHHMM >= todayHours.openTime && nowHHMM <= todayHours.closeTime;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/explore")}
        className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <Icon name="arrow" size={15} className="rotate-180" /> Explore
      </button>

      {/* Hero: storefront photo with an overlapping glass identity card */}
      <Reveal as="section" className="relative" y={10}>
        <div className="overflow-hidden rounded-[var(--tile-radius-lg)]">
          <BusinessImage business={business} className="h-52 w-full sm:h-72" width={1500} eager>
            <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-card/85 px-3 py-1 text-xs font-semibold text-[var(--primary-strong)] shadow-[var(--shadow-soft)] backdrop-blur-sm">
              <Icon name={meta.icon as never} size={13} /> {meta.label}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setData((d) => toggleSavedBusiness(d, activeUser.id, business.id))}
              aria-label={saved ? "Remove from saved" : "Save business"}
              aria-pressed={saved}
              className="absolute right-4 top-4 grid size-10 cursor-pointer place-items-center rounded-full bg-card/85 text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur-sm transition-colors hover:text-primary"
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} className={saved ? "text-primary" : ""} />
            </motion.button>
          </BusinessImage>
        </div>

        <div className="glass-strong relative z-10 mx-3 -mt-16 rounded-[var(--tile-radius-lg)] p-5 sm:mx-6 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[26px] font-semibold tracking-[-0.035em] sm:text-[32px]">
                  {business.name}
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <RatingStars rating={business.ratingAverage} size={14} />
                  <span className="font-semibold text-foreground">{formatRating(business.ratingAverage)}</span>
                  <span>({business.reviewCount})</span>
                </span>
                <span aria-hidden>·</span>
                <span>{meta.label}</span>
                <span aria-hidden>·</span>
                <span>{"$".repeat(business.priceLevel)}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="location" size={13} /> {formatDistance(distance)}
                </span>
                <span aria-hidden>·</span>
                <span className={openNow ? "font-semibold text-[var(--success)]" : "text-muted-foreground"}>
                  {openNow ? "Open now" : "Closed"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <Button variant="secondary" iconLeft={<Icon name="saved" size={16} />} onClick={() => setData((d) => toggleSavedBusiness(d, activeUser.id, business.id))}>
                {saved ? "Saved" : "Save"}
              </Button>
              <Button variant="brand" iconLeft={<Icon name="ping" size={16} />} onClick={() => navigate("/create")}>
                Create a Lattice
              </Button>
            </div>
          </div>
        </div>
      </Reveal>

      {!activeUser.location && !geolocation.loading && !geolocation.error && (
        <div className="flex items-center justify-between rounded-xl bg-[var(--tint-blue)] px-4 py-3">
          <span className="text-[13px] text-[var(--primary-strong)]">Enable location for accurate distance</span>
          <ShareLocationButton loading={false} error={null} onRequest={handleShareLocation} />
        </div>
      )}
      {geolocation.error && (
        <p className="rounded-xl bg-[var(--danger-tint)] px-3 py-2 text-[13px] font-medium text-destructive">
          Could not get your location: {geolocation.error}
        </p>
      )}

      <SegmentedControl
        value={section}
        onChange={setSection}
        options={[
          { value: "offers", label: `Offers (${offers.length})` },
          { value: "reviews", label: `Reviews (${reviews.length})` },
          { value: "about", label: "About" },
        ]}
      />

      {section === "offers" &&
        (offers.length === 0 ? (
          <EmptyState icon="ticket" title="No active offers" body={`${business.name} has no live deals right now. Save it to get notified when new offers drop.`} />
        ) : (
          <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <StaggerItem key={offer.id}>
                <OfferCard
                  offer={offer}
                  business={business}
                  distanceKm={distance}
                  saved={isOfferSaved(activeUser, offer.id)}
                  onClaim={(o) => claim(o)}
                  onSave={(o) => setData((d) => toggleSavedOffer(d, activeUser.id, o.id))}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ))}

      {section === "reviews" &&
        (reviews.length === 0 ? (
          <EmptyState icon="reviews" title="No reviews yet" body="Verified reviews appear here after customers redeem an offer and share their experience." />
        ) : (
          <div className="space-y-4">
            <Card variant="glassBlue" className="flex items-center gap-5 p-5">
              <div className="text-center">
                <div className="font-display text-[40px] font-semibold leading-none tracking-[-0.03em] text-[var(--primary-strong)]">
                  {formatRating(business.ratingAverage)}
                </div>
                <RatingStars rating={business.ratingAverage} size={15} className="mt-1.5 justify-center" />
                <div className="mt-1 text-[13px] text-muted-foreground">{business.reviewCount} reviews</div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every review is <span className="font-semibold text-foreground">verified</span> — only customers who
                redeemed an offer here can leave one, so ratings reflect real visits.
              </p>
            </Card>
            <Stagger className="space-y-3">
              {reviews.map((r) => {
                const author = getUserById(r.userId, data.users);
                return (
                  <StaggerItem key={r.id}>
                    <Card variant="solid" className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-[var(--primary-strong)]">
                            {initials(author?.name ?? "Lattice User")}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 text-sm font-semibold">
                              {author?.name ?? "Lattice user"}
                              {r.verified && <Icon name="check" size={13} className="text-primary" />}
                            </div>
                            <RatingStars rating={r.rating} size={13} className="mt-0.5" />
                          </div>
                        </div>
                        <span className="shrink-0 text-[12px] text-muted-foreground">{relativeTime(r.createdAt)}</span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-foreground">{r.text}</p>
                      {r.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {r.tags.map((t) => (
                            <Badge key={t} tone="neutral">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        ))}

      {section === "about" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="solid" className="space-y-3 p-5 lg:col-span-2">
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">About</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{business.description}</p>
            <div className="flex items-start gap-2 pt-1 text-sm text-foreground">
              <Icon name="location" size={16} className="mt-0.5 shrink-0 text-primary" />
              {business.address}
            </div>
            {business.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {business.tags.map((t) => (
                  <Badge key={t} tone="brand">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            {business.accessibilityFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {business.accessibilityFeatures.map((f) => (
                  <Badge key={f} tone="success" icon={<Icon name="check" size={12} />}>
                    {A11Y_LABELS[f] ?? f}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
          <Card variant="solid" className="space-y-3 p-5">
            <h3 className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.02em]">
              <Icon name="clock" size={17} className="text-primary" /> Hours
            </h3>
            <ul className="space-y-1.5 text-sm">
              {DAYS.map((day, i) => {
                const h = business.hours.find((x) => x.dayOfWeek === i);
                const isToday = i === today;
                return (
                  <li
                    key={day}
                    className={cnRow(isToday)}
                  >
                    <span className={isToday ? "font-semibold text-foreground" : "text-muted-foreground"}>{day}</span>
                    <span className={isToday ? "font-semibold text-foreground" : "text-muted-foreground"}>
                      {h ? `${fmtTime(h.openTime)} – ${fmtTime(h.closeTime)}` : "Closed"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
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

function cnRow(isToday: boolean): string {
  return `flex items-center justify-between rounded-lg px-2.5 py-1.5 ${isToday ? "bg-[var(--tint-blue)]" : ""}`;
}
