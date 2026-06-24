import { useState } from "react";
import { useApp } from "../app/providers";
import { PageHero } from "../components/layout/PageHero";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { Icon } from "../components/common/Icon";

export function DemoControlsPage() {
  const { data, resetDemo } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const claimsByStatus = (status: string) =>
    data.claims.filter((c) => c.status === status).length;

  const counts: { label: string; value: number }[] = [
    { label: "Users", value: data.users.length },
    { label: "Businesses", value: data.businesses.length },
    { label: "Offers", value: data.offers.length },
    { label: "Reviews", value: data.reviews.length },
    { label: "Rankings", value: data.rankings.length },
    { label: "Requests", value: data.requests.length },
    { label: "Active claims", value: claimsByStatus("active") },
    { label: "Redeemed claims", value: claimsByStatus("redeemed") },
    { label: "Expired claims", value: claimsByStatus("expired") },
    { label: "Saved businesses", value: data.savedBusinesses.length },
    { label: "Saved offers", value: data.savedOffers.length },
  ];

  const handleReset = () => {
    resetDemo();
    setConfirmOpen(false);
  };

  return (
    <>
      <PageHero
        variant="compact"
        kicker="Admin demo"
        title="Demo controls"
        subtitle="Inspect the seeded dataset that powers the app, and reset everything to its original state."
        actions={
          <Button variant="danger" onClick={() => setConfirmOpen(true)} iconLeft={<Icon name="demo" size={16} />}>
            Reset demo data
          </Button>
        }
      />

      <Card variant="bento">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
          <h2 className="card__title">Seed data viewer</h2>
          <Badge tone="success" dot>
            Persisted locally
          </Badge>
        </div>
        <div className="data-grid">
          {counts.map((c) => (
            <div key={c.label} className="data-grid__cell">
              <div className="data-grid__num">{c.value}</div>
              <div className="data-grid__label">{c.label}</div>
            </div>
          ))}
        </div>
        <hr className="divider" />
        <p className="metric__hint">
          All data lives in <span className="mono">localStorage</span> and persists across refreshes.
          Resetting regenerates the seeded users, businesses, offers, claims, reviews, and rankings.
        </p>
      </Card>

      <Modal
        open={confirmOpen}
        title="Reset demo data?"
        onClose={() => setConfirmOpen(false)}
        footer={
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Reset everything
            </Button>
          </div>
        }
      >
        <p style={{ color: "var(--text-muted)" }}>
          This clears every request, claim, review, and bookmark you've created and restores the
          original seeded dataset. This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
