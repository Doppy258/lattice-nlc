/**
 * OfferCard — an offer tile in explore/matches/saved grids.
 * See component for prop details and conditional match-badge rendering.
 */
import { motion } from "motion/react";
import { Bookmark } from "lucide-react";
import type { Business, MatchResult, Offer } from "@/models";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { RatingStars } from "@/components/common/RatingStars";
import { formatCurrency, formatDistance, formatRating, relativeTime } from "@/utils/formatting";
import { getOfferPricing } from "@/utils/offerPricing";
import { cn } from "@/lib/utils";
import { BusinessImage } from "./BusinessImage";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { MatchReasonsDisclosure } from "./MatchReasonsDisclosure";

/**
 * OfferCard — an offer tile in the explore/matches/saved grids.
 * Composes BusinessImage, MatchScoreBadge, pricing info, rating/distance,
 * match reasons, and a claim button. The `match` prop is optional;
 * when absent the match badge and reasons disclosure are hidden
 * (e.g. on the business profile where the user has already navigated
 * past the ranking layer).
 */
export function OfferCard({
  offer,
  business,
  match,
  distanceKm,
  saved = false,
  claiming = false,
  pinNumber,
  onClaim,
  onSave,
  onView,
  className,
}: {
  offer: Offer;
  business: Business;
  match?: MatchResult;
  distanceKm?: number;
  saved?: boolean;
  claiming?: boolean;
  /** When set, shows a chip matching this offer's numbered pin on the matches map. */
  pinNumber?: number;
  onClaim?: (offer: Offer) => void;
  onSave?: (offer: Offer) => void;
  onView?: (business: Business) => void;
  className?: string;
}) {
  const full = offer.currentClaims >= offer.maxClaims;
  const pricing = getOfferPricing(offer);

  return (
    <Card variant="interactive" className={cn("flex flex-col overflow-hidden", className)}>
      <BusinessImage business={business} className="h-40 w-full" imageUrl={offer.imageUrl}>
        {pricing.badge && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/85 px-2.5 py-1 text-xs font-semibold text-[var(--success)] shadow-[var(--shadow-soft)] backdrop-blur-sm">
            {pricing.badge}
          </span>
        )}
        {onSave && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onSave(offer)}
            aria-label={saved ? "Remove from saved" : "Save offer"}
            aria-pressed={saved}
            className="absolute right-3 top-3 grid size-9 cursor-pointer place-items-center rounded-full bg-card/85 text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur-sm transition-colors hover:text-primary"
          >
            <Bookmark size={17} fill={saved ? "currentColor" : "none"} className={saved ? "text-primary" : ""} />
          </motion.button>
        )}
        {match && <MatchScoreBadge score={match.score} className="absolute bottom-3 left-3" />}
        {pinNumber !== undefined && (
          <span
            className="absolute bottom-3 right-3 inline-grid size-7 place-items-center rounded-full border-2 border-white bg-[var(--primary)] text-xs font-bold tabular-nums text-white shadow-[var(--shadow-soft)]"
            aria-label={`Map pin ${pinNumber}`}
          >
            {pinNumber}
          </span>
        )}
      </BusinessImage>

      <div className="flex flex-1 flex-col gap-3.5 p-5">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onView?.(business)}
            className="inline-flex max-w-full cursor-pointer items-center gap-1 truncate text-left text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="truncate">{business.name}</span>
          </button>
          <h3 className="truncate font-display text-[17px] font-semibold tracking-[-0.02em] text-foreground">
            {offer.title}
          </h3>
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-muted-foreground">
          {offer.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-display text-[26px] font-semibold leading-none tracking-[-0.03em] text-foreground">
            {pricing.headline}
          </span>
          {pricing.kind === "fixedPrice" && pricing.savings > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(pricing.originalPrice!)}
            </span>
          )}
          {offer.studentOnly && (
            <Badge tone="violet" icon={<Icon name="education" size={13} />}>
              Student
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <RatingStars rating={business.ratingAverage} size={13} />
            <span className="font-medium text-foreground">{formatRating(business.ratingAverage)}</span>
            <span>({business.reviewCount})</span>
          </span>
          {distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Icon name="location" size={13} /> {formatDistance(distanceKm)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={13} /> Ends {relativeTime(offer.validUntil)}
          </span>
        </div>

        {match && match.reasons.length > 0 && (
          <MatchReasonsDisclosure reasons={match.reasons} score={match.score} />
        )}

        <div className="mt-auto pt-1">
          <Button
            variant="brand"
            block
            disabled={claiming || full}
            onClick={() => onClaim?.(offer)}
            iconLeft={<Icon name="ticket" size={17} />}
          >
            {full ? "Fully claimed" : claiming ? "Claiming…" : "Claim offer"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
