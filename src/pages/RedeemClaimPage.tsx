import { useMemo, useState } from "react";
import { useApp } from "../app/providers";
import { getBusinessClaims, redeemClaim } from "../services/claimService";
import { byDate } from "../utils/sorting";
import { relativeTime } from "../utils/formatting";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { RedeemPanel, type RedeemView } from "../components/business/RedeemPanel";
import { NoBusiness } from "../components/business/NoBusiness";

export function RedeemClaimPage() {
  const { data, setData, activeBusiness } = useApp();
  const [result, setResult] = useState<RedeemView>(null);

  const offerById = useMemo(() => new Map(data.offers.map((o) => [o.id, o])), [data.offers]);
  const userById = useMemo(() => new Map(data.users.map((u) => [u.id, u])), [data.users]);

  const recent = useMemo(() => {
    if (!activeBusiness) return [];
    return [...getBusinessClaims(activeBusiness.id, data.claims)]
      .filter((c) => c.status === "redeemed")
      .sort(byDate((c) => c.redeemedAt ?? c.createdAt, "desc"))
      .slice(0, 8);
  }, [activeBusiness, data.claims]);

  if (!activeBusiness) return <NoBusiness />;

  const handleRedeem = (code: string) => {
    const outcome = redeemClaim(code, activeBusiness.id, data.claims);
    if (!outcome.ok) {
      setResult({ ok: false, error: outcome.error });
      return;
    }
    const claim = outcome.claim;
    setData((prev) => ({
      ...prev,
      claims: prev.claims.map((c) => (c.id === claim.id ? claim : c)),
    }));
    const offer = offerById.get(claim.offerId);
    const user = userById.get(claim.userId);
    setResult({
      ok: true,
      code: claim.claimCode,
      offerTitle: offer?.title ?? "Offer",
      customerName: user?.name ?? "Customer",
      price: offer?.price ?? 0,
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Redeem a claim"
        subtitle={`Verify a customer's code at ${activeBusiness.name} to mark it redeemed.`}
      />

      <Card className="redeem-card">
        <RedeemPanel result={result} onSubmit={handleRedeem} onClear={() => setResult(null)} />
      </Card>

      <section className="profile-section" style={{ marginTop: "var(--space-8)" }}>
        <h2 className="section-title">Recent redemptions</h2>
        {recent.length === 0 ? (
          <EmptyState
            icon="redeem"
            title="No redemptions yet"
            body="Redeemed codes will appear here so you can track recent visits."
          />
        ) : (
          <Card pad={false}>
            <ul className="dash-claim-list">
              {recent.map((claim) => {
                const offer = offerById.get(claim.offerId);
                const user = userById.get(claim.userId);
                return (
                  <li key={claim.id} className="dash-claim">
                    <div>
                      <p className="dash-claim__offer">{offer?.title ?? "Offer"}</p>
                      <p className="dash-claim__sub">
                        {user?.name.split(" ")[0] ?? "Customer"} · Redeemed{" "}
                        {relativeTime(claim.redeemedAt ?? claim.createdAt)}
                      </p>
                    </div>
                    <span className="dash-claim__right">
                      <Icon name="check" size={16} className="redeem-result__icon-inline" />
                      <span className="mono dash-claim__code">{claim.claimCode}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </>
  );
}
