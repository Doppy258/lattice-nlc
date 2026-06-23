import { useMemo } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { getBusinessReport } from "../services/reportService";
import { getBusinessClaims } from "../services/claimService";
import { getActiveOffersForBusiness } from "../services/businessService";
import { byDate } from "../utils/sorting";
import { formatCurrency, formatPercent, formatRating, relativeTime } from "../utils/formatting";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { StatCard } from "../components/business/StatCard";
import { NoBusiness } from "../components/business/NoBusiness";

const STATUS_TONE = {
  active: "accent",
  redeemed: "success",
  expired: "neutral",
  cancelled: "neutral",
} as const;

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
      <PageHeader
        eyebrow="Business"
        title={activeBusiness.name}
        subtitle="Offer performance at a glance, with quick access to the tools you use most."
        actions={
          <>
            <Button
              onClick={() => navigate("/business/create-offer")}
              iconLeft={<Icon name="createOffer" size={16} />}
            >
              Create offer
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/business/redeem")}
              iconLeft={<Icon name="redeem" size={16} />}
            >
              Redeem code
            </Button>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard icon="reports" label="Offer views" value={report.offerViews.toLocaleString()} />
        <StatCard icon="ticket" label="Total claims" value={String(report.claims)} />
        <StatCard
          icon="redeem"
          label="Redemptions"
          value={String(report.redemptions)}
          caption={`${formatPercent(report.conversionRate)} conversion`}
        />
        <StatCard icon="offers" label="Active offers" value={String(activeOffers)} />
        <StatCard
          icon="star"
          label="Avg rating"
          value={report.reviewCount > 0 ? formatRating(report.averageRating) : "—"}
          caption={`${report.reviewCount} reviews`}
        />
        <StatCard
          icon="analytics"
          label="Revenue influenced"
          value={formatCurrency(report.revenueInfluenced)}
        />
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
            <EmptyState
              icon="ticket"
              title="No claims yet"
              body="When customers claim your offers, their codes show up here."
            />
          ) : (
            <Card pad={false}>
              <ul className="dash-claim-list">
                {recentClaims.map((claim) => {
                  const offer = offerById.get(claim.offerId);
                  const user = userById.get(claim.userId);
                  return (
                    <li key={claim.id} className="dash-claim">
                      <div>
                        <p className="dash-claim__offer">{offer?.title ?? "Offer"}</p>
                        <p className="dash-claim__sub">
                          {user?.name.split(" ")[0] ?? "Customer"} · {relativeTime(claim.createdAt)}
                        </p>
                      </div>
                      <div className="dash-claim__right">
                        <span className="mono dash-claim__code">{claim.claimCode}</span>
                        <Badge tone={STATUS_TONE[claim.status]}>{claim.status}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>

        <section className="profile-section">
          <h2 className="section-title">Manage</h2>
          <div className="dashboard-links">
            <DashLink
              icon="offers"
              title="Offers"
              body="Edit, pause, or remove your active deals."
              onClick={() => navigate("/business/offers")}
            />
            <DashLink
              icon="reviews"
              title="Reviews"
              body="See verified customer feedback."
              onClick={() => navigate("/business/reviews")}
            />
            <DashLink
              icon="analytics"
              title="Analytics"
              body="Trends, conversion, and top tags."
              onClick={() => navigate("/business/analytics")}
            />
            <DashLink
              icon="explore"
              title="Public profile"
              body="View your storefront as customers see it."
              onClick={() => navigate(`/business/profile?b=${activeBusiness.id}`)}
            />
          </div>
        </section>
      </div>
    </>
  );
}

function DashLink({
  icon,
  title,
  body,
  onClick,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button className="dash-link" onClick={onClick}>
      <span className="dash-link__icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="dash-link__text">
        <span className="dash-link__title">{title}</span>
        <span className="dash-link__body">{body}</span>
      </span>
      <Icon name="arrow" size={16} className="dash-link__arrow" />
    </button>
  );
}
