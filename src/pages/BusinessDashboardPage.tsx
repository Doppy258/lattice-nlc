import { useMemo } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { getBusinessReport } from "../services/reportService";
import { getBusinessClaims } from "../services/claimService";
import { getActiveOffersForBusiness } from "../services/businessService";
import { byDate } from "../utils/sorting";
import { formatCurrency, formatPercent, relativeTime, initials } from "../utils/formatting";
import { PageHero } from "../components/layout/PageHero";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { MetricTile } from "../components/common/MetricTile";
import { RichListRow } from "../components/common/RichListRow";
import { NoBusiness } from "../components/business/NoBusiness";

const STATUS_TONE = {
  active: "accent",
  redeemed: "success",
  expired: "neutral",
  cancelled: "neutral",
} as const;

const QUICK_ACTIONS = [
  { icon: "offers" as const, title: "Offers", body: "Edit, pause, or remove deals.", path: "/business/offers" },
  { icon: "reviews" as const, title: "Reviews", body: "Verified customer feedback.", path: "/business/reviews" },
  { icon: "analytics" as const, title: "Analytics", body: "Trends and conversion.", path: "/business/analytics" },
  { icon: "explore" as const, title: "Public profile", body: "View as customers see it.", path: "" },
];

export function BusinessDashboardPage() {
  const { data, activeBusiness } = useApp();

  const report = useMemo(
    () => (activeBusiness ? getBusinessReport(activeBusiness.id, {}, data) : null),
    [activeBusiness, data]
  );

  const recentClaims = useMemo(() => {
    if (!activeBusiness) return [];
    return [...getBusinessClaims(activeBusiness.id, data.claims)]
      .sort(byDate((c) => c.createdAt, "desc"))
      .slice(0, 6);
  }, [activeBusiness, data.claims]);

  const activeOffers = useMemo(
    () => (activeBusiness ? getActiveOffersForBusiness(activeBusiness.id, data.offers).length : 0),
    [activeBusiness, data.offers]
  );

  const offerById = useMemo(() => new Map(data.offers.map((o) => [o.id, o])), [data.offers]);
  const userById = useMemo(() => new Map(data.users.map((u) => [u.id, u])), [data.users]);

  if (!activeBusiness || !report) return <NoBusiness />;

  return (
    <>
      <PageHero
        variant="split"
        kicker="Business"
        title={
          <>
            {activeBusiness.name}
          </>
        }
        subtitle="Offer performance at a glance, with quick access to the tools you use most."
        aside={
          <div className="page-hero__stat-pill">
            <strong>{report.claims}</strong>
            <span>total claims</span>
          </div>
        }
        actions={
          <>
            <Button onClick={() => navigate("/business/create-offer")} iconLeft={<Icon name="createOffer" size={16} />}>
              Create offer
            </Button>
            <Button variant="secondary" onClick={() => navigate("/business/redeem")} iconLeft={<Icon name="redeem" size={16} />}>
              Redeem code
            </Button>
          </>
        }
      />

      <div className="bento-grid bento-grid--metrics" style={{ marginBottom: "var(--space-6)" }}>
        <MetricTile label="Offer views" value={report.offerViews} />
        <MetricTile label="Redemptions" value={report.redemptions} hint={`${formatPercent(report.conversionRate)} conversion`} />
        <MetricTile label="Active offers" value={activeOffers} />
        <MetricTile
          label="Avg rating"
          value={report.reviewCount > 0 ? report.averageRating : 0}
          hint={report.reviewCount > 0 ? `${report.reviewCount} reviews` : "No reviews yet"}
        />
        <MetricTile label="Revenue influenced" value={report.revenueInfluenced} prefix="$" />
      </div>

      <div className="dashboard-columns">
        <section className="profile-section">
          <div className="dashboard-section__head">
            <h2 className="section-title">Recent claims</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/business/redeem")}>
              Redeem a code
            </Button>
          </div>
          {recentClaims.length === 0 ? (
            <EmptyState variant="ticket" title="No claims yet" body="When customers claim your offers, their codes show up here." />
          ) : (
            <Card variant="inset" pad={false}>
              {recentClaims.map((claim) => {
                const offer = offerById.get(claim.offerId);
                const user = userById.get(claim.userId);
                return (
                  <RichListRow
                    key={claim.id}
                    initials={user ? initials(user.name) : "?"}
                    title={offer?.title ?? "Offer"}
                    meta={`${user?.name.split(" ")[0] ?? "Customer"} - ${relativeTime(claim.createdAt)}`}
                    trailing={
                      <>
                        <span className="mono" style={{ fontSize: "var(--text-sm)" }}>{claim.claimCode}</span>
                        <Badge tone={STATUS_TONE[claim.status]}>{claim.status}</Badge>
                      </>
                    }
                  />
                );
              })}
            </Card>
          )}
        </section>

        <section className="profile-section">
          <h2 className="section-title">Manage</h2>
          <div className="action-tiles">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.title}
                type="button"
                className="action-tile"
                onClick={() =>
                  navigate(
                    action.path ||
                      `/business/profile?b=${activeBusiness.id}`
                  )
                }
              >
                <span className="action-tile__icon">
                  <Icon name={action.icon} size={20} />
                </span>
                <span className="action-tile__title">{action.title}</span>
                <span className="action-tile__body">{action.body}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
