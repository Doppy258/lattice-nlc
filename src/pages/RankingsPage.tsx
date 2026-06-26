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
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em]">
            Your <span className="font-accent font-normal text-primary">{CATEGORY_META[category].label}</span> order
          </h2>
          {rankedBusinesses.length === 0 ? (
            <Card variant="glassBlue" className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't ranked any {CATEGORY_META[category].label.toLowerCase()} spots yet. Add one from the right to
                start your personal leaderboard.
              </p>
            </Card>
          ) : (
            <Stagger className="space-y-2.5">
              {rankedBusinesses.map((b, i) => (
                <StaggerItem key={b.id}>
                  <Card variant="solid" className="flex items-center gap-3 p-3">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-white"
                      style={{ background: MEDALS[i] ?? "var(--muted-foreground)" }}
                    >
                      {i + 1}
                    </span>
                    <BusinessImage business={b} width={200} className="size-12 shrink-0 rounded-xl" iconSize={18} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/business?id=${b.id}`)}
                        className="block max-w-full cursor-pointer truncate text-left font-display text-[15px] font-semibold tracking-[-0.02em] transition-colors hover:text-primary"
                      >
                        {b.name}
                      </button>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <RatingStars rating={b.ratingAverage} size={12} /> {formatRating(b.ratingAverage)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromRanking(b.id)}
                      aria-label={`Remove ${b.name} from ranking`}
                      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive active:scale-90"
                    >
                      <Icon name="close" size={16} />
                    </button>
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
