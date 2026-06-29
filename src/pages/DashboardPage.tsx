/**
 * DashboardPage — route: /dashboard
 *
 * Business owner analytics hub. Shows performance summary (views,
 * redemptions, conversion), claims-over-time bar chart, recent claim
 * activity feed, and a preview of active offers. Only renders when
 * activeBusiness is set.
 */

import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon, type IconName } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { PageHero } from "@/components/common/PageHeader";
import { InsightSummary } from "@/components/common/InsightSummary";
import { EmptyState } from "@/components/common/EmptyState";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { BarColumns } from "@/components/charts/Charts";
import { OfferCard } from "@/components/domain/OfferCard";
import { getBusinessReport } from "@/services/reportService";
import { getActiveOffersForBusiness } from "@/services/businessService";
import { getUserById } from "@/services/userService";
import { CATEGORY_META } from "@/data/catalog";
import { formatCurrency, formatPercent, formatRating, initials, relativeTime } from "@/utils/formatting";
import { claimStatusMeta } from "@/utils/statusMeta";

/** Reusable solid panel with a titled header and an optional trailing accent. */
function Panel({
  title,
  sub,
  icon,
  children,
}: {
  title: string;
  sub?: string;
  icon?: IconName;
  children: React.ReactNode;
}) {
  return (
    <Card variant="solid" className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em]">{title}</h3>
          {sub && <p className="text-[13px] text-muted-foreground">{sub}</p>}
        </div>
        {icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-primary">
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      {children}
    </Card>
  );
}

export function DashboardPage() {
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

  const report = getBusinessReport(
    activeBusiness.id,
    {},
    { claims: data.claims, offers: data.offers, businesses: data.businesses, reviews: data.reviews },
  );
  const activeOffers = getActiveOffersForBusiness(activeBusiness.id, data.offers);
  const recentClaims = data.claims
    .filter((c) => c.businessId === activeBusiness.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);

  const category = CATEGORY_META[activeBusiness.category];

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow={
          <>
            <Icon name={category.icon as IconName} size={13} /> {category.label}
          </>
        }
        title="Welcome back to"
        accent={activeBusiness.name}
        subtitle={`Here's how ${activeBusiness.name} is performing — offer views, claims, redemptions, and the customers showing up at your storefront.`}
        actions={
          <>
            <Button variant="brand" size="lg" iconLeft={<Icon name="createOffer" size={18} />} onClick={() => navigate("/create-offer")}>
              New offer
            </Button>
            <Button variant="secondary" size="lg" iconLeft={<Icon name="redeem" size={18} />} onClick={() => navigate("/redeem")}>
              Redeem a code
            </Button>
          </>
        }
      />

      <InsightSummary
        title="Performance summary"
        items={[
          { label: "Claims", value: report.claims, detail: "Passes created" },
          { label: "Redemptions", value: report.redemptions, detail: "Approved at the counter" },
          { label: "Pending passes", value: report.pending, detail: "Awaiting your approval" },
          { label: "Est. visits driven", value: report.redemptions, detail: "Customers in-store" },
          { label: "Conversion", value: formatPercent(report.conversionRate), detail: "Claims to redeemed" },
          { label: "Top offer", value: report.topOfferTitle ?? "—", detail: "Most redeemed" },
          { label: "Avg rating", value: `${formatRating(report.averageRating)}★`, detail: `${report.reviewCount} reviews` },
          { label: "Active offers", value: activeOffers.length, detail: "Live right now" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Claims over time" sub="Monthly claim volume on your offers" icon="analytics">
          <BarColumns data={report.claimsByMonth} color="var(--primary)" />
        </Panel>

        <Panel title="Recent activity" sub="Latest claims on your offers" icon="claims">
          {recentClaims.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No claims yet — they'll appear here as customers claim your offers.</p>
          ) : (
            <ul className="space-y-2.5">
              {recentClaims.map((c) => {
                const customer = getUserById(c.userId, data.users)?.name ?? "Customer";
                const offer = data.offers.find((o) => o.id === c.offerId);
                const claimMeta = claimStatusMeta(c.status);
                return (
                  <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-[11px] font-semibold text-primary">
                      {initials(customer)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{customer}</p>
                      <p className="truncate text-[13px] text-muted-foreground">{offer?.title ?? "Offer"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={claimMeta.tone}>{claimMeta.label}</Badge>
                      <span className="text-[11px] text-muted-foreground">{relativeTime(c.createdAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.03em]">
              Your active <span className="font-accent font-normal text-primary">offers</span>
            </h2>
            <p className="text-[14px] text-muted-foreground">Previews of exactly what customers see right now.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/offers")}
            className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-accent sm:flex"
          >
            Manage offers <Icon name="arrow" size={15} />
          </button>
        </div>

        {activeOffers.length === 0 ? (
          <EmptyState
            icon="offers"
            title="No active offers yet"
            body="Publish your first offer and it'll start matching with nearby customers right away."
            action={
              <Button variant="brand" iconLeft={<Icon name="createOffer" size={17} />} onClick={() => navigate("/create-offer")}>
                Create your first offer
              </Button>
            }
          />
        ) : (
          <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeOffers.slice(0, 6).map((offer) => (
              <StaggerItem key={offer.id}>
                <OfferCard offer={offer} business={activeBusiness} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}
