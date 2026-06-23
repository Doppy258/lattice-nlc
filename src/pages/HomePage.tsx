import { useMemo } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { formatCurrency, relativeTime } from "../utils/formatting";
import { CATEGORY_META, DEMO_ORIGINS } from "../data/catalog";
import { getUserReport } from "../services/reportService";
import { getUserClaims } from "../services/claimService";

export function HomePage() {
  const { data, activeUser } = useApp();

  const originName =
    DEMO_ORIGINS.find((o) => o.id === activeUser.homeLocationId)?.name ?? "your area";

  const report = useMemo(
    () =>
      getUserReport(
        activeUser.id,
        {},
        { claims: data.claims, offers: data.offers, businesses: data.businesses, reviews: data.reviews }
      ),
    [activeUser.id, data]
  );

  const offerById = useMemo(() => new Map(data.offers.map((o) => [o.id, o])), [data.offers]);
  const bizById = useMemo(() => new Map(data.businesses.map((b) => [b.id, b])), [data.businesses]);

  const activeClaims = useMemo(
    () => getUserClaims(activeUser.id, data.claims).filter((c) => c.status === "active"),
    [activeUser.id, data.claims]
  );

  const recommended = useMemo(
    () =>
      data.offers
        .filter((o) => o.active && o.originalPrice)
        .sort((a, b) => b.views - a.views)
        .slice(0, 3),
    [data.offers]
  );

  const firstName = activeUser.name.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow="Home"
        title={`What do you need nearby, ${firstName}?`}
        subtitle={`Match with local businesses around ${originName} by budget, timing, distance, and preferences.`}
        actions={
          <>
            <Button onClick={() => navigate("/create-ping")} iconLeft={<Icon name="ping" size={16} />}>
              Create a Ping
            </Button>
            <Button variant="secondary" onClick={() => navigate("/explore")}>
              Explore businesses
            </Button>
          </>
        }
      />

      <section className="metric-grid" aria-label="Your activity">
        <Card className="metric">
          <div className="metric__label">Active claims</div>
          <div className="metric__value">{activeClaims.length}</div>
          <div className="metric__hint">Codes ready to redeem</div>
        </Card>
        <Card className="metric">
          <div className="metric__label">Money saved</div>
          <div className="metric__value">{formatCurrency(report.estimatedSavings)}</div>
          <div className="metric__hint">Across {report.totalRedeemed} redeemed offers</div>
        </Card>
        <Card className="metric">
          <div className="metric__label">Businesses supported</div>
          <div className="metric__value">{report.businessesSupported}</div>
          <div className="metric__hint">Local spots you've visited</div>
        </Card>
        <Card className="metric">
          <div className="metric__label">Saved businesses</div>
          <div className="metric__value">{activeUser.preferences.savedBusinessIds.length}</div>
          <div className="metric__hint">Bookmarked for later</div>
        </Card>
      </section>

      <div className="home-grid">
        <Card>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
            <h2 className="card__title">Active claims</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/claims")}>
              View all
            </Button>
          </div>
          {activeClaims.length === 0 ? (
            <EmptyState
              icon="claims"
              title="No active claims yet"
              body="Create a Ping to find offers you can claim in a couple of clicks."
              actions={<Button size="sm" onClick={() => navigate("/create-ping")}>Create a Ping</Button>}
            />
          ) : (
            <ul className="claim-list">
              {activeClaims.map((claim) => {
                const offer = offerById.get(claim.offerId);
                const biz = bizById.get(claim.businessId);
                return (
                  <li key={claim.id} className="claim-list__item">
                    <div>
                      <div className="claim-list__title">{offer?.title ?? "Offer"}</div>
                      <div className="claim-list__meta">
                        {biz?.name} · expires {relativeTime(claim.expiresAt)}
                      </div>
                    </div>
                    <span className="mono claim-list__code">{claim.claimCode}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
            <h2 className="card__title">Deals worth a look</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/explore")}>
              Browse
            </Button>
          </div>
          <ul className="claim-list">
            {recommended.map((offer) => {
              const biz = bizById.get(offer.businessId);
              const saving = offer.originalPrice ? offer.originalPrice - offer.price : 0;
              return (
                <li key={offer.id} className="claim-list__item">
                  <div>
                    <div className="claim-list__title">{offer.title}</div>
                    <div className="claim-list__meta">
                      {biz?.name} · {CATEGORY_META[offer.category].label}
                    </div>
                  </div>
                  <div className="row" style={{ gap: "var(--space-2)" }}>
                    <span className="mono">{formatCurrency(offer.price)}</span>
                    {saving > 0 && <Badge tone="success">Save {formatCurrency(saving)}</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card style={{ marginTop: "var(--space-6)" }}>
        <h2 className="card__title" style={{ marginBottom: "var(--space-4)" }}>
          Top categories
        </h2>
        <div className="chip-row">
          {(report.claimsByCategory.length > 0
            ? report.claimsByCategory.map((c) => c.label)
            : activeUser.preferences.preferredCategories.map((c) => CATEGORY_META[c].label)
          ).map((label) => (
            <Badge key={label} tone="accent">
              {label}
            </Badge>
          ))}
        </div>
      </Card>
    </>
  );
}
