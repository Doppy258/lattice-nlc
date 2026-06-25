import { motion } from "motion/react";
import { Bookmark } from "lucide-react";
import type { Business } from "@/models";
import { Icon, type IconName } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { RatingStars } from "@/components/common/RatingStars";
import { CATEGORY_META } from "@/data/catalog";
import { formatDistance, formatRating } from "@/utils/formatting";
import { cn } from "@/lib/utils";

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
    <Card variant="interactive" className={cn("flex flex-col gap-4 p-5", className)}>
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
          <Icon name={meta.icon as IconName} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[17px] font-semibold tracking-[-0.02em]">
              {business.name}
            </h3>
            {business.verified && (
              <Icon name="check" size={15} className="shrink-0 text-primary" />
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {meta.label} · {"$".repeat(business.priceLevel)}
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          aria-label={saved ? "Remove from saved" : "Save business"}
          aria-pressed={saved}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary active:scale-90"
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} className={saved ? "text-primary" : ""} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <RatingStars rating={business.ratingAverage} />
        <span className="font-medium text-foreground">{formatRating(business.ratingAverage)}</span>
        <span>({business.reviewCount})</span>
        {distanceKm !== undefined && (
          <>
            <span aria-hidden>·</span>
            <span>{formatDistance(distanceKm)}</span>
          </>
        )}
      </div>

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
          className="cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-accent"
        >
          View profile
        </motion.button>
      </div>
    </Card>
  );
}
