/**
 * RankingsPage — route: /rankings
 *
 * Personal pairwise-comparison ranking for businesses a user has claimed
 * offers from. Uses binary insertion (startBinaryInsertion / processComparison)
 * to minimise the number of head-to-head choices. Ranked lists are stored
 * per user and category via the rankingService.
 */

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
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
import type { BusinessCategory } from "@/models";

const MEDALS = ["#18498b", "#3372d9", "#8fb6ff"];

/**
 * Tier bands (SSS → F) derived from a business's average rating. The data model
 * only stores an ordered, best-first list — no explicit tiers — so we bucket by
 * rating and preserve the user's personal order WITHIN each band. Accents step
 * from the strongest brand navy (SSS) down to a muted neutral (F): blue-forward,
 * solid fills, no gradients. Thresholds are tuned for the typical 3.5–5.0 range.
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
  { id: "SSS", min: 4.8, caption: "4.8+", bg: "#18498b", fg: "#ffffff" },
  { id: "SS", min: 4.6, caption: "4.6+", bg: "#2352de", fg: "#ffffff" },
  { id: "S", min: 4.4, caption: "4.4+", bg: "#3372d9", fg: "#ffffff" },
  { id: "A", min: 4.2, caption: "4.2+", bg: "#4d7fe0", fg: "#ffffff" },
  { id: "B", min: 4.0, caption: "4.0+", bg: "#8fb6ff", fg: "#16233c" },
  { id: "C", min: 3.7, caption: "3.7+", bg: "#b9c6de", fg: "#16233c" },
  { id: "D", min: 3.3, caption: "3.3+", bg: "#ccd3e0", fg: "#2f3b57" },
  { id: "F", min: -Infinity, caption: "<3.3", bg: "#dde2ec", fg: "#51618a" },
];

/** Resolve a rating to its tier band (TIERS is ordered high → low). */
function tierForRating(rating: number): Tier {
  return TIERS.find((t) => rating >= t.min) ?? TIERS[TIERS.length - 1];
}

export function RankingsPage() {
  const { data, activeUser, setData } = useApp();
  const [category, setCategory] = useState<BusinessCategory>("food");
  const [session, setSession] = useState<InsertionSession | null>(null);

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

  // Group the personal ranking into rating-derived tiers. Carry each business's
  // global rank (1-based, best-first) so within-tier order follows the user's
  // head-to-head picks, and only keep tiers that actually contain something.
  const tierGroups = TIERS.map((tier) => ({
    tier,
    items: rankedBusinesses
      .map((business, i) => ({ business, rank: i + 1 }))
      .filter(({ business }) => tierForRating(business.ratingAverage).id === tier.id),
  })).filter((group) => group.items.length > 0);

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
      const updated = {
        ...current,
        rankedBusinessIds: current.rankedBusinessIds.filter((id) => id !== businessId),
        updatedAt: new Date().toISOString(),
      };
      return { ...d, rankings: upsertRanking(d.rankings, updated) };
    });
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
                Banded SSS to F by rating, ordered left-to-right by your head-to-head picks.
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
              {tierGroups.map(({ tier, items }) => (
                <StaggerItem key={tier.id}>
                  <Card
                    variant="solid"
                    className="flex items-stretch overflow-hidden"
                    style={{ background: `color-mix(in oklab, ${tier.bg} 6%, var(--card))` }}
                  >
                    {/* Tier badge column — the classic tier-list label block. */}
                    <div
                      className="flex w-[56px] shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-3 text-center sm:w-[72px]"
                      style={{ background: tier.bg, color: tier.fg }}
                    >
                      <span className="font-display text-[20px] font-bold leading-none tracking-[-0.04em] sm:text-[24px]">
                        {tier.id}
                      </span>
                      <span className="mono text-[10px] font-medium tabular-nums" style={{ color: tier.fg, opacity: 0.72 }}>
                        {tier.caption}
                      </span>
                    </div>

                    {/* Businesses in this tier — wrap as tiles on narrow columns. */}
                    <div className="flex min-w-0 flex-1 flex-wrap items-start gap-2 p-2.5">
                      {items.map(({ business: b, rank }) => (
                        <motion.div
                          key={b.id}
                          className="group relative w-[104px] shrink-0 sm:w-[116px]"
                          whileHover={{ y: -2 }}
                          transition={{ type: "spring", stiffness: 420, damping: 30 }}
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
                                className="aspect-square w-full rounded-xl"
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
                      ))}
                    </div>
                  </Card>
                </StaggerItem>
              ))}
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
