import { useMemo } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { MetricTile } from "../components/common/MetricTile";
import { RichListRow } from "../components/common/RichListRow";
import { ScrollRail } from "../components/common/ScrollRail";
import { formatCurrency, relativeTime } from "../utils/formatting";
import { ALL_CATEGORIES, CATEGORY_META, DEMO_ORIGINS } from "../data/catalog";
import { getUserReport } from "../services/reportService";
import { getUserClaims } from "../services/claimService";
import { businessImageUrl } from "../utils/businessVisuals";

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

  const categoryLabels = useMemo(() => {
    if (report.claimsByCategory.length > 0) {
      return report.claimsByCategory.map((c) => c.label);
    }
    return activeUser.preferences.preferredCategories.map((c) => CATEGORY_META[c].label);
  }, [report.claimsByCategory, activeUser.preferences.preferredCategories]);

  const firstName = activeUser.name.split(" ")[0];

  return (
    <div className="home-bento">
      <section className="home-command bento-span-full">
        <div className="home-command__copy">
          <span className="radar-kicker">
            <span />
            {originName}
          </span>
          <h1>
            What do you need nearby, {firstName}?
          </h1>
          <p>
            Tell Lattice what you are looking for, then compare nearby offers by distance,
            timing, budget, and fit.
          </p>
          <div className="home-command__actions">
            <Button onClick={() => navigate("/create-ping")} iconLeft={<Icon name="ping" size={16} />}>
              Start a request
            </Button>
            <Button variant="secondary" onClick={() => navigate("/explore")}>
              Explore businesses
            </Button>
          </div>
        </div>
        <div className="home-command__collage" aria-hidden="true">
          {recommended.slice(0, 3).map((offer, index) => {
            const business = bizById.get(offer.businessId);
            if (!business) return null;
            return (
              <img
                key={offer.id}
                className={`home-command__photo home-command__photo--${index + 1}`}
                src={businessImageUrl(business)}
                alt=""
              />
            );
          })}
          <div>
            <strong>{recommended.length}</strong>
            <small>live deals worth scanning</small>
          </div>
        </div>
      </section>

      <div className="bento-grid bento-grid--home bento-span-full">
        <div className="bento-grid bento-grid--metrics">
          <MetricTile label="Active claims" value={activeClaims.length} hint="Codes ready to redeem" />
          <MetricTile
            label="Money saved"
            value={report.estimatedSavings}
            prefix="$"
            hint={`Across ${report.totalRedeemed} redeemed offers`}
          />
          <MetricTile label="Businesses supported" value={report.businessesSupported} hint="Local spots you've visited" />
          <MetricTile
            label="Saved businesses"
            value={activeUser.preferences.savedBusinessIds.length}
            hint="Bookmarked for later"
          />
        </div>

        <Card variant="bento">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
            <h2 className="card__title">Active claims</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/claims")}>
              View all
            </Button>
          </div>
          {activeClaims.length === 0 ? (
            <EmptyState
              variant="ticket"
              title="No active claims yet"
              body="Start a request to find offers you can claim in a couple of clicks."
              actionLabel="Start a request"
              onAction={() => navigate("/create-ping")}
            />
          ) : (
            <div>
              {activeClaims.map((claim) => {
                const offer = offerById.get(claim.offerId);
                const biz = bizById.get(claim.businessId);
                return (
                  <RichListRow
                    key={claim.id}
                    thumbnail={biz ? businessImageUrl(biz) : undefined}
                    title={offer?.title ?? "Offer"}
                    meta={`${biz?.name ?? "Business"} - expires ${relativeTime(claim.expiresAt)}`}
                    trailing={<span className="mono" style={{ color: "var(--accent)" }}>{claim.claimCode}</span>}
                    onClick={() => navigate("/claims")}
                  />
                );
              })}
            </div>
          )}
        </Card>

        <Card variant="bento" className="bento-span-full">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
            <h2 className="card__title">Trending deals</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/explore")}>
              Browse all
            </Button>
          </div>
          <ScrollRail>
            {recommended.map((offer) => {
              const biz = bizById.get(offer.businessId);
              const saving = offer.originalPrice ? offer.originalPrice - offer.price : 0;
              return (
                <div key={offer.id} className="scroll-rail__item">
                  <Card
                    pad
                    interactive
                    style={{ width: 260 }}
                    onClick={() => navigate(`/business/profile?b=${offer.businessId}`)}
                  >
                    {biz && (
                      <img
                        src={businessImageUrl(biz)}
                        alt=""
                        style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: "var(--radius-md)", marginBottom: "var(--space-3)" }}
                      />
                    )}
                    <div className="claim-list__title">{offer.title}</div>
                    <div className="claim-list__meta">{biz?.name}</div>
                    <div className="row" style={{ marginTop: "var(--space-2)" }}>
                      <span className="mono">{formatCurrency(offer.price)}</span>
                      {saving > 0 && <Badge tone="success">Save {formatCurrency(saving)}</Badge>}
                    </div>
                  </Card>
                </div>
              );
            })}
          </ScrollRail>
        </Card>

        <Card variant="bento" className="bento-span-full">
          <h2 className="card__title" style={{ marginBottom: "var(--space-4)" }}>
            Browse by category
          </h2>
          <ScrollRail>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className="scroll-rail__item chip"
                style={{ minWidth: 140, minHeight: 48 }}
                onClick={() => navigate("/explore")}
              >
                {CATEGORY_META[cat].label}
              </button>
            ))}
          </ScrollRail>
          {categoryLabels.length > 0 && (
            <div className="chip-row" style={{ marginTop: "var(--space-4)" }}>
              {categoryLabels.map((label) => (
                <Badge key={label} tone="accent">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
