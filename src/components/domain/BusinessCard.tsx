import { motion } from "motion/react";
import { Bookmark } from "lucide-react";
import type { Business } from "@/models";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { RatingStars } from "@/components/common/RatingStars";
import { CATEGORY_META } from "@/data/catalog";
import { formatDistance, formatRating } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import { BusinessImage } from "./BusinessImage";

/**
 * BusinessCard — a business tile in explore/saved/search grids.
 * Shows the cover photo, category label, price level, rating, distance,
 * a description snippet, active deal count badge, and a "View profile" link.
 * The entire photo area is clickable via `onOpen`; the bookmark button is
 * optional (`onSave`).
 */
export function BusinessCard({
  business,
  activeDeals = 0,
  distanceKm,
  saved = false,
  onSave,
  onOpen,
  className,
}: {
  business: Business;
  activeDeals?: number;
  distanceKm?: number;
  saved?: boolean;
  onSave?: () => void;
  onOpen?: () => void;
  className?: string;
}) {
  const meta = CATEGORY_META[business.category];
  return (
    <Card variant="interactive" className={cn("flex flex-col overflow-hidden", className)}>
      <BusinessImage business={business} className="h-36 w-full">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`View ${business.name}`}
          className="absolute inset-0 cursor-pointer"
        />
        {activeDeals > 0 && (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/85 px-2.5 py-1 text-xs font-semibold text-[var(--primary-strong)] shadow-[var(--shadow-soft)] backdrop-blur-sm">
            <Icon name="ticket" size={13} /> {activeDeals} {activeDeals === 1 ? "deal" : "deals"}
          </span>
        )}
        {onSave && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onSave}
            aria-label={saved ? "Remove from saved" : "Save business"}
            aria-pressed={saved}
            className="absolute right-3 top-3 grid size-9 cursor-pointer place-items-center rounded-full bg-card/85 text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur-sm transition-colors hover:text-primary"
          >
            <Bookmark size={17} fill={saved ? "currentColor" : "none"} className={saved ? "text-primary" : ""} />
          </motion.button>
        )}
      </BusinessImage>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpen}
              className="truncate text-left font-display text-[17px] font-semibold tracking-[-0.02em] transition-colors hover:text-primary"
            >
              {business.name}
            </button>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {meta.label} · {"$".repeat(business.priceLevel)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <RatingStars rating={business.ratingAverage} />
          <span className="font-medium text-foreground">{formatRating(business.ratingAverage)}</span>
          <span>({business.reviewCount})</span>
          {distanceKm !== undefined && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="location" size={13} /> {formatDistance(distanceKm)}
              </span>
            </>
          )}
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {business.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          {activeDeals > 0 ? (
            <Badge tone="brand" icon={<Icon name="ticket" size={13} />}>
              {activeDeals} active {activeDeals === 1 ? "deal" : "deals"}
            </Badge>
          ) : (
            <Badge tone="neutral">No active deals</Badge>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onOpen}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-accent"
          >
            View profile <Icon name="arrow" size={14} />
          </motion.button>
        </div>
      </div>
    </Card>
  );
}
