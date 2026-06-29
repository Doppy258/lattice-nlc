/**
 * BusinessImage — storefront photo with resilient fallback chain.
 * See component for resolution priority and overlay usage.
 */
import { useEffect, useState, type ReactNode } from "react";
import type { Business } from "@/models";
import { Icon, type IconName } from "@/components/common/Icon";
import { CATEGORY_META } from "@/data/catalog";
import { businessImageUrl, businessFallbackUrl } from "@/data/businessImages";
import { cn } from "@/lib/utils";

type BusinessLike = Pick<Business, "id" | "name" | "category"> & { bannerUrl?: string };

/**
 * BusinessImage — storefront photo with a resilient fallback chain.
 * Candidates, tried in order until one loads:
 *   1) explicit `imageUrl` prop (e.g. offer-specific) or business `bannerUrl`,
 *   2) on-subject photo of what the business sells (LoremFlickr, unique per id),
 *   3) curated, high-quality Unsplash photo for the business/category.
 * When every candidate fails it degrades to a category-icon tile. Overlays
 * (badges, save buttons) are passed as children and rendered on top.
 * The outer className controls aspect ratio and rounding — all image sizing
 * is delegated to the caller.
 */
export function BusinessImage({
  business,
  className,
  width = 900,
  eager = false,
  iconSize = 30,
  imageUrl,
  children,
}: {
  business: BusinessLike;
  className?: string;
  width?: number;
  eager?: boolean;
  iconSize?: number;
  /** Optional override image (e.g. offer-specific image). Takes priority over business banner. */
  imageUrl?: string;
  children?: ReactNode;
}) {
  const meta = CATEGORY_META[business.category];
  // An explicit imageUrl (e.g. from an offer) takes priority, then business banner.
  const custom = imageUrl?.trim() ? imageUrl : business.bannerUrl?.trim() ? business.bannerUrl : null;
  // Ordered fallback chain: custom → on-subject photo → curated Unsplash → icon tile.
  const candidates = [custom, businessImageUrl(business, width), businessFallbackUrl(business, width)].filter(
    Boolean,
  ) as string[];

  // `stage` walks the candidate list on each load error; past the end → icon tile.
  const [stage, setStage] = useState(0);
  // Reset when the business (or its custom image) changes so a new tile starts fresh.
  useEffect(() => setStage(0), [business.id, custom]);
  const src = candidates[stage];

  return (
    <div className={cn("relative isolate overflow-hidden bg-[var(--tint-blue)]", className)}>
      {src === undefined ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-card/70 text-primary shadow-[var(--shadow-soft)]">
            <Icon name={meta.icon as IconName} size={iconSize} />
          </span>
        </div>
      ) : (
        <img
          key={src}
          src={src}
          alt={`${business.name} — ${meta.label.toLowerCase()}`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setStage((s) => s + 1)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {/* Liquid-glass edge: inset hairline + top highlight (solid rgba, no gradient). */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(13,30,73,0.07),inset_0_1px_0_rgba(255,255,255,0.22)]" />
      {children}
    </div>
  );
}
