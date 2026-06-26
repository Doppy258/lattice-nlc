/**
 * ReviewsPage - /reviews.
 * Purpose: Business owner's review dashboard — shows verified customer
 * reviews with rating breakdown, common mention tags, and individual
 * review cards.
 * Key flows: Aggregates distribution (1–5★), top tags by frequency,
 * chronologically sorted review list.
 */
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RatingStars } from "@/components/common/RatingStars";
import { BarList } from "@/components/charts/Charts";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { getBusinessReviews } from "@/services/reviewService";
import { getUserById } from "@/services/userService";
import { formatRating, initials, relativeTime } from "@/utils/formatting";
import type { SeriesPoint } from "@/models";

export function ReviewsPage() {
  const { data, activeBusiness } = useApp();

  if (!activeBusiness) {
    return (
      <EmptyState
        icon="store"
        title="No business selected"
        body="This is the business workspace. Create your storefront in onboarding, or sign in with a business account to manage your offers."
        action={
          <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/home")}>
            Back to Home
          </Button>
        }
      />
    );
  }

  const reviews = getBusinessReviews(activeBusiness.id, data.reviews);

  const distribution: SeriesPoint[] = [5, 4, 3, 2, 1].map((star) => ({
    label: `${star}★`,
    value: reviews.filter((r) => r.rating === star).length,
  }));

  const tagCounts = new Map<string, number>();
  for (const r of reviews) {
    for (const t of r.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Your"
        accent="reviews"
        subtitle="Verified feedback from customers who redeemed your offers."
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon="reviews"
          title="No reviews yet"
          body="Verified reviews appear here after customers redeem one of your offers and share how it went."
        />
      ) : (
        <>
          <Card
            variant="glassBlue"
            className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8"
          >
            <div className="text-center sm:text-left">
              <div className="font-display text-[48px] font-semibold leading-none tracking-[-0.03em] text-[var(--primary-strong)]">
                {formatRating(activeBusiness.ratingAverage)}
              </div>
              <RatingStars
                rating={activeBusiness.ratingAverage}
                size={16}
                className="mt-2 justify-center sm:justify-start"
              />
              <div className="mt-1.5 text-[13px] text-muted-foreground">
                {activeBusiness.reviewCount} verified reviews
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Rating breakdown
              </div>
              <BarList data={distribution} />
            </div>
          </Card>

          {topTags.length > 0 && (
            <Card variant="solid" className="space-y-3.5 p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">
                What customers mention
              </h2>
              <div className="flex flex-wrap gap-2">
                {topTags.map(([tag, count]) => (
                  <Badge key={tag} tone="brand">
                    {tag}
                    <span className="ml-0.5 rounded-full bg-card/70 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                      {count}
                    </span>
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          <Stagger className="space-y-3">
            {reviews.map((r) => {
              const author = getUserById(r.userId, data.users);
              return (
                <StaggerItem key={r.id}>
                  <Card variant="solid" className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-[var(--primary-strong)]">
                          {initials(author?.name ?? "Customer")}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold">
                            {author?.name ?? "Customer"}
                            {r.verified && <Icon name="check" size={13} className="text-primary" />}
                          </div>
                          <RatingStars rating={r.rating} size={13} className="mt-0.5" />
                        </div>
                      </div>
                      <span className="shrink-0 text-[12px] text-muted-foreground">
                        {relativeTime(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">{r.text}</p>
                    {r.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {r.tags.map((t) => (
                          <Badge key={t} tone="neutral">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        </>
      )}
    </div>
  );
}
