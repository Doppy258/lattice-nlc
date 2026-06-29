/**
 * RankingsPage — route: /rankings
 *
 * Personal pairwise-comparison ranking for businesses a user has claimed
 * offers from. Uses binary insertion (startBinaryInsertion / processComparison)
 * to minimise the number of head-to-head choices. Ranked lists are stored
 * per user and category via the rankingService.
 *
 * The ranked list is presented as a tier list (SSS → F). Tiers default to a
 * rating-derived band, but every tile is draggable: dropping it on another tier
 * records a manual override (PersonalRanking.tierOverrides) that wins over the
 * rating band. All eight tiers are always shown so empty bands act as drop
 * targets.
 */

import { useMemo, useState } from "react";
import { motion, type PanInfo } from "motion/react";
import { toast } from "sonner";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RatingStars } from "@/components/common/RatingStars";
import { ChipGroup, ToggleChip } from "@/components/common/ToggleChip";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { BusinessImage } from "@/components/domain/BusinessImage";
import { PairwiseModal } from "@/components/domain/PairwiseModal";
import {
  getRanking,
  insertBusinessAtIndex,
  processComparison,
  startBinaryInsertion,
  upsertRanking,
  type ComparisonAnswer,
  type InsertionSession,
} from "@/services/rankingService";
import { getUserClaimedBusinessIds } from "@/services/claimService";
import { ALL_CATEGORIES, CATEGORY_META } from "@/data/catalog";
import { formatRating } from "@/utils/formatting";
import type { Business, BusinessCategory } from "@/models";

const MEDALS = ["#18498b", "#3372d9", "#8fb6ff"];

/**
 * Tier bands (SSS → F). A business's default band is derived from its average
 * rating; a manual drag can override it. Accents step from the strongest brand
 * navy (SSS) down to a muted neutral (F): blue-forward, solid fills, no
 * gradients. Thresholds are tuned for the typical 3.5–5.0 range.
 */
type Tier = {
  id: string;
  /** Inclusive lower bound on ratingAverage for this band. */
  min: number;
  /** Tiny range caption shown under the badge letter. */
  caption: string;
  /** Solid badge fill. */
  bg: string;
  /** Badge text colour. */
  fg: string;
};

const TIERS: Tier[] = [
  { id: "SSS", min: 4.0, caption: "4.0-5.0", bg: "#18498b", fg: "#ffffff" },
  { id: "SS", min: 3.5, caption: "3.5-4.0", bg: "#2352de", fg: "#ffffff" },
  { id: "S", min: 3.0, caption: "3.0-3.5", bg: "#3372d9", fg: "#ffffff" },
  { id: "A", min: 2.5, caption: "2.5-3.0", bg: "#4d7fe0", fg: "#ffffff" },
  { id: "B", min: 2.0, caption: "2.0-2.5", bg: "#8fb6ff", fg: "#16233c" },
  { id: "C", min: 1.5, caption: "1.5-2.0", bg: "#b9c6de", fg: "#16233c" },
  { id: "D", min: 1.0, caption: "1.0-1.5", bg: "#ccd3e0", fg: "#2f3b57" },
  { id: "F", min: -Infinity, caption: "<1.0", bg: "#dde2ec", fg: "#51618a" },
];

const TIER_IDS = new Set(TIERS.map((t) => t.id));

/** Resolve a rating to its tier band (TIERS is ordered high → low). */
function tierForRating(rating: number): Tier {
  return TIERS.find((t) => rating >= t.min) ?? TIERS[TIERS.length - 1];
}

/** The band a business currently sits in: a manual override wins over rating. */
function effectiveTierId(business: Business, overrides: Record<string, string>): string {
  const override = overrides[business.id];
  return override && TIER_IDS.has(override) ? override : tierForRating(business.ratingAverage).id;
}

/** Pointer position (viewport coords) from a Framer drag event, mouse or touch. */
function clientPoint(event: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } {
  if ("clientX" in event) return { x: event.clientX, y: event.clientY };
  const touch = event.changedTouches[0] ?? event.touches[0];
  return touch ? { x: touch.clientX, y: touch.clientY } : { x: 0, y: 0 };
}

/** The tier id of the drop zone under a viewport point, or null if none. */
function tierIdAtPoint(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  return el?.closest<HTMLElement>("[data-tier-id]")?.dataset.tierId ?? null;
}

export function RankingsPage() {
  const { data, activeUser, setData } = useApp();
  const [category, setCategory] = useState<BusinessCategory>("food");
  const [session, setSession] = useState<InsertionSession | null>(null);
  // Drag state for the tier list: the tile being dragged and the tier it's over.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overTierId, setOverTierId] = useState<string | null>(null);

  const ranking = useMemo(
    () => getRanking(activeUser.id, category, undefined, data.rankings),
    [activeUser.id, category, data.rankings],
  );

  // You can only rank businesses you've actually claimed an offer from — ranking
  // is a verified, post-claim action, mirroring how reviews unlock after redemption.
  const claimedBusinessIds = useMemo(
    () => getUserClaimedBusinessIds(activeUser.id, data.claims),
    [activeUser.id, data.claims],
  );

  const inCategory = useMemo(
    () => data.businesses.filter((b) => b.category === category && claimedBusinessIds.has(b.id)),
    [data.businesses, category, claimedBusinessIds],
  );
  const rankedBusinesses = ranking.rankedBusinessIds
    .map((id) => inCategory.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => !!b);
  const unranked = inCategory.filter((b) => !ranking.rankedBusinessIds.includes(b.id));

  const overrides = ranking.tierOverrides ?? {};

  // Group the personal ranking into tiers. Every tier is kept (even empty ones)
  // so it can act as a drop target. Each business carries its global rank
  // (1-based, best-first) so the medal motif stays meaningful within a band.
  const ranked = rankedBusinesses.map((business, i) => ({ business, rank: i + 1 }));
  const tierGroups = TIERS.map((tier) => ({
    tier,
    items: ranked.filter(({ business }) => effectiveTierId(business, overrides) === tier.id),
  }));

  function finalize(s: InsertionSession) {
    setData((d) => {
      const current = getRanking(activeUser.id, s.category, s.needType, d.rankings);
      const updated = insertBusinessAtIndex(current, s.newBusinessId, s.insertIndex ?? current.rankedBusinessIds.length);
      return { ...d, rankings: upsertRanking(d.rankings, updated) };
    });
    const name = data.businesses.find((b) => b.id === s.newBusinessId)?.name ?? "Business";
    toast.success(`${name} added to your ${CATEGORY_META[s.category].label} ranking`);
  }

  function beginRanking(businessId: string) {
    const s = startBinaryInsertion(activeUser.id, businessId, category, undefined, data.rankings);
    if (s.compareToId === null) {
      finalize(s);
    } else {
      setSession(s);
    }
  }

  function answer(a: ComparisonAnswer) {
    if (!session) return;
    const next = processComparison(session, a);
    if (next.compareToId === null) {
      finalize(next);
      setSession(null);
    } else {
      setSession(next);
    }
  }

  function removeFromRanking(businessId: string) {
    setData((d) => {
      const current = getRanking(activeUser.id, category, undefined, d.rankings);
      const nextOverrides = { ...(current.tierOverrides ?? {}) };
      delete nextOverrides[businessId];
      const updated = {
        ...current,
        rankedBusinessIds: current.rankedBusinessIds.filter((id) => id !== businessId),
        tierOverrides: nextOverrides,
        updatedAt: new Date().toISOString(),
      };
      return { ...d, rankings: upsertRanking(d.rankings, updated) };
    });
  }

  /** Record a manual tier placement; dropping a tile back on its rating-derived
   *  band clears the override so it follows its rating again. */
  function moveToTier(business: Business, tierId: string) {
    const naturalTier = tierForRating(business.ratingAverage).id;
    setData((d) => {
      const current = getRanking(activeUser.id, category, undefined, d.rankings);
      const nextOverrides = { ...(current.tierOverrides ?? {}) };
      if (tierId === naturalTier) delete nextOverrides[business.id];
      else nextOverrides[business.id] = tierId;
      const updated = {
        ...current,
        tierOverrides: nextOverrides,
        updatedAt: new Date().toISOString(),
      };
      return { ...d, rankings: upsertRanking(d.rankings, updated) };
    });
    const tierLabel = tierId === naturalTier ? "auto" : tierId;
    toast.success(`${business.name} moved to ${tierLabel === "auto" ? "its rating band" : `tier ${tierLabel}`}`);
  }

  function handleDrag(event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) {
    const { x, y } = clientPoint(event);
    const next = tierIdAtPoint(x, y);
    setOverTierId((prev) => (prev === next ? prev : next));
  }

  function handleDragEnd(business: Business, event: MouseEvent | TouchEvent | PointerEvent) {
    const { x, y } = clientPoint(event);
    const target = tierIdAtPoint(x, y);
    if (target && target !== effectiveTierId(business, overrides)) moveToTier(business, target);
    setDraggingId(null);
    setOverTierId(null);
  }

  const newBusiness = session ? data.businesses.find((b) => b.id === session.newBusinessId) : undefined;
  const compareBusiness = session ? data.businesses.find((b) => b.id === session.compareToId) : undefined;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Your personal"
        accent="rankings"
        subtitle="Rank the businesses whose offers you've claimed with quick head-to-head comparisons. Lattice uses binary insertion, so you only answer a handful of questions to place each one."
      />

      <ChipGroup>
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

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em]">
              Your <span className="font-accent font-normal text-primary">{CATEGORY_META[category].label}</span> tier
              list
            </h2>
            {rankedBusinesses.length > 0 && (
              <p className="text-[12.5px] text-muted-foreground">
                Banded SSS to F by rating — drag any tile onto another tier to place it yourself.
              </p>
            )}
          </div>
          {rankedBusinesses.length === 0 ? (
            <Card variant="glassBlue" className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't ranked any {CATEGORY_META[category].label.toLowerCase()} spots yet. Add one from the right to
                start your personal tier list.
              </p>
            </Card>
          ) : (
            <Stagger className="space-y-2.5">
              {tierGroups.map(({ tier, items }) => {
                const isDropTarget = draggingId !== null && overTierId === tier.id;
                return (
                  <StaggerItem key={tier.id}>
                    <Card
                      variant="solid"
                      data-tier-id={tier.id}
                      className={cn(
                        "flex items-stretch overflow-hidden transition-shadow",
                        isDropTarget && "ring-2 ring-primary ring-offset-1 ring-offset-[var(--background)]",
                      )}
                      style={{ background: `color-mix(in oklab, ${tier.bg} 6%, var(--card))` }}
                    >
                      {/* Tier badge column — the classic tier-list label block. */}
                      <div
                        className="flex w-[60px] shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-3 text-center sm:w-[76px]"
                        style={{ background: tier.bg, color: tier.fg }}
                      >
                        <span className="font-display text-[20px] font-bold leading-none tracking-[-0.04em] sm:text-[24px]">
                          {tier.id}
                        </span>
                        <span
                          className="mono whitespace-nowrap text-[9px] font-medium tabular-nums sm:text-[10px]"
                          style={{ color: tier.fg, opacity: 0.72 }}
                        >
                          {tier.caption}
                        </span>
                      </div>

                      {/* Businesses in this tier — wrap as tiles on narrow columns. */}
                      <div className="flex min-h-[76px] min-w-0 flex-1 flex-wrap content-center items-start gap-2 p-2.5">
                        {items.length === 0 ? (
                          <span
                            className={cn(
                              "m-auto select-none rounded-lg border border-dashed px-3 py-2 text-[11.5px] transition-colors",
                              isDropTarget
                                ? "border-primary/60 text-primary"
                                : "border-border/70 text-muted-foreground/70",
                            )}
                          >
                            {isDropTarget ? "Release to place here" : "Empty — drop a spot here"}
                          </span>
                        ) : (
                          items.map(({ business: b, rank }) => (
                            <motion.div
                              key={b.id}
                              drag
                              dragSnapToOrigin
                              dragMomentum={false}
                              onDragStart={() => setDraggingId(b.id)}
                              onDrag={handleDrag}
                              onDragEnd={(event) => handleDragEnd(b, event)}
                              whileHover={{ y: -2 }}
                              whileDrag={{
                                scale: 1.05,
                                zIndex: 50,
                                boxShadow: "0 18px 40px -14px rgba(10,18,32,0.5)",
                                cursor: "grabbing",
                              }}
                              transition={{ type: "spring", stiffness: 420, damping: 30 }}
                              style={{
                                touchAction: "none",
                                pointerEvents: draggingId === b.id ? "none" : undefined,
                              }}
                              className="group relative w-[104px] shrink-0 cursor-grab active:cursor-grabbing sm:w-[116px]"
                            >
                              <button
                                type="button"
                                onClick={() => navigate(`/business?id=${b.id}`)}
                                aria-label={`View ${b.name}`}
                                className="block w-full cursor-pointer text-left"
                              >
                                <div className="relative">
                                  <BusinessImage
                                    business={b}
                                    width={260}
                                    className="pointer-events-none aspect-square w-full rounded-xl"
                                    iconSize={22}
                                  />
                                  {/* Personal rank — keeps the medal motif for the top 3. */}
                                  <span
                                    className="absolute left-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-semibold tabular-nums text-white shadow-[var(--shadow-soft)]"
                                    style={{ background: rank <= 3 ? MEDALS[rank - 1] : "rgba(10,18,32,0.6)" }}
                                  >
                                    {rank}
                                  </span>
                                </div>
                                <p className="mt-1.5 truncate font-display text-[12.5px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">
                                  {b.name}
                                </p>
                                <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <RatingStars rating={b.ratingAverage} size={10} /> {formatRating(b.ratingAverage)}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFromRanking(b.id)}
                                aria-label={`Remove ${b.name} from ranking`}
                                className="absolute right-1.5 top-1.5 grid size-6 cursor-pointer place-items-center rounded-full bg-card/90 text-muted-foreground opacity-100 shadow-[var(--shadow-soft)] backdrop-blur transition-all hover:text-destructive active:scale-90 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                              >
                                <Icon name="close" size={13} />
                              </button>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </Card>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em]">Add to your ranking</h2>
          {inCategory.length === 0 ? (
            <EmptyState
              icon="claims"
              title="Nothing to rank yet"
              body={`Claim an offer from a ${CATEGORY_META[category].label.toLowerCase()} business and it'll show up here, ready to rank.`}
              action={
                <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/explore")}>
                  Explore offers
                </Button>
              }
            />
          ) : unranked.length === 0 ? (
            <EmptyState
              icon="rankings"
              title="Everything's ranked"
              body={`You've ranked every ${CATEGORY_META[category].label.toLowerCase()} business you've claimed. Try another category.`}
            />
          ) : (
            <div className="space-y-2.5">
              {unranked.map((b) => (
                <Card key={b.id} variant="solid" className="flex items-center gap-3 p-3">
                  <BusinessImage business={b} width={200} className="size-12 shrink-0 rounded-xl" iconSize={18} />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-display text-[15px] font-semibold tracking-[-0.02em]">{b.name}</h4>
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <RatingStars rating={b.ratingAverage} size={12} /> {formatRating(b.ratingAverage)}
                    </span>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => beginRanking(b.id)}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--brand-tint)] px-3 py-1.5 text-[13px] font-semibold text-[var(--primary-strong)] transition-colors hover:bg-accent"
                  >
                    <Icon name="plus" size={14} /> Rank
                  </motion.button>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {session && newBusiness && compareBusiness && (
        <PairwiseModal
          open={!!session}
          onOpenChange={(o) => !o && setSession(null)}
          newBusiness={newBusiness}
          compareBusiness={compareBusiness}
          comparison={session.comparisons + 1}
          onAnswer={answer}
        />
      )}
    </div>
  );
}
