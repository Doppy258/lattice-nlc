import { useState } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { createOffer, type OfferInput } from "../services/offerService";
import { CATEGORY_META } from "../data/catalog";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { Icon } from "../components/common/Icon";
import { OfferForm } from "../components/business/OfferForm";
import { NoBusiness } from "../components/business/NoBusiness";

export function CreateOfferPage() {
  const { activeBusiness, setData } = useApp();
  const [error, setError] = useState<string | null>(null);

  if (!activeBusiness) return <NoBusiness />;

  const publish = (input: OfferInput) => {
    const result = createOffer(input, activeBusiness.id, activeBusiness.category);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setData((prev) => ({ ...prev, offers: [...prev.offers, result.offer] }));
    navigate("/business/offers");
  };

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Create an offer"
        subtitle={`New deal for ${activeBusiness.name} · ${CATEGORY_META[activeBusiness.category].label}`}
      />

      {error && (
        <div className="form-banner form-banner--error" role="alert">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      )}

      <Card className="offer-form-card">
        <OfferForm onSubmit={publish} onCancel={() => navigate("/business/offers")} />
      </Card>
    </>
  );
}
