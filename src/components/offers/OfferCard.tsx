import { motion } from "motion/react";
import { Check, Clock, Heart, MapPin } from "lucide-react";
import type { Business, MatchResult, Offer } from "../../models";
import type { OfferClaimState } from "../../app/useOfferInteractions";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { StarRating } from "../common/StarRating";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { MatchReasons } from "./MatchReasons";
import { CATEGORY_META } from "../../data/catalog";
import {
  formatCurrency,
  formatDistance,
  relativeTime,
} from "../../utils/formatting";
import {
  businessGrade,
  businessImageUrl,
  friendAvatarUrl,
  savedByCount,
} from "../../utils/businessVisuals";
import { SPRING_SOFT } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

type Props = {
  offer: Offer;
  business: Business;
  distanceKm?: number;
  match?: MatchResult;
  saved: boolean;
  claimState: OfferClaimState;
  featured?: boolean;
  onClaim: () => void;
  onToggleSave: () => void;
  onViewBusiness: () => void;
};

const CLAIM_LABEL: Record<OfferClaimState, string> = {
  claimable: "Claim offer",
  claimed: "Claimed",
  full: "Offer full",
  expired: "Expired",
};

export function OfferCard({
  offer,
  business,
  distanceKm,
  match,
  saved,
  claimState,
  onClaim,
  onToggleSave,
  onViewBusiness,
  featured = false,
}: Props) {
  const savings = offer.originalPrice ? offer.originalPrice - offer.price : 0;
  const expired = claimState === "expired";
  const savedBy = savedByCount(offer.id);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={SPRING_SOFT}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-shadow duration-300 hover:shadow-lift",
        featured && "sm:col-span-2 sm:grid sm:grid-cols-2 sm:flex-row",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          featured ? "h-52 sm:h-full sm:min-h-[300px]" : "h-48",
        )}
      >
        <img
          src={businessImageUrl(business)}
          alt={`${business.name} offer preview`}
          className="size-full object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0" />
        <span className="absolute top-3.5 left-3.5 inline-flex items-center rounded-full bg-white/85 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur-md">
          {businessGrade(business)}
        </span>
        <motion.button
          whileTap={{ scale: 0.84 }}
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove saved offer" : "Save offer"}
          className={cn(
            "absolute top-3 right-3 grid size-9 place-items-center rounded-full shadow-sm outline-none backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
            saved
              ? "bg-primary text-primary-foreground"
              : "bg-white/85 text-foreground hover:bg-white",
          )}
        >
          <Heart className={cn("size-4", saved && "fill-current")} strokeWidth={2} />
        </motion.button>
      </div>

      <div className={cn("flex flex-1 flex-col gap-3.5 p-5", featured && "sm:p-6")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={onViewBusiness}
              className="block max-w-full truncate text-left text-[17px] font-bold text-foreground transition-colors hover:text-primary"
            >
              {business.name}
            </button>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">
                {CATEGORY_META[business.category].label}
              </Badge>
              {business.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                  <Check className="size-3.5" strokeWidth={2.5} /> Verified
                </span>
              )}
            </div>
          </div>
          {match && <MatchScoreBadge score={match.score} />}
        </div>

        <div>
          <h3 className="text-xl leading-snug font-bold tracking-tight text-foreground">
            {offer.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {offer.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="mono text-2xl font-extrabold text-primary">
            {offer.price === 0 ? "Free" : formatCurrency(offer.price)}
          </span>
          {offer.originalPrice && (
            <span className="mono text-sm text-muted-foreground line-through">
              {formatCurrency(offer.originalPrice)}
            </span>
          )}
          {savings > 0 && (
            <Badge tone="success">Save {formatCurrency(savings)}</Badge>
          )}
          {offer.studentOnly && <Badge tone="accent">Student</Badge>}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-border py-3 text-[13px] text-muted-foreground">
          {distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" strokeWidth={1.9} />
              {formatDistance(distanceKm)}
            </span>
          )}
          <StarRating
            value={business.ratingAverage}
            reviewCount={business.reviewCount}
          />
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" strokeWidth={1.9} />
            {expired ? "Ended" : `Ends ${relativeTime(offer.validUntil)}`}
          </span>
        </div>

        {match && <MatchReasons reasons={match.reasons} />}

        {savedBy > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex -space-x-2" aria-hidden="true">
              {Array.from({ length: Math.min(savedBy, 3) }).map((_, index) => (
                <img
                  key={index}
                  src={friendAvatarUrl(offer.id, index)}
                  alt=""
                  className="size-6 rounded-full border-2 border-card object-cover"
                />
              ))}
            </span>
            <span>
              {savedBy} local{savedBy === 1 ? "" : "s"} saved this
            </span>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={onClaim} disabled={claimState !== "claimable"} size="sm">
            {CLAIM_LABEL[claimState]}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleSave}
            aria-pressed={saved}
            iconLeft={
              <Heart className={cn("size-4", saved && "fill-current")} />
            }
          >
            {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onViewBusiness}>
            Details
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
