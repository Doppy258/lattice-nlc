import { useState, type ReactNode } from "react";
import type { Business } from "@/models";
import { Icon, type IconName } from "@/components/common/Icon";
import { CATEGORY_META } from "@/data/catalog";
import { businessImageUrl, unsplash, businessPhotoId } from "@/data/businessImages";
import { cn } from "@/lib/utils";

type BusinessLike = Pick<Business, "id" | "name" | "category"> & { bannerUrl?: string };

/**
 * Storefront photo for a business with a built-in resilient fallback: if the
 * image fails to load (e.g. offline demo mode) it swaps to a clean category-icon
 * tile on a blue tint, so the surface is never broken. A hairline inset ring +
 * top highlight give the liquid-glass edge — depth from shadow, never gradients.
 *
 * The wrapper className controls size/aspect/rounding; pass overlays as children.
 */
export function BusinessImage({
  business,
  className,
  width = 900,
  eager = false,
  iconSize = 30,
  children,
}: {
  business: BusinessLike;
  className?: string;
  width?: number;
  eager?: boolean;
  iconSize?: number;
  children?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const meta = CATEGORY_META[business.category];
  const id = businessPhotoId(business);
  // A business that has uploaded its own banner overrides the auto category photo.
  const custom = business.bannerUrl?.trim() ? business.bannerUrl : null;

  return (
    <div className={cn("relative isolate overflow-hidden bg-[var(--tint-blue)]", className)}>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-card/70 text-primary shadow-[var(--shadow-soft)]">
            <Icon name={meta.icon as IconName} size={iconSize} />
          </span>
        </div>
      ) : (
        <img
          src={custom ?? businessImageUrl(business, width)}
          srcSet={custom ? undefined : `${unsplash(id, width)} 1x, ${unsplash(id, width * 2)} 2x`}
          alt={`${business.name} — ${meta.label.toLowerCase()}`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {/* Liquid-glass edge: inset hairline + top highlight (solid rgba, no gradient). */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(13,30,73,0.07),inset_0_1px_0_rgba(255,255,255,0.22)]" />
      {children}
    </div>
  );
}
