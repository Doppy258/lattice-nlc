import { motion } from "motion/react";
import { Bookmark } from "lucide-react";
import type { Business, MatchResult, Offer } from "@/models";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { Icon, type IconName } from "@/components/common/Icon";
import { RatingStars } from "@/components/common/RatingStars";
import { CATEGORY_META } from "@/data/catalog";
import { formatCurrency, formatDistance, formatRating, relativeTime } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { MatchReasons } from "./MatchReasons";

export function OfferCard({
  offer,
  business,
  match,
  distanceKm,
  saved = false,
  claiming = false,
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
  onClaim?: (offer: Offer) => void;
  onSave?: (offer: Offer) => void;
  onView?: (business: Business) => void;
  className?: string;
}) {
  const meta = CATEGORY_META[offer.category];
  const full = offer.currentClaims >= offer.maxClaims;
  const savings =
    offer.originalPrice && offer.originalPrice > offer.price
      ? offer.originalPrice - offer.price
      : 0;

  return (
    <Card variant="interactive" className={cn("flex flex-col gap-4 p-5", className)}>
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
          <Icon name={meta.icon as IconName} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onView?.(business)}
            className="cursor-pointer truncate text-left text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            {business.name}
            {business.verified && <Icon name="check" size={13} className="ml-1 inline text-primary" />}
          </button>
          <h3 className="truncate font-display text-[17px] font-semibold tracking-[-0.02em] text-foreground">
            {offer.title}
          </h3>
        </div>
        {match && <MatchScoreBadge score={match.score} className="shrink-0" />}
      </div>

      <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {offer.description}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-display text-[26px] font-semibold leading-none tracking-[-0.03em] text-foreground">
          {formatCurrency(offer.price)}
        </span>
        {savings > 0 && (
          <>
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(offer.originalPrice!)}
            </span>
            <Badge tone="success">Save {formatCurrency(savings)}</Badge>
          </>
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
        <div className="rounded-2xl border border-[var(--tint-blue-border)] bg-[var(--tint-blue)] p-3.5">
          <MatchReasons reasons={match.reasons} />
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1">
        <Button
          variant="brand"
          className="flex-1"
          disabled={claiming || full}
          onClick={() => onClaim?.(offer)}
          iconLeft={<Icon name="ticket" size={17} />}
        >
          {full ? "Fully claimed" : claiming ? "Claiming…" : "Claim offer"}
        </Button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => onSave?.(offer)}
          aria-label={saved ? "Remove from saved" : "Save offer"}
          aria-pressed={saved}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-[var(--shadow-soft)] transition-colors hover:text-primary"
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} className={saved ? "text-primary" : ""} />
        </motion.button>
      </div>
    </Card>
  );
}
